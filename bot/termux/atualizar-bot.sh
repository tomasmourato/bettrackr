#!/data/data/com.termux/files/usr/bin/bash
# atualizar-bot.sh - põe no telemóvel a versão nova do bot da Betclic e do
# agente do CLV. Nenhum dos dois vem no deploy da Vercel.
#
#   bash atualizar-bot.sh                          bot.mjs novo das Transferências
#   bash atualizar-bot.sh http://PC:8765/bot.mjs   bot.mjs novo servido pelo PC
#   bash atualizar-bot.sh /caminho/para/bot.mjs
#
# O que faz:
#   1. Encontra o bot e o agente pelas linhas do crontab (as mesmas que o
#      religar-bot.sh lê), seguindo os 'cd' e o run.sh se houver.
#   2. Bot: troca o bot.mjs pelo novo (npm run build:bot no PC). O bot é privado
#      e não está publicado, por isso o ficheiro vem do PC. Se o bot correr do
#      repositório clonado (src/index.ts), faz git pull.
#   3. Agente do CLV: descarrega-o de https://bettrackr.dev/clv-agent.mjs, que
#      sai em cada deploy.
#   4. Antes de trocar confirma que o ficheiro é mesmo o novo e que o Node o
#      aceita. O anterior fica ao lado, com .anterior, para voltar atrás.
#   5. Corre uma passagem de cada e diz o que viu.
#
# Não toca nos cofres (passkey-*.enc, session-*.enc), no bot.env nem no crontab.

set -u

verde() { printf '\033[32m✔\033[0m %s\n' "$*"; }
aviso() { printf '\033[33m!\033[0m %s\n' "$*"; }
erro() { printf '\033[31m✘\033[0m %s\n' "$*"; }
diz() { printf '%s\n' "$*"; }

case "${PREFIX:-}" in
  *com.termux*) ;;
  *) erro "Isto é para correr dentro do Termux."; exit 1 ;;
esac

AGENTE_URL="${AGENTE_URL:-https://bettrackr.dev/clv-agent.mjs}"
# O que prova que o ficheiro é a versão nova e não uma cópia antiga esquecida nas
# Transferências. Bot: devolve ao servidor o token renovado (desde 19/09/2026).
# Agente: conta cada passagem ao painel (desde 15/09/2026).
MARCA_BOT='source: "bot"'
MARCA_AGENTE='api/clv/heartbeat'

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

expande() {
  local caminho="${1//\"/}"
  caminho="${caminho//\'/}"
  caminho="${caminho/#\~/$HOME}"
  caminho="${caminho//\$\{HOME\}/$HOME}"
  printf '%s' "${caminho//\$HOME/$HOME}"
}

# Os ficheiros de um comando que batem com o padrão, em caminho absoluto. Segue
# os 'cd' e entra (um nível) nos .sh que o comando chama, como o run.sh. Com o
# padrão '>>' devolve os logs para onde o comando escreve.
ficheiros_de() {
  local cmd="$1" padrao="$2" nivel="${3:-0}" dir="${4:-$HOME}" anterior="" tok f
  set -f
  for tok in $(printf '%s' "$cmd" | sed -E 's/>>[[:space:]]*/ >>/g' | tr ';&|()' '     '); do
    f="$(expande "${tok#>>}")"
    case "$f" in /*) ;; *) f="$dir/$f" ;; esac
    if [ "$anterior" = "cd" ]; then
      dir="$f"
    elif [ "$padrao" = ">>" ]; then
      [ "${tok#>>}" != "$tok" ] && printf '%s\n' "$f"
    elif printf '%s' "$f" | grep -qE "$padrao"; then
      printf '%s\n' "$f"
    fi
    if [ "$nivel" -eq 0 ] && [ "$anterior" != "cd" ] && [ "${f%.sh}" != "$f" ] && [ -f "$f" ]; then
      ficheiros_de "$(grep -v '^[[:space:]]*#' "$f")" "$padrao" 1 "$(dirname "$f")"
    fi
    anterior="$tok"
  done
  set +f
}

sem_horario() { awk '{ $1=$2=$3=$4=$5=""; sub(/^ +/, ""); print }'; }

buscar() { # origem (URL ou caminho) -> destino
  case "$1" in
    http://*|https://*)
      if command -v curl >/dev/null 2>&1; then
        curl -fsSL --max-time 90 -o "$2" "$1"
      else
        node -e 'fetch(process.argv[1]).then(async (r) => { if (!r.ok) throw new Error("http " + r.status); require("fs").writeFileSync(process.argv[2], Buffer.from(await r.arrayBuffer())); }).catch((e) => { console.error(e.message); process.exit(1); })' "$1" "$2"
      fi
      ;;
    *) cp "$1" "$2" ;;
  esac
}

# Confirma o ficheiro novo e troca-o pelo instalado, que fica em .anterior.
trocar() {
  local novo="$1" alvo="$2" nome="$3" marca="$4"
  if ! grep -qF "$marca" "$novo"; then
    erro "$nome: o ficheiro novo não é a versão nova (falta «$marca»)."
    return 1
  fi
  if ! node --check "$novo" >/dev/null 2>&1; then
    erro "$nome: o Node recusa o ficheiro novo (download cortado?)."
    return 1
  fi
  if [ -f "$alvo" ] && [ "$(md5sum < "$novo")" = "$(md5sum < "$alvo")" ]; then
    verde "$nome já estava na versão nova: $alvo"
    return 0
  fi
  [ -f "$alvo" ] && cp -p "$alvo" "$alvo.anterior"
  cp "$novo" "$alvo"
  verde "$nome atualizado: $alvo"
}

# Corre um comando do crontab e deixa a saída desta passagem em $2. Se o comando
# escrever para um log ('>>', no crontab ou no .sh que ele chama), lê-se de lá.
correr() {
  local cmd="$1" saida="$2" log antes=0
  # O primeiro: o do run.sh vem antes do '>>' do próprio crontab.
  log="$(ficheiros_de "$cmd" '>>' | head -n 1)"
  if [ -n "$log" ]; then
    [ -f "$log" ] && antes=$(wc -l < "$log")
    bash -c "$cmd"
    tail -n +"$((antes + 1))" "$log" > "$saida" 2>/dev/null
  else
    bash -c "$cmd" > "$saida" 2>&1
  fi
  tail -n 8 "$saida" | sed 's/^/   │ /'
}

CRONTAB_ATUAL="$(crontab -l 2>/dev/null || true)"
LINHAS="$(printf '%s\n' "$CRONTAB_ATUAL" | grep -v '^[[:space:]]*#' | sed '/^[[:space:]]*$/d')"
BOT_CMD="$(printf '%s\n' "$LINHAS" | grep -v 'clv-agent' | grep -E 'bot\.mjs|bot/run\.sh|src/index\.ts' | head -n 1 | sem_horario)"
AGENTE_LINHAS="$(printf '%s\n' "$LINHAS" | grep 'clv-agent')"
FALHOU=0

# ------------------------------------------------------------------
# 1. O bot
# ------------------------------------------------------------------
diz "── Bot da Betclic ──"
if [ -z "$BOT_CMD" ]; then
  erro "Não encontrei o bot no crontab. Corre primeiro o religar-bot.sh."
  FALHOU=1
else
  diz "   crontab: $BOT_CMD"
  BUNDLES="$(ficheiros_de "$BOT_CMD" '(^|/)bot\.mjs$' | sort -u)"
  FONTES="$(ficheiros_de "$BOT_CMD" '(^|/)src/index\.ts$' | sort -u)"
  if [ -n "$BUNDLES" ]; then
    ORIGEM="${1:-}"
    if [ -z "$ORIGEM" ]; then
      # O mais recente das Transferências. Um browser que já lá tenha um bot.mjs
      # grava o novo como "bot (1).mjs", daí o padrão largo.
      ORIGEM="$(ls -t "$HOME"/storage/downloads/bot*.mjs 2>/dev/null | head -n 1)"
      if [ -z "$ORIGEM" ]; then
        erro "Não há nenhum bot*.mjs nas Transferências."
        diz "   Põe lá o dist/bot.mjs do PC (npm run build:bot) ou passa um endereço:"
        diz "   bash atualizar-bot.sh http://IP-DO-PC:8765/bot.mjs"
        diz "   (se o Termux não vir as Transferências: termux-setup-storage)"
        FALHOU=1
      fi
    fi
    if [ -n "$ORIGEM" ]; then
      diz "   novo: $ORIGEM"
      if buscar "$ORIGEM" "$TMP/bot.mjs"; then
        while IFS= read -r alvo; do
          trocar "$TMP/bot.mjs" "$alvo" "Bot" "$MARCA_BOT" || FALHOU=1
        done <<< "$BUNDLES"
      else
        erro "Não consegui ir buscar o bot novo a $ORIGEM."
        FALHOU=1
      fi
    fi
  elif [ -n "$FONTES" ]; then
    RAIZ="$(git -C "$(dirname "$(printf '%s\n' "$FONTES" | head -n 1)")" rev-parse --show-toplevel 2>/dev/null)"
    if [ -n "$RAIZ" ] && git -C "$RAIZ" pull --ff-only; then
      verde "Bot atualizado por git pull em $RAIZ"
    else
      erro "O bot corre de src/index.ts, mas o git pull falhou (ou não é um clone git)."
      FALHOU=1
    fi
  else
    erro "Não percebi que ficheiro o crontab corre para o bot."
    FALHOU=1
  fi
fi

# ------------------------------------------------------------------
# 2. O agente do CLV
# ------------------------------------------------------------------
diz ""
diz "── Agente do CLV ──"
if [ -z "$AGENTE_LINHAS" ]; then
  aviso "O agente do CLV não está no crontab deste telemóvel - salto-o."
else
  AGENTES="$(ficheiros_de "$(printf '%s\n' "$AGENTE_LINHAS" | sem_horario)" 'clv-agent[^/]*\.m?js$' | sort -u)"
  if [ -z "$AGENTES" ]; then
    erro "O agente está no crontab mas não percebi em que ficheiro."
    FALHOU=1
  elif buscar "$AGENTE_URL" "$TMP/clv-agent.mjs"; then
    while IFS= read -r alvo; do
      trocar "$TMP/clv-agent.mjs" "$alvo" "Agente" "$MARCA_AGENTE" || FALHOU=1
    done <<< "$AGENTES"
  else
    erro "Não consegui descarregar o agente de $AGENTE_URL (sem rede?)."
    FALHOU=1
  fi
fi

if [ "$FALHOU" -ne 0 ]; then
  diz ""
  erro "Há coisas por atualizar (acima). Não corro passagens de teste."
  exit 1
fi

# ------------------------------------------------------------------
# 3. Uma passagem de cada, para confirmar
# ------------------------------------------------------------------
SAIDA="$TMP/saida"

AGENTE_CMD="$(printf '%s\n' "$AGENTE_LINHAS" | grep -v -- '--daily' | head -n 1 | sem_horario)"
if [ -n "$AGENTE_CMD" ]; then
  diz ""
  diz "A correr uma passagem do agente (a leve, sem --daily)..."
  correr "$AGENTE_CMD" "$SAIDA"
  if grep -q 'passagem nao contada' "$SAIDA"; then
    aviso "O agente correu, mas o servidor não aceitou a passagem - vê a linha acima."
  elif [ -s "$SAIDA" ]; then
    verde "Passagem do agente contada: já aparece no painel /bot, em «Passagens do agente de CLV»."
  else
    aviso "O agente não escreveu nada. Confirma no painel /bot se a passagem apareceu."
  fi
fi

diz ""
diz "A correr uma passagem do bot (até um minuto)..."
correr "$BOT_CMD" "$SAIDA"
ULTIMA="$(grep 'passagem:' "$SAIDA" | tail -n 1)"
if [ -n "$ULTIMA" ] && ! printf '%s' "$ULTIMA" | grep -q 'falhas:'; then
  verde "Passagem do bot com sucesso. Na app, os cartões das contas passam a «Ativo»."
elif grep -q 'sem token de contexto valido' "$SAIDA"; then
  aviso "A sessão da Betclic expirou: reativa cada conta no painel /bot e corre o religar-bot.sh."
else
  aviso "A passagem do bot não correu como devia - lê as linhas acima (ou corre o religar-bot.sh)."
fi
