#!/data/data/com.termux/files/usr/bin/bash
# religar-bot.sh - volta a pôr o bot da Betclic e o agente do CLV a correr no
# Termux e diz porque é que tinham parado.
#
#   bash religar-bot.sh                    religa, corre uma passagem de cada e lê o resultado
#   bash religar-bot.sh --sem-passagem     só religa (wake lock + cron), sem correr agora
#   bash religar-bot.sh --instalar-agente  põe o agente do CLV a correr neste telemóvel:
#                                          descarrega-o, pede o segredo e trata do crontab
#   bash religar-bot.sh --repor-bot        volta a pôr no crontab a última linha do bot
#                                          que este script lá viu
#
# Os comandos de crontab ficam todos aqui dentro, de propósito: a 19/10/2026 um
# '(crontab -1; echo ...) | crontab -' escrito à mão (um 1 em vez do l) deixou o
# crontab só com a linha do agente, e a do bot perdeu-se. Antes de cada escrita
# fica uma cópia em ~/.religar-bot/crontab.anterior.
#
# Tudo o que faz é idempotente - pode correr-se as vezes que for:
#   1. termux-wake-lock, para o Android não adormecer o Termux (Doze). Foi um
#      adormecimento destes que partiu a cadeia a 11/09/2026: hora e meia sem
#      rede, a sessão da Betclic (~2h) caducou e o bot passou a falhar sozinho.
#   2. O cronie instalado e o crond a correr.
#   3. As linhas do bot e do agente do CLV no crontab (as que lá estiverem são
#      reaproveitadas tal e qual).
#   4. Um arranque para o Termux:Boot: com essa app instalada, o wake lock e o
#      cron voltam sozinhos depois de reiniciar o telemóvel.
#   5. Uma passagem do bot e uma do agente já, com o diagnóstico: se o que parou
#      não foi o telemóvel (sessão da Betclic expirada, token do BetTrackr velho,
#      segredo do agente errado, sem rede), diz o que falta fazer.
#
# O agente entrou aqui depois de 11/10/2026: nesse dia, às 03:35, deixou de
# reportar e ficou uma semana calado. Nenhuma aposta teve odd de fecho e só o bot
# tinha alerta.
#
# Onde estão: lido do crontab. Se lá não houver linha, diz-se à mão:
#   BOT_CMD="bash ~/bettrackr/bot/run.sh" bash religar-bot.sh
#   AGENTE_CMD='cd ~/clv && . ./agente.env && node clv-agent.mjs >> agente.log 2>&1' bash religar-bot.sh
# (o bot corre de 30 em 30 minutos, o agente de 5 em 5; o agente.env tem o
# export BETTRACKR_AGENT_SECRET=..., e instalar o agente está no bot/README.md)
#
# Só mexe no Termux (wake lock, cron, ~/.termux/boot). Não toca nos cofres
# (passkey-*.enc, session-*.enc) nem no bot.env. A linha do agente nunca é
# impressa: costuma levar o BETTRACKR_AGENT_SECRET.

set -u

verde() { printf '\033[32m✔\033[0m %s\n' "$*"; }
aviso() { printf '\033[33m!\033[0m %s\n' "$*"; }
erro() { printf '\033[31m✘\033[0m %s\n' "$*"; }
diz() { printf '%s\n' "$*"; }

CORRER_AGORA=1
INSTALAR_AGENTE=0
REPOR_BOT=0
for opcao in "$@"; do
  case "$opcao" in
    --sem-passagem) CORRER_AGORA=0 ;;
    --instalar-agente) INSTALAR_AGENTE=1 ;;
    --repor-bot) REPOR_BOT=1 ;;
    # Escrito à mão num telemóvel, uma opção trocada calava-se e o script fazia
    # outra coisa sem ninguém perceber.
    *) erro "Não conheço a opção «$opcao» (há --sem-passagem, --instalar-agente e --repor-bot)."; exit 1 ;;
  esac
done

case "${PREFIX:-}" in
  *com.termux*) ;;
  *) erro "Isto é para correr dentro do Termux."; exit 1 ;;
esac

# Muda a cada versão: é por aqui que se vê, no ecrã, se o ficheiro que correu é
# o novo ou uma cópia antiga esquecida em ~ ou nas Transferências.
diz "religar-bot.sh, versão de 19/10/2026"

# É pelo nome do ficheiro que este script e o atualizar-bot.sh encontram o agente
# no crontab. Uma linha sem ele seria acrescentada de novo a cada vez que isto
# corresse - e cada cópia é mais uma passagem à Betclic de 5 em 5 minutos.
if [ -n "${AGENTE_CMD:-}" ] && ! printf '%s' "$AGENTE_CMD" | grep -q 'clv-agent'; then
  erro "O AGENTE_CMD tem de chamar o ficheiro do agente pelo nome (clv-agent.mjs)."
  exit 1
fi

# Tira os 5 campos do horário de uma linha do crontab e fica o comando.
sem_horario() { awk '{ $1=$2=$3=$4=$5=""; sub(/^ +/, ""); print }'; }

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
# 3. O agente do CLV neste telemóvel (só com --instalar-agente)
# ------------------------------------------------------------------
# O segredo fica num ficheiro só do Termux, fora do crontab; a linha do crontab
# carrega-o. A linha entra no passo seguinte, com as outras.
PASTA_AGENTE="$HOME/clv"
AGENTE_URL="${AGENTE_URL:-https://bettrackr.dev/clv-agent.mjs}"
LINHA_AGENTE_PADRAO='cd ~/clv && . ./agente.env && node clv-agent.mjs >> agente.log 2>&1'
if [ "$INSTALAR_AGENTE" -eq 1 ]; then
  mkdir -p "$PASTA_AGENTE"
  if [ -s "$PASTA_AGENTE/clv-agent.mjs" ]; then
    verde "O agente já está em ~/clv/clv-agent.mjs (atualiza-se com o atualizar-bot.sh)."
  else
    diz "A descarregar o agente do CLV de $AGENTE_URL..."
    if curl -fsSL --max-time 90 -o "$PASTA_AGENTE/clv-agent.novo.mjs" "$AGENTE_URL" \
      && node --check "$PASTA_AGENTE/clv-agent.novo.mjs" >/dev/null 2>&1; then
      mv "$PASTA_AGENTE/clv-agent.novo.mjs" "$PASTA_AGENTE/clv-agent.mjs"
      verde "Agente descarregado para ~/clv/clv-agent.mjs."
    else
      rm -f "$PASTA_AGENTE/clv-agent.novo.mjs"
      erro "Não consegui descarregar o agente: sem rede, ou falta o Node ('pkg install nodejs')."
      exit 1
    fi
  fi
  # Conta o valor, não o ficheiro: a 19/10/2026 um 'read' escrito à mão deixou lá
  # um export com o segredo vazio, e o agente arrancava sem ele.
  if ( unset BETTRACKR_AGENT_SECRET; . "$PASTA_AGENTE/agente.env" >/dev/null 2>&1
       [ -n "${BETTRACKR_AGENT_SECRET:-}" ] ); then
    verde "O segredo do agente já está em ~/clv/agente.env (para o trocar: rm ~/clv/agente.env e repete)."
  else
    [ -e "$PASTA_AGENTE/agente.env" ] && aviso "O ~/clv/agente.env não tem segredo nenhum - vou pedi-lo."
    diz "Cola o segredo do agente - o CLV_AGENT_SECRET da Vercel (Settings > Environment Variables) -"
    diz "e carrega Enter. Não aparece no ecrã."
    SEGREDO=""
    read -rsp 'Segredo do agente: ' SEGREDO
    echo
    SEGREDO="${SEGREDO//$'\r'/}"
    if [ -z "$SEGREDO" ]; then
      erro "Não recebi segredo nenhum - nada mudou. Repete e cola-o."
      exit 1
    fi
    # Entre plicas, com as do próprio valor escapadas: é o shell do cron que o lê.
    ( umask 077
      printf "export BETTRACKR_AGENT_SECRET='%s'\n" "$(printf '%s' "$SEGREDO" | sed "s/'/'\\\\''/g")" \
        > "$PASTA_AGENTE/agente.env" )
    unset SEGREDO
    verde "Segredo guardado em ~/clv/agente.env (fora do crontab, só o Termux o lê)."
  fi
  AGENTE_CMD="${AGENTE_CMD:-$LINHA_AGENTE_PADRAO}"
fi

# ------------------------------------------------------------------
# 4. As linhas do bot e do agente no crontab
# ------------------------------------------------------------------
MEMORIA="$HOME/.religar-bot"
LINHA_BOT_GUARDADA="$MEMORIA/linha-do-bot"
mkdir -p "$MEMORIA"
SCRIPT="$(readlink -f "$0" 2>/dev/null || printf '%s' "$0")"
CRONTAB_ATUAL="$(crontab -l 2>/dev/null || true)"

# Todas as escritas no crontab passam por aqui, com o crontab novo inteiro em $1.
# Antes, fica uma cópia do que lá estava.
escrever_crontab() {
  ( umask 077; printf '%s\n' "$CRONTAB_ATUAL" > "$MEMORIA/crontab.anterior" )
  printf '%s\n' "$1" | sed '/^$/d' | crontab -
  CRONTAB_ATUAL="$(crontab -l 2>/dev/null || true)"
}

# A mesma linha do agente duas vezes são duas passagens à Betclic de cada vez (é
# o que dá acrescentá-la duas vezes). As cópias exatas saem; fica a primeira.
if [ -n "$(printf '%s\n' "$CRONTAB_ATUAL" | grep -v '^[[:space:]]*#' | grep 'clv-agent' | sort | uniq -d)" ]; then
  escrever_crontab "$(printf '%s\n' "$CRONTAB_ATUAL" \
    | awk '/clv-agent/ && !/^[[:space:]]*#/ { if (visto[$0]++) next } { print }')"
  verde "Tirei do crontab as linhas do agente do CLV que estavam repetidas."
fi
LINHAS_ATIVAS="$(printf '%s\n' "$CRONTAB_ATUAL" | grep -v '^[[:space:]]*#')"
# A linha do bot: a que chama o bot.mjs, o run.sh do bot ou o src/index.ts.
# Nunca a do agente do CLV, nem comentários.
LINHA_BOT="$(printf '%s\n' "$LINHAS_ATIVAS" \
  | grep -v 'clv-agent' \
  | grep -E 'bot\.mjs|bot/run\.sh|src/index\.ts' \
  | head -n 1)"
LINHAS_AGENTE="$(printf '%s\n' "$LINHAS_ATIVAS" | grep 'clv-agent')"
# A de 5 em 5 minutos (a captura). A de madrugada (--daily) sozinha não conta:
# sem a captura nenhuma aposta recebe odd de fecho.
LINHAS_CAPTURA="$(printf '%s\n' "$LINHAS_AGENTE" | grep -v -- '--daily')"

# Para o --repor-bot, se a linha do bot alguma vez desaparecer do crontab.
sugerir_repor_bot() {
  [ -s "$LINHA_BOT_GUARDADA" ] || return 0
  diz "   Se devia estar: a última linha dele que vi aqui foi"
  diz "   $(cat "$LINHA_BOT_GUARDADA")"
  diz "   Repõe-na com: bash '$SCRIPT' --repor-bot"
}

if [ -n "$LINHA_BOT" ]; then
  BOT_CMD="${BOT_CMD:-$(printf '%s\n' "$LINHA_BOT" | sem_horario)}"
  verde "Linha do bot no crontab: $LINHA_BOT"
  ( umask 077; printf '%s\n' "$LINHA_BOT" > "$LINHA_BOT_GUARDADA" )
elif [ -n "${BOT_CMD:-}" ]; then
  escrever_crontab "$(printf '%s\n*/30 * * * * %s\n' "$CRONTAB_ATUAL" "$BOT_CMD")"
  verde "Linha do bot acrescentada ao crontab: */30 * * * * $BOT_CMD"
elif [ "$REPOR_BOT" -eq 1 ]; then
  if [ ! -s "$LINHA_BOT_GUARDADA" ]; then
    erro "Não tenho nenhuma linha do bot guardada: só se guarda quando este script a vê no crontab."
    diz "   Diz qual é e repete, por exemplo:"
    diz "   BOT_CMD=\"bash ~/bettrackr/bot/run.sh\" bash religar-bot.sh"
    exit 1
  fi
  LINHA_BOT="$(cat "$LINHA_BOT_GUARDADA")"
  escrever_crontab "$(printf '%s\n%s\n' "$CRONTAB_ATUAL" "$LINHA_BOT")"
  BOT_CMD="$(printf '%s\n' "$LINHA_BOT" | sem_horario)"
  verde "Linha do bot reposta no crontab: $LINHA_BOT"
elif [ -n "$LINHAS_AGENTE" ] || [ -n "${AGENTE_CMD:-}" ]; then
  # Um telemóvel só com o agente: não há bot a religar, mas o agente sim. Não se
  # repõe sozinho: dois bots com as mesmas contas estragavam a sessão um ao outro.
  BOT_CMD=""
  aviso "O bot não está no crontab deste telemóvel - sigo só com o agente do CLV."
  sugerir_repor_bot
else
  erro "Não encontrei o bot no crontab."
  if [ -s "$LINHA_BOT_GUARDADA" ]; then
    sugerir_repor_bot
  else
    diz "   Diz onde ele está e repete, por exemplo:"
    diz "   BOT_CMD=\"bash ~/bettrackr/bot/run.sh\" bash religar-bot.sh"
  fi
  exit 1
fi

if [ -n "$LINHAS_CAPTURA" ]; then
  CMD_CRON="$(printf '%s\n' "$LINHAS_CAPTURA" | head -n 1 | sem_horario)"
  # A passagem de teste é sempre a que o cron corre: outra dava aqui um «a
  # correr» com o cron a falhar, e fechava à mesma o alerta. Comparado depois
  # do mesmo awk, que junta os espaços.
  if [ -n "${AGENTE_CMD:-}" ] && [ "$(printf '* * * * * %s\n' "$AGENTE_CMD" | sem_horario)" != "$CMD_CRON" ]; then
    aviso "Já há uma linha do agente no crontab, diferente do AGENTE_CMD: fica a do crontab, que é a que o cron corre."
    diz "   Para a trocar, apaga-a com 'crontab -e' e repete."
  fi
  AGENTE_CMD="$CMD_CRON"
  verde "O agente do CLV está no crontab - volta com o mesmo cron."
  N_CAPTURA="$(printf '%s\n' "$LINHAS_CAPTURA" | grep -c .)"
  if [ "$N_CAPTURA" -gt 1 ]; then
    aviso "Há $N_CAPTURA linhas diferentes do agente (a de 5 em 5 minutos) no crontab: cada uma é mais uma passagem à Betclic. Deixa só uma, com 'crontab -e'."
  fi
elif [ -n "${AGENTE_CMD:-}" ]; then
  # O CRONTAB_ATUAL já traz a linha que o passo do bot possa ter acabado de pôr.
  escrever_crontab "$(printf '%s\n*/5 * * * * %s\n' "$CRONTAB_ATUAL" "$AGENTE_CMD")"
  verde "Linha do agente do CLV acrescentada ao crontab (de 5 em 5 minutos)."
else
  AGENTE_CMD=""
  if [ -n "$LINHAS_AGENTE" ]; then
    aviso "Do agente do CLV só está no crontab a passagem de madrugada (--daily). Falta a de 5 em 5 minutos, a que lê a odd de fecho."
  else
    aviso "O agente do CLV não está no crontab deste telemóvel (procurei uma linha com «clv-agent»). Sem ele nenhuma aposta recebe odd de fecho."
    diz "   Se corre noutra máquina, ignora."
  fi
  # Este mesmo ficheiro, pelo caminho inteiro, e não um religar-bot.sh antigo
  # que ande por ~ ou pelas Transferências.
  diz "   Para o pôr a correr aqui (pede o segredo, o CLV_AGENT_SECRET da Vercel, e trata do resto):"
  diz "     bash '$SCRIPT' --instalar-agente"
fi

# ------------------------------------------------------------------
# 5. crond a correr
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
# 6. Termux:Boot
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
# 7. Uma passagem já, e o que ela diz
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

# O ficheiro de log de um comando do crontab, ou vazio se a saída for para o ecrã.
log_de() {
  local cmd="$1" log palavra ficheiro
  log="$(log_em "$cmd")"
  if [ -z "$log" ]; then
    for palavra in $cmd; do
      ficheiro="$(expande "$palavra")"
      case "$ficheiro" in
        *.sh)
          if [ -f "$ficheiro" ]; then
            log="$(log_em "$(cat "$ficheiro")")"
            # Um log relativo é relativo à pasta do script (o run.sh faz cd para lá).
            if [ -n "$log" ]; then
              log="$(expande "$log")"
              case "$log" in /*) ;; *) log="$(dirname "$ficheiro")/$log" ;; esac
            fi
          fi
          ;;
      esac
      [ -n "$log" ] && break
    done
  fi
  [ -n "$log" ] && log="$(expande "$log")"
  # Um log relativo no próprio comando é relativo ao 'cd' que o comando faz.
  case "$log" in
    ""|/*) ;;
    *)
      local pasta
      pasta="$(printf '%s' "$cmd" | grep -oE '(^|[;&|[:space:]])cd[[:space:]]+[^;&|[:space:]]+' | tail -n 1 | sed -E 's/.*cd[[:space:]]+//')"
      [ -n "$pasta" ] && log="$(expande "$pasta")/$log"
      ;;
  esac
  printf '%s' "$log"
}

# As variáveis definidas no próprio crontab (NOME=valor numa linha à parte)
# valem para os comandos dele. Sem elas, correr o comando aqui fora dava um
# diagnóstico falso - por exemplo, um segredo do agente que no cron existe.
# Vão como export com o valor entre aspas: o cron não as passa pelo shell, e um
# valor com espaços ("FOO=a b") seria aqui um comando.
VARS_CRON="$(printf '%s\n' "$CRONTAB_ATUAL" \
  | sed -nE 's/^([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=[[:space:]]*(.*)$/\1=\2/p' \
  | while IFS= read -r linha; do
      nome="${linha%%=*}"
      valor="${linha#*=}"
      # O cron tira as aspas de um valor todo entre aspas.
      case "$valor" in
        \"*\") valor="${valor#\"}"; valor="${valor%\"}" ;;
        \'*\') valor="${valor#\'}"; valor="${valor%\'}" ;;
      esac
      printf "export %s='%s'\n" "$nome" "$(printf '%s' "$valor" | sed "s/'/'\\\\''/g")"
    done)"

# E só elas: o cronie começa cada comando com o ambiente vazio. Um segredo que
# este shell (ou o ~/.bashrc) exporte daria aqui uma passagem boa que no cron
# falha - e essa passagem fechava à mesma o alerta de agente parado.
AMBIENTE_CRON="unset BETTRACKR_AGENT_SECRET BETTRACKR_BASE CLV_PAUSA_MS BETTRACKR_TOKEN BETCLIC_BOT_KEY BETCLIC_CONTEXT_TOKEN BOT_DIR BOT_INTERVAL_SEC BOT_KEYFILE BOT_VAULT
$VARS_CRON"

# Corre um comando do crontab e deixa em $2 a saída desta passagem. Com $3 = 1
# também a mostra à medida (o bot); o agente só se mostra depois, filtrado.
# O que o próprio shell queixar (um 'cd' para uma pasta que já não existe, um
# node que não arranca) também entra: não vai para o log do comando.
correr() {
  local cmd="$1" saida="$2" eco="${3:-0}" log antes=0 queixas
  log="$(log_de "$cmd")"
  if [ -n "$log" ]; then
    queixas="$(mktemp)"
    [ -f "$log" ] && antes=$(wc -l < "$log")
    bash -c "$AMBIENTE_CRON
$cmd" 2>"$queixas"
    tail -n +"$((antes + 1))" "$log" > "$saida" 2>/dev/null
    cat "$queixas" >> "$saida"
    rm -f "$queixas"
  elif [ "$eco" -eq 1 ]; then
    bash -c "$AMBIENTE_CRON
$cmd" 2>&1 | tee "$saida"
  else
    bash -c "$AMBIENTE_CRON
$cmd" > "$saida" 2>&1
  fi
}

SAIDA="$(mktemp)"
trap 'rm -f "$SAIDA"' EXIT

if [ -n "$BOT_CMD" ]; then
  diz ""
  diz "A correr uma passagem do bot (até um minuto)..."
  correr "$BOT_CMD" "$SAIDA" 1

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
fi

if [ -n "$AGENTE_CMD" ]; then
  diz ""
  diz "A correr uma passagem do agente do CLV (a de 5 em 5 minutos)..."
  correr "$AGENTE_CMD" "$SAIDA"

  diz ""
  diz "── Últimas linhas do agente ──"
  # Só as linhas do agente: um 'set -x' no comando podia trazer o segredo.
  grep -v 'SECRET=' "$SAIDA" | tail -n 8
  diz "──────────────────────────────"

  # A ordem conta: uma passagem recusada pelo servidor também diz, a seguir,
  # que não conseguiu ser contada.
  if grep -q 'falta BETTRACKR_AGENT_SECRET' "$SAIDA"; then
    aviso "O agente arranca sem o segredo (BETTRACKR_AGENT_SECRET)."
    diz "   Tem de estar num ficheiro que a linha do crontab carregue, ou na própria linha,"
    diz "   com o mesmo valor do CLV_AGENT_SECRET na Vercel. Para o guardar em ~/clv/agente.env:"
    diz "     bash '$SCRIPT' --instalar-agente"
  elif grep -qE 'respondeu 401' "$SAIDA"; then
    aviso "O BetTrackr recusa o segredo do agente (401)."
    diz "   O BETTRACKR_AGENT_SECRET do telemóvel tem de ser igual ao CLV_AGENT_SECRET da Vercel."
    diz "   Se está em ~/clv/agente.env, troca-o com:"
    diz "     rm -f ~/clv/agente.env; bash '$SCRIPT' --instalar-agente"
  elif grep -qE 'respondeu 403' "$SAIDA"; then
    aviso "O BetTrackr (ou a firewall da Vercel) recusou o pedido do agente (403)."
  elif grep -qE 'CANNOT LINK EXECUTABLE|command not found|node: not found|Cannot find module|ERR_MODULE_NOT_FOUND|SyntaxError' "$SAIDA"; then
    aviso "O Node ou o ficheiro do agente estão partidos (é o que acontece depois de um 'pkg upgrade' a meio)."
    diz "   1. pkg upgrade        (acaba a atualização do Node)"
    diz "   2. bash atualizar-bot.sh   (volta a pôr o agente)"
  elif grep -q 'No such file or directory' "$SAIDA"; then
    aviso "A linha do agente no crontab aponta para uma pasta ou ficheiro que já não existe (lê a linha acima)."
    diz "   Se o agente devia estar em ~/clv, isto descarrega-o e guarda o segredo:"
    diz "     bash '$SCRIPT' --instalar-agente"
    diz "   Se está noutro sítio, corrige a linha com 'crontab -e'."
  elif grep -qE 'respondeu 404|sem JSON' "$SAIDA"; then
    aviso "O endereço do BetTrackr que o agente usa não é o BetTrackr (404 ou uma página que não é a API)."
    diz "   Se a linha do crontab define BETTRACKR_BASE, tem de ser https://bettrackr.dev (ou apaga-a: é o valor por omissão)."
  elif grep -qE 'respondeu 5[0-9][0-9]' "$SAIDA"; then
    aviso "O BetTrackr respondeu com um erro dele (5xx) - o telemóvel está bem. Vê os logs da Vercel."
  elif grep -qE 'fetch failed|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ETIMEDOUT' "$SAIDA"; then
    aviso "Sem rede: o agente não chegou ao BetTrackr. Confirma os dados móveis/Wi-Fi e o BETTRACKR_BASE, se o tiver."
  elif grep -qE 'http-403|http-429' "$SAIDA"; then
    aviso "A Betclic está a recusar as leituras deste IP (403/429): o agente corre, mas não lê preços."
    diz "   Costuma passar sozinho; se durar horas, reinicia o router para mudar de IP."
  elif grep -q 'passagem nao contada' "$SAIDA"; then
    aviso "O agente correu, mas o BetTrackr não aceitou a passagem - lê a linha acima."
  elif grep -qE 'nada a ler|enviadas [0-9]' "$SAIDA"; then
    verde "Agente do CLV a correr: a passagem já aparece no painel /bot, em «Passagens do agente de CLV»."
  elif [ ! -s "$SAIDA" ]; then
    aviso "O agente não escreveu nada. Confirma no painel /bot se a passagem apareceu."
  else
    aviso "A passagem do agente não correu como devia - lê as linhas acima."
  fi
fi

diz ""
diz "Para o Android não voltar a parar o bot e o agente:"
diz "  • Definições > Apps > Termux > Bateria: «Sem restrições»."
diz "  • Deixa ficar a notificação do Termux - é ela que segura o wake lock."
diz "  • Se o Termux fechar sozinho com «[Process completed (signal 9)]», é o limite"
diz "    de processos do Android 12+: nas Opções de programador liga"
diz "    «Disable child process restrictions» (o nome muda com a marca do telemóvel)."
