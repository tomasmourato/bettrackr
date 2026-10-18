#!/data/data/com.termux/files/usr/bin/bash
# religar-bot.sh - volta a pôr o bot da Betclic e o agente do CLV a correr no
# Termux e diz porque é que tinham parado.
#
#   bash religar-bot.sh                 religa, corre uma passagem de cada e lê o resultado
#   bash religar-bot.sh --sem-passagem  só religa (wake lock + cron), sem correr agora
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
#   AGENTE_CMD="cd ~/clv && node clv-agent.mjs >> agente.log 2>&1" bash religar-bot.sh
# (o bot corre de 30 em 30 minutos, o agente de 5 em 5)
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
[ "${1:-}" = "--sem-passagem" ] && CORRER_AGORA=0

case "${PREFIX:-}" in
  *com.termux*) ;;
  *) erro "Isto é para correr dentro do Termux."; exit 1 ;;
esac

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
# 3. As linhas do bot e do agente no crontab
# ------------------------------------------------------------------
CRONTAB_ATUAL="$(crontab -l 2>/dev/null || true)"
LINHAS_ATIVAS="$(printf '%s\n' "$CRONTAB_ATUAL" | grep -v '^[[:space:]]*#')"
# A linha do bot: a que chama o bot.mjs, o run.sh do bot ou o src/index.ts.
# Nunca a do agente do CLV, nem comentários.
LINHA_BOT="$(printf '%s\n' "$LINHAS_ATIVAS" \
  | grep -v 'clv-agent' \
  | grep -E 'bot\.mjs|bot/run\.sh|src/index\.ts' \
  | head -n 1)"
LINHAS_AGENTE="$(printf '%s\n' "$LINHAS_ATIVAS" | grep 'clv-agent')"

if [ -n "$LINHA_BOT" ]; then
  BOT_CMD="${BOT_CMD:-$(printf '%s\n' "$LINHA_BOT" | sem_horario)}"
  verde "Linha do bot no crontab: $LINHA_BOT"
elif [ -n "${BOT_CMD:-}" ]; then
  printf '%s\n*/30 * * * * %s\n' "$CRONTAB_ATUAL" "$BOT_CMD" | sed '/^$/d' | crontab -
  verde "Linha do bot acrescentada ao crontab: */30 * * * * $BOT_CMD"
elif [ -n "$LINHAS_AGENTE" ] || [ -n "${AGENTE_CMD:-}" ]; then
  # Um telemóvel só com o agente: não há bot a religar, mas o agente sim.
  BOT_CMD=""
  aviso "O bot não está no crontab deste telemóvel - sigo só com o agente do CLV."
else
  erro "Não encontrei o bot no crontab."
  diz "   Diz onde ele está e repete, por exemplo:"
  diz "   BOT_CMD=\"bash ~/bettrackr/bot/run.sh\" bash religar-bot.sh"
  exit 1
fi

if [ -n "$LINHAS_AGENTE" ]; then
  # A de 5 em 5 minutos (a captura), não a de madrugada (--daily).
  AGENTE_CMD="${AGENTE_CMD:-$(printf '%s\n' "$LINHAS_AGENTE" | grep -v -- '--daily' | head -n 1 | sem_horario)}"
  verde "O agente do CLV está no crontab - volta com o mesmo cron."
elif [ -n "${AGENTE_CMD:-}" ]; then
  # Relido, porque o passo do bot pode ter acabado de lhe acrescentar uma linha -
  # e relido ANTES da pipeline: dentro dela o 'crontab -' podia esvaziá-lo
  # enquanto o 'crontab -l' ainda o lia, e perdia-se a linha do bot.
  CRONTAB_ATUAL="$(crontab -l 2>/dev/null || true)"
  printf '%s\n*/5 * * * * %s\n' "$CRONTAB_ATUAL" "$AGENTE_CMD" | sed '/^$/d' | crontab -
  verde "Linha do agente do CLV acrescentada ao crontab (de 5 em 5 minutos)."
else
  AGENTE_CMD=""
  aviso "O agente do CLV não está no crontab deste telemóvel (procurei uma linha com «clv-agent»). Sem ele nenhuma aposta recebe odd de fecho."
  diz "   Se corre noutra máquina, ignora. Se devia correr aqui, diz onde ele está e repete:"
  diz "   AGENTE_CMD=\"cd ~/clv && node clv-agent.mjs >> agente.log 2>&1\" bash religar-bot.sh"
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
    bash -c "$VARS_CRON
$cmd" 2>"$queixas"
    tail -n +"$((antes + 1))" "$log" > "$saida" 2>/dev/null
    cat "$queixas" >> "$saida"
    rm -f "$queixas"
  elif [ "$eco" -eq 1 ]; then
    bash -c "$VARS_CRON
$cmd" 2>&1 | tee "$saida"
  else
    bash -c "$VARS_CRON
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
    diz "   Tem de estar na linha do crontab, ou num ficheiro que ela carregue, com o"
    diz "   mesmo valor do CLV_AGENT_SECRET na Vercel."
  elif grep -qE 'respondeu 401' "$SAIDA"; then
    aviso "O BetTrackr recusa o segredo do agente (401)."
    diz "   O BETTRACKR_AGENT_SECRET do telemóvel tem de ser igual ao CLV_AGENT_SECRET da Vercel."
  elif grep -qE 'respondeu 403' "$SAIDA"; then
    aviso "O BetTrackr (ou a firewall da Vercel) recusou o pedido do agente (403)."
  elif grep -qE 'CANNOT LINK EXECUTABLE|command not found|node: not found|Cannot find module|ERR_MODULE_NOT_FOUND|SyntaxError' "$SAIDA"; then
    aviso "O Node ou o ficheiro do agente estão partidos (é o que acontece depois de um 'pkg upgrade' a meio)."
    diz "   1. pkg upgrade        (acaba a atualização do Node)"
    diz "   2. bash atualizar-bot.sh   (volta a pôr o agente)"
  elif grep -q 'No such file or directory' "$SAIDA"; then
    aviso "A linha do agente no crontab aponta para uma pasta ou ficheiro que já não existe (lê a linha acima)."
    diz "   Corrige-a com 'crontab -e', ou volta a pô-la com AGENTE_CMD=\"...\" depois de a apagar."
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
