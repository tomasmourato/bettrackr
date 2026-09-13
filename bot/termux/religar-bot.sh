#!/data/data/com.termux/files/usr/bin/bash
# religar-bot.sh - volta a pôr o bot da Betclic a correr no Termux e diz porque
# é que tinha parado.
#
#   bash religar-bot.sh                 religa, corre uma passagem e lê o resultado
#   bash religar-bot.sh --sem-passagem  só religa (wake lock + cron), sem correr agora
#
# Tudo o que faz é idempotente - pode correr-se as vezes que for:
#   1. termux-wake-lock, para o Android não adormecer o Termux (Doze). Foi um
#      adormecimento destes que partiu a cadeia a 11/09/2026: hora e meia sem
#      rede, a sessão da Betclic (~2h) caducou e o bot passou a falhar sozinho.
#   2. O cronie instalado e o crond a correr.
#   3. A linha do bot no crontab (a que lá estiver é reaproveitada tal e qual; a
#      do agente do CLV, se existir, não é tocada).
#   4. Um arranque para o Termux:Boot: com essa app instalada, o wake lock e o
#      cron voltam sozinhos depois de reiniciar o telemóvel.
#   5. Uma passagem já, com o diagnóstico: se o que parou não foi o telemóvel
#      (sessão da Betclic expirada, token do BetTrackr velho, sem rede), diz o
#      que falta fazer.
#
# Onde está o bot: lido do crontab. Se lá não houver linha nenhuma, diz-se à mão:
#   BOT_CMD="bash ~/bettrackr/bot/run.sh" bash religar-bot.sh
#
# Só mexe no Termux (wake lock, cron, ~/.termux/boot). Não toca nos cofres
# (passkey-*.enc, session-*.enc) nem no bot.env.

set -u

verde() { printf '\033[32m✔\033[0m %s\n' "$*"; }
aviso() { printf '\033[33m!\033[0m %s\n' "$*"; }
erro() { printf '\033[31m✘\033[0m %s\n' "$*"; }
diz() { printf '%s\n' "$*"; }

CORRER_AGORA=1
[ "${1:-}" = "--sem-passagem" ] && CORRER_AGORA=0

case "${PREFIX:-}" in
  *com.termux*) ;;
  *) erro "Isto é para correr dentro do Termux."; exit 1 ;;
esac

# ------------------------------------------------------------------
# 1. Wake lock
# ------------------------------------------------------------------
if command -v termux-wake-lock >/dev/null 2>&1; then
  termux-wake-lock
  verde "Wake lock ativo: o Termux não adormece com o ecrã desligado."
else
  aviso "Falta o termux-wake-lock ('pkg upgrade' trá-lo). Sem ele o Android pode adormecer o bot."
fi

# ------------------------------------------------------------------
# 2. O cron
# ------------------------------------------------------------------
if ! command -v crond >/dev/null 2>&1; then
  diz "A instalar o cronie (o cron do Termux)..."
  if ! pkg install -y cronie; then
    erro "Não consegui instalar o cronie. Corre 'pkg install cronie' à mão e repete."
    exit 1
  fi
fi

# ------------------------------------------------------------------
# 3. A linha do bot no crontab
# ------------------------------------------------------------------
CRONTAB_ATUAL="$(crontab -l 2>/dev/null || true)"
# A linha do bot: a que chama o bot.mjs, o run.sh do bot ou o src/index.ts.
# Nunca a do agente do CLV, nem comentários.
LINHA_BOT="$(printf '%s\n' "$CRONTAB_ATUAL" \
  | grep -v '^[[:space:]]*#' \
  | grep -v 'clv-agent' \
  | grep -E 'bot\.mjs|bot/run\.sh|src/index\.ts' \
  | head -n 1)"

if [ -n "$LINHA_BOT" ]; then
  # Tira os 5 campos do horário e fica o comando.
  BOT_CMD="${BOT_CMD:-$(printf '%s\n' "$LINHA_BOT" | awk '{ $1=$2=$3=$4=$5=""; sub(/^ +/, ""); print }')}"
  verde "Linha do bot no crontab: $LINHA_BOT"
elif [ -n "${BOT_CMD:-}" ]; then
  printf '%s\n*/30 * * * * %s\n' "$CRONTAB_ATUAL" "$BOT_CMD" | sed '/^$/d' | crontab -
  verde "Linha do bot acrescentada ao crontab: */30 * * * * $BOT_CMD"
else
  erro "Não encontrei o bot no crontab."
  diz "   Diz onde ele está e repete, por exemplo:"
  diz "   BOT_CMD=\"bash ~/bettrackr/bot/run.sh\" bash religar-bot.sh"
  exit 1
fi

if printf '%s\n' "$CRONTAB_ATUAL" | grep -q 'clv-agent'; then
  verde "O agente do CLV também está no crontab - volta com o mesmo cron."
fi

# ------------------------------------------------------------------
# 4. crond a correr
# ------------------------------------------------------------------
# Com o termux-services o crond é um serviço do runit; sem ele, arranca-se direto.
if [ -d "$PREFIX/var/service/crond" ] && command -v sv >/dev/null 2>&1; then
  sv up crond >/dev/null 2>&1 || true
  sleep 1
fi
if pgrep -x crond >/dev/null 2>&1; then
  verde "O crond está a correr."
else
  crond
  sleep 1
  if pgrep -x crond >/dev/null 2>&1; then
    verde "crond arrancado."
  else
    erro "O crond não arrancou. Corre 'crond -n' para ver o erro."
    exit 1
  fi
fi

# ------------------------------------------------------------------
# 5. Termux:Boot
# ------------------------------------------------------------------
ARRANQUE="$HOME/.termux/boot/10-bettrackr-bot"
mkdir -p "$HOME/.termux/boot"
cat > "$ARRANQUE" <<'EOF'
#!/data/data/com.termux/files/usr/bin/sh
# Criado pelo religar-bot.sh do BetTrackr. Depois de o telemóvel reiniciar, volta
# a segurar o wake lock e a arrancar o cron (que corre o bot de 30 em 30 minutos,
# e o agente do CLV se o houver). Só corre com a app Termux:Boot instalada.
termux-wake-lock
crond
EOF
chmod 700 "$ARRANQUE"
verde "Arranque automático em ~/.termux/boot (precisa da app Termux:Boot, do F-Droid)."

if [ "$CORRER_AGORA" -eq 0 ]; then
  diz ""
  verde "Religado. A próxima passagem do cron é daqui a menos de 30 minutos."
  exit 0
fi

# ------------------------------------------------------------------
# 6. Uma passagem já, e o que ela diz
# ------------------------------------------------------------------
# O log é o ficheiro do '>>': no comando do crontab ou dentro do script que ele
# chama. Sem '>>' em lado nenhum, a saída vem para o ecrã e lê-se de lá.
expande() {
  local caminho="${1//\"/}"
  caminho="${caminho//\'/}"
  caminho="${caminho/#\~/$HOME}"
  caminho="${caminho//\$\{HOME\}/$HOME}"
  printf '%s' "${caminho//\$HOME/$HOME}"
}
log_em() { printf '%s\n' "$1" | grep -oE '>>[[:space:]]*[^[:space:]]+' | tail -n 1 | sed -E 's/^>>[[:space:]]*//'; }

LOG="$(log_em "$BOT_CMD")"
if [ -z "$LOG" ]; then
  for palavra in $BOT_CMD; do
    ficheiro="$(expande "$palavra")"
    case "$ficheiro" in
      *.sh)
        if [ -f "$ficheiro" ]; then
          LOG="$(log_em "$(cat "$ficheiro")")"
          # Um log relativo é relativo à pasta do script (o run.sh faz cd para lá).
          if [ -n "$LOG" ]; then
            LOG="$(expande "$LOG")"
            case "$LOG" in /*) ;; *) LOG="$(dirname "$ficheiro")/$LOG" ;; esac
          fi
        fi
        ;;
    esac
    [ -n "$LOG" ] && break
  done
fi
[ -n "$LOG" ] && LOG="$(expande "$LOG")"

SAIDA="$(mktemp)"
diz ""
diz "A correr uma passagem (até um minuto)..."
if [ -n "$LOG" ]; then
  ANTES=0
  [ -f "$LOG" ] && ANTES=$(wc -l < "$LOG")
  bash -c "$BOT_CMD"
  tail -n +"$((ANTES + 1))" "$LOG" > "$SAIDA" 2>/dev/null
else
  bash -c "$BOT_CMD" 2>&1 | tee "$SAIDA"
fi

diz ""
diz "── Últimas linhas desta passagem ──"
tail -n 12 "$SAIDA"
diz "───────────────────────────────────"

ULTIMA_PASSAGEM="$(grep 'passagem:' "$SAIDA" | tail -n 1)"
if grep -q 'sem token de contexto valido' "$SAIDA"; then
  aviso "O telemóvel está bem: a sessão da Betclic é que expirou (o bot esteve mais de ~2h sem conseguir entrar)."
  diz "   1. Na app BetTrackr, separador Bot: em cada conta, cola um token novo da Betclic e carrega em «Ativar»."
  diz "   2. Volta a correr: bash religar-bot.sh"
elif grep -qE 'Sessao BetTrackr expirada|respondeu 401' "$SAIDA"; then
  aviso "O token do BetTrackr no bot.env já não é aceite (o bot esteve parado mais de 7 dias)."
  diz "   Põe um BETTRACKR_TOKEN novo no bot.env e volta a correr este script."
elif grep -qE 'fetch failed|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ETIMEDOUT' "$SAIDA"; then
  aviso "Sem rede: o bot não chegou à Betclic nem ao BetTrackr. Confirma os dados móveis/Wi-Fi e repete."
elif grep -q 'sem contas ativadas nem cofres locais' "$SAIDA"; then
  aviso "Não há contas ativadas: ativa cada conta Betclic no separador Bot da app."
elif [ -n "$ULTIMA_PASSAGEM" ] && ! printf '%s' "$ULTIMA_PASSAGEM" | grep -q 'falhas:'; then
  verde "Passagem com sucesso: o bot está outra vez a importar."
else
  aviso "A passagem não correu como devia - lê as linhas acima."
fi
rm -f "$SAIDA"

diz ""
diz "Para o Android não voltar a parar o bot:"
diz "  • Definições > Apps > Termux > Bateria: «Sem restrições»."
diz "  • Deixa ficar a notificação do Termux - é ela que segura o wake lock."
diz "  • Se o Termux fechar sozinho com «[Process completed (signal 9)]», é o limite"
diz "    de processos do Android 12+: nas Opções de programador liga"
diz "    «Disable child process restrictions» (o nome muda com a marca do telemóvel)."
