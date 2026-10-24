#!/usr/bin/env bash
# instalar.sh - põe o bot da Betclic e o agente do CLV a correr numa VPS em
# Portugal (Debian 13 ou Ubuntu 24), com timers do systemd no lugar do cron do
# Termux.
#
#   bash instalar.sh --teste            só o teste do IP: a Betclic aceita esta máquina?
#   bash instalar.sh                    teste + instalação, com o bot.mjs ao lado deste script
#   bash instalar.sh /caminho/bot.mjs   o mesmo, com o bot.mjs noutro sítio
#
# Pode correr-se as vezes que for, e é também assim que se atualiza: troca o
# bot.mjs pelo que vier, volta a descarregar o agente e corre uma passagem de
# cada. Os segredos e os cofres ficam como estão.
#
# PORQUE O TESTE VEM PRIMEIRO
# A www.betclic.pt responde 403 a IPs de fora de Portugal. É geográfico, não por
# ser datacenter: a 24/10/2026 um datacenter em Viana recebeu 200, e os de Madrid,
# Barcelona, Frankfurt e Nuremberga 403. Mas a PTISP também anuncia prefixos que
# as bases de geolocalização põem em Madrid ou em Frankfurt, e com um desses o
# agente não lê preço nenhum. Por isso nada se instala sem a Betclic responder 200.
#
# O QUE FICA ONDE
#   /opt/bettrackr/{bot,clv-agent}.mjs   os programas (do root; o bot não os pode mudar)
#   /etc/bettrackr/{bot,agente}.env      os segredos (root, modo 600)
#   /var/lib/bettrackr/                  cofres e sessões por conta (utilizador bettrackr)
#   bettrackr-bot.timer                  o bot, de 30 em 30 minutos
#   bettrackr-clv.timer                  o agente, de 5 em 5 minutos (a odd de fecho)
#   bettrackr-clv-diario.timer           o agente às 06:15 de Lisboa (as odds do dia)
#
# SÓ UM DE CADA VEZ
# Os timers só se ligam depois de confirmares que o telemóvel já não corre nem o
# bot nem o agente. Dois agentes duplicam os pedidos à Betclic, e foi a pressa
# que já levou a Betclic a bloquear um IP de casa.
#
# A passkey não vem do telemóvel: a VPS cria uma sua (BetTrackr VPS) na primeira
# passagem, com o token que o bot do telemóvel deixou no servidor - ou com o de
# uma reativação no painel /bot, se esse já tiver mais de ~2h. A chave nasce aqui
# e não passa por mais lado nenhum.
#
# Os segredos nunca são impressos.

set -u

verde() { printf '\033[32m✔\033[0m %s\n' "$*"; }
aviso() { printf '\033[33m!\033[0m %s\n' "$*"; }
erro() { printf '\033[31m✘\033[0m %s\n' "$*"; }
diz() { printf '%s\n' "$*"; }
titulo() { printf '\n\033[1m── %s ──\033[0m\n' "$*"; }

BETCLIC="https://www.betclic.pt"
BASE="${BETTRACKR_BASE:-https://bettrackr.dev}"
AGENTE_URL="${AGENTE_URL:-$BASE/clv-agent.mjs}"
# O mesmo User-Agent do agente (agent/clv-agent.ts): o teste tem de pedir a
# página como o agente a vai pedir.
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
# O que prova que o ficheiro é a versão nova (as mesmas marcas do atualizar-bot.sh).
MARCA_BOT='source: "bot"'
MARCA_AGENTE='sem JSON - o BETTRACKR_BASE'

PROG=/opt/bettrackr
ETC=/etc/bettrackr
ESTADO=/var/lib/bettrackr
UTILIZADOR=bettrackr
UNIDADES=/etc/systemd/system
TIMERS="bettrackr-bot.timer bettrackr-clv.timer bettrackr-clv-diario.timer"
# Como o bot e o agente se chamam no crontab do Termux (os padrões do religar-bot.sh).
LINHAS_TERMUX='clv-agent|bot\.mjs|bot/run\.sh|src/index\.ts'

SO_TESTE=0
BOT_ORIGEM=""
for arg in "$@"; do
  case "$arg" in
    --teste) SO_TESTE=1 ;;
    -h|--help) sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*) erro "Opção desconhecida: $arg (ver: bash instalar.sh --help)"; exit 1 ;;
    *) BOT_ORIGEM="$arg" ;;
  esac
done

TMP="$(mktemp -d)"
SAIDA="$TMP/saida"
trap 'rm -rf "$TMP"' EXIT

if [ "$(id -u)" -ne 0 ] && [ "$SO_TESTE" -eq 0 ]; then
  erro "A instalação corre como root (sudo bash instalar.sh). O teste não: bash instalar.sh --teste"
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  if [ "$(id -u)" -eq 0 ] && command -v apt-get >/dev/null 2>&1; then
    diz "A instalar o curl..."
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq curl ca-certificates >/dev/null \
      || { erro "Não consegui instalar o curl. Corre 'apt-get install curl' à mão e repete."; exit 1; }
  else
    erro "Falta o curl (apt-get install curl)."
    exit 1
  fi
fi

# ------------------------------------------------------------------
# 1. O teste do IP
# ------------------------------------------------------------------
# Quatro pedidos e mais nada: a página de futebol (a que o agente lê) e a raiz dos
# três servidores da API (os do bot e o gRPC das categorias). Uma recusa da
# página pára tudo antes de se instalar o que quer que seja.
teste_ip() {
  titulo "1. A Betclic aceita este IP?"

  local ip
  ip="$(ip -4 route get 1.1.1.1 2>/dev/null | sed -n 's/.* src \([0-9.]*\).*/\1/p')"
  case "$ip" in
    "") ;;
    10.*|192.168.*|172.1[6-9].*|172.2[0-9].*|172.3[01].*)
      diz "   IP desta máquina: $ip (privado: a saída para a internet é outro, atrás de NAT)" ;;
    *) diz "   IP desta máquina: $ip" ;;
  esac

  local codigo pop destino kb
  codigo="$(curl -s -o "$TMP/pagina.html" -D "$TMP/cabecalhos" -w '%{http_code}' -m 20 \
    -H "User-Agent: $UA" -H "Accept-Language: pt-PT,pt;q=0.9" \
    "$BETCLIC/futebol-sfootball")"
  pop="$(tr -d '\r' < "$TMP/cabecalhos" | sed -n 's/^[Xx]-[Aa]mz-[Cc]f-[Pp]op: *//p' | head -n 1)"
  [ -n "$pop" ] && diz "   Servido pelo nó $pop da CloudFront (LIS = Lisboa, MAD = Madrid)."

  case "$codigo" in
    200)
      kb=$(( $(wc -c < "$TMP/pagina.html") / 1024 ))
      # O bloco de onde o agente tira as odds (lib/betclicOdds.ts, parseNgState).
      if ! grep -qE "id=[\"']ng-state[\"']" "$TMP/pagina.html"; then
        erro "A Betclic respondeu 200, mas sem o bloco das odds (${kb}KB) - não é a página que o agente lê."
        diz "   Pode ser uma página de verificação. Repete daqui a uns minutos; se continuar, este IP não serve."
        return 1
      fi
      verde "www.betclic.pt responde 200 com as odds (${kb}KB): a Betclic vê este IP como português."
      ;;
    403)
      erro "A Betclic recusa este IP (403) - é o que responde a IPs de fora de Portugal."
      diz "   Este IP está geolocalizado noutro país. Pede à PTISP um IP de um datacenter em"
      diz "   Portugal e repete o teste; se não houver, cancela a VPS. Não instales nada:"
      diz "   o agente correria sem ler preço nenhum."
      return 1
      ;;
    301|302|303|307|308)
      destino="$(tr -d '\r' < "$TMP/cabecalhos" | sed -n 's/^[Ll]ocation: *//p' | head -n 1)"
      erro "A Betclic manda este IP para outro lado (${codigo} -> ${destino:-?}): acha que está noutro país."
      diz "   Pede à PTISP um IP de um datacenter em Portugal e repete o teste."
      return 1
      ;;
    000)
      erro "Sem ligação à www.betclic.pt (DNS ou rede). Confirma a rede da VPS e repete."
      return 1
      ;;
    *)
      erro "A www.betclic.pt respondeu $codigo, que não é o que se espera (200). Repete daqui a uns minutos."
      return 1
      ;;
  esac

  # Na raiz, a API responde 404 a toda a gente (de casa também). Um 403 é que era
  # recusa; nenhuma resposta é rede.
  local h falhou=0
  for h in apif.begmedia.pt betting.begmedia.pt offering.begmedia.com; do
    codigo="$(curl -s -o /dev/null -w '%{http_code}' -m 15 -H "User-Agent: $UA" "https://$h/")"
    case "$codigo" in
      000) erro "$h: sem resposta (DNS ou rede)."; falhou=1 ;;
      403) erro "$h: recusa este IP (403)."; falhou=1 ;;
      *) verde "$h responde ($codigo, como de casa)." ;;
    esac
  done
  return "$falhou"
}

if ! teste_ip; then
  diz ""
  erro "Teste do IP falhou: não instalei nada."
  exit 2
fi

if [ "$SO_TESTE" -eq 1 ]; then
  diz ""
  verde "Teste passado. Para instalar: sudo bash instalar.sh /caminho/para/bot.mjs"
  exit 0
fi

# ------------------------------------------------------------------
# 2. O sistema: Debian/Ubuntu com systemd, Node 18 ou mais
# ------------------------------------------------------------------
titulo "2. Sistema"

if ! command -v apt-get >/dev/null 2>&1 || [ ! -d /run/systemd/system ]; then
  erro "Isto é para Debian ou Ubuntu com systemd (apt-get e systemctl)."
  exit 1
fi
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq || aviso "O apt-get update falhou; sigo com as listas que houver."

versao_node() { node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0; }

# O Node do próprio sistema chega (o bot e o agente são feitos para o 18 ou mais).
# Um que já esteja instalado - do NodeSource, por exemplo - fica como está.
if [ "$(versao_node)" -lt 18 ]; then
  diz "A instalar o Node do sistema..."
  apt-get install -y -qq nodejs >/dev/null \
    || { erro "Não consegui instalar o Node. Corre 'apt-get install nodejs' à mão e repete."; exit 1; }
fi
NODE_MAIOR="$(versao_node)"
if [ "$NODE_MAIOR" -lt 18 ]; then
  erro "O Node deste sistema é o $NODE_MAIOR; o bot precisa do 18 ou mais. O Debian 13 traz o 20."
  exit 1
fi
NODE="$(command -v node)"
if [ "$NODE_MAIOR" -eq 18 ]; then
  aviso "Node 18 ($NODE): funciona, mas já não recebe correções do projeto Node.js. O Debian 13 traz o 20."
else
  verde "Node $(node -v) em $NODE."
fi

# A VPS guarda a passkey da conta: as correções de segurança instalam-se sozinhas.
if ! dpkg -s unattended-upgrades >/dev/null 2>&1; then
  diz "A instalar as atualizações de segurança automáticas (unattended-upgrades)..."
  apt-get install -y -qq unattended-upgrades >/dev/null || aviso "Não consegui instalar o unattended-upgrades."
fi
if [ ! -f /etc/apt/apt.conf.d/20auto-upgrades ]; then
  cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
fi
dpkg -s unattended-upgrades >/dev/null 2>&1 && verde "Atualizações de segurança automáticas ligadas."

if ! id -u "$UTILIZADOR" >/dev/null 2>&1; then
  useradd --system --user-group --no-create-home --home-dir "$ESTADO" \
    --shell /usr/sbin/nologin "$UTILIZADOR" \
    || { erro "Não consegui criar o utilizador $UTILIZADOR."; exit 1; }
fi
install -d -m 755 -o root -g root "$PROG"
install -d -m 700 -o root -g root "$ETC"
install -d -m 700 -o "$UTILIZADOR" -g "$UTILIZADOR" "$ESTADO"
verde "Utilizador $UTILIZADOR e pastas prontos."

# ------------------------------------------------------------------
# 3. Os programas
# ------------------------------------------------------------------
titulo "3. Bot e agente"

# Confirma que o ficheiro é a versão nova e que o Node o aceita, e só depois o
# troca. O anterior fica ao lado, com .anterior, para voltar atrás.
instalar_programa() { # novo alvo nome marca
  local novo="$1" alvo="$2" nome="$3" marca="$4"
  if ! grep -qF "$marca" "$novo"; then
    erro "$nome: o ficheiro não é a versão nova (falta «$marca»)."
    return 1
  fi
  if ! "$NODE" --check "$novo" 2>"$TMP/check"; then
    erro "$nome: o Node recusa o ficheiro:"
    head -n 5 "$TMP/check"
    return 1
  fi
  if [ -f "$alvo" ] && cmp -s "$novo" "$alvo"; then
    verde "$nome já estava nesta versão: $alvo"
    return 0
  fi
  [ -f "$alvo" ] && cp -p "$alvo" "$alvo.anterior"
  install -m 644 -o root -g root "$novo" "$alvo"
  verde "$nome instalado: $alvo"
}

# O bot é privado e não está publicado: vem do PC (npm run build:bot -> dist/bot.mjs).
DIR_SCRIPT="$(cd "$(dirname "$0")" && pwd)"
if [ -z "$BOT_ORIGEM" ]; then
  for c in "$DIR_SCRIPT/bot.mjs" "$PWD/bot.mjs"; do
    if [ -f "$c" ]; then BOT_ORIGEM="$c"; break; fi
  done
fi
if [ -n "$BOT_ORIGEM" ]; then
  [ -f "$BOT_ORIGEM" ] || { erro "Não encontro $BOT_ORIGEM."; exit 1; }
  instalar_programa "$BOT_ORIGEM" "$PROG/bot.mjs" "Bot" "$MARCA_BOT" || exit 1
  if ! grep -qF 'BOT_PASSKEY_NOME' "$PROG/bot.mjs"; then
    aviso "Este bot.mjs ainda não conhece o BOT_PASSKEY_NOME: a passkey da VPS vai ter o mesmo nome"
    diz "   que a do telemóvel («BetTrackr Bot (...)»). Funciona na mesma; só fica mais difícil saber"
    diz "   qual apagar depois. Um bot.mjs feito a partir do código atual resolve isso."
  fi
elif [ -f "$PROG/bot.mjs" ]; then
  aviso "Sem bot.mjs novo: fica o que já estava em $PROG/bot.mjs."
else
  erro "Falta o bot.mjs. No PC, no repositório:"
  diz "     npm run build:bot"
  diz "     scp dist/bot.mjs bot/vps/instalar.sh root@<IP-da-VPS>:"
  diz "   e aqui: sudo bash instalar.sh"
  exit 1
fi

# O agente é público e sai em cada deploy.
if ! curl -fsSL -m 60 "$AGENTE_URL" -o "$TMP/clv-agent.mjs"; then
  erro "Não consegui descarregar o agente de $AGENTE_URL."
  exit 1
fi
instalar_programa "$TMP/clv-agent.mjs" "$PROG/clv-agent.mjs" "Agente do CLV" "$MARCA_AGENTE" || exit 1

# ------------------------------------------------------------------
# 4. Os segredos
# ------------------------------------------------------------------
titulo "4. Segredos"

# Um segredo vem do ambiente (BETTRACKR_TOKEN=... sudo -E bash instalar.sh) ou
# pergunta-se sem eco, e fica em $VALOR (não em $(...): lá dentro o exit não
# parava o script e o erro ia parar à variável). Vai entre plicas no ficheiro do
# systemd, que assim o lê tal e qual - por isso não pode levar plicas.
pedir_segredo() { # variável pergunta
  VALOR="${!1:-}"
  if [ -z "$VALOR" ]; then
    if [ ! -t 0 ]; then
      erro "Falta o $1: corre isto num terminal para o escreveres, ou passa-o no ambiente."
      exit 1
    fi
    read -rsp "   $2: " VALOR
    printf '\n'
  fi
  VALOR="$(printf '%s' "$VALOR" | tr -d '[:space:]')"
  case "$VALOR" in
    "") erro "O $1 ficou vazio."; exit 1 ;;
    *"'"*) erro "O $1 não pode ter plicas (')."; exit 1 ;;
  esac
}

if [ -f "$ETC/bot.env" ]; then
  verde "Segredos do bot: ficam os de $ETC/bot.env."
else
  diz "   O token do BetTrackr é o JWT da tua conta. Em bettrackr.dev, com sessão iniciada,"
  diz "   F12 > Consola: localStorage.getItem(\"bettrackr_token\") (sem as aspas à volta)."
  pedir_segredo BETTRACKR_TOKEN 'Token do BetTrackr'
  TOKEN="$VALOR"
  if ! printf '%s' "$TOKEN" | grep -qE '^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$'; then
    erro "Isso não parece um token do BetTrackr (são três blocos separados por pontos)."
    exit 1
  fi
  # A passphrase do cofre nasce aqui: a passkey da VPS é nova, não há cofre do
  # telemóvel a decifrar. Quem quiser trazer os cofres de lá passa a dele no
  # ambiente (BETCLIC_BOT_KEY=...).
  CHAVE="${BETCLIC_BOT_KEY:-$("$NODE" -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')}"
  if [ "${#CHAVE}" -lt 16 ] || printf '%s' "$CHAVE" | grep -q "[[:space:]']"; then
    erro "A BETCLIC_BOT_KEY tem de ter pelo menos 16 caracteres, sem espaços nem plicas."
    exit 1
  fi
  umask 077
  cat > "$ETC/bot.env" <<EOF
# Criado pelo instalar.sh do BetTrackr; lido pelo systemd (bettrackr-bot.service).
# BETCLIC_BOT_KEY decifra os cofres de $ESTADO: sem ela, as passkeys perdem-se.
BETCLIC_BOT_KEY='$CHAVE'
BETTRACKR_TOKEN='$TOKEN'
EOF
  umask 022
  unset TOKEN CHAVE VALOR
  chmod 600 "$ETC/bot.env"
  verde "Segredos do bot guardados em $ETC/bot.env (só o root os lê)."
fi

if [ -f "$ETC/agente.env" ]; then
  verde "Segredo do agente: fica o de $ETC/agente.env."
else
  diz "   O segredo do agente é o valor do CLV_AGENT_SECRET na Vercel (Settings > Environment Variables)."
  pedir_segredo BETTRACKR_AGENT_SECRET 'Segredo do agente'
  SEGREDO="$VALOR"
  umask 077
  cat > "$ETC/agente.env" <<EOF
# Criado pelo instalar.sh do BetTrackr; lido pelo systemd (bettrackr-clv*.service).
BETTRACKR_AGENT_SECRET='$SEGREDO'
EOF
  umask 022
  unset SEGREDO VALOR
  chmod 600 "$ETC/agente.env"
  verde "Segredo do agente guardado em $ETC/agente.env."
fi

# ------------------------------------------------------------------
# 5. As unidades do systemd
# ------------------------------------------------------------------
titulo "5. Timers do systemd"

# O que os três serviços têm em comum: um utilizador sem privilégios, o sistema
# só de leitura, e só os sockets de que a rede precisa (o AF_NETLINK é o da glibc
# a ver que endereços a máquina tem, antes de resolver um nome). Sem
# MemoryDenyWriteExecute: o V8 precisa de memória executável para compilar o
# JavaScript.
RESGUARDO="NoNewPrivileges=yes
PrivateTmp=yes
PrivateDevices=yes
ProtectSystem=strict
ProtectHome=yes
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectControlGroups=yes
RestrictSUIDSGID=yes
RestrictNamespaces=yes
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX AF_NETLINK
LockPersonality=yes
UMask=0077"

# Um serviço que encrave é morto antes da passagem seguinte: o systemd nunca
# arranca uma segunda cópia enquanto a primeira corre, por isso sem o prazo uma
# passagem presa calava o agente até alguém dar por isso.
cat > "$UNIDADES/bettrackr-bot.service" <<EOF
[Unit]
Description=BetTrackr: uma passagem do bot da Betclic
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
User=$UTILIZADOR
Group=$UTILIZADOR
Environment=BETTRACKR_BASE=$BASE
Environment=BOT_DIR=$ESTADO
Environment="BOT_PASSKEY_NOME=BetTrackr VPS"
EnvironmentFile=$ETC/bot.env
WorkingDirectory=$ESTADO
StateDirectory=bettrackr
StateDirectoryMode=0700
ExecStart=$NODE $PROG/bot.mjs --once
TimeoutStartSec=20min
$RESGUARDO
EOF

cat > "$UNIDADES/bettrackr-bot.timer" <<'EOF'
[Unit]
Description=BetTrackr: bot da Betclic de 30 em 30 minutos

[Timer]
OnCalendar=*:0/30
AccuracySec=1min
Persistent=true

[Install]
WantedBy=timers.target
EOF

servico_agente() { # nome descrição argumentos prazo
  cat > "$UNIDADES/$1.service" <<EOF
[Unit]
Description=$2
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
User=$UTILIZADOR
Group=$UTILIZADOR
Environment=BETTRACKR_BASE=$BASE
EnvironmentFile=$ETC/agente.env
WorkingDirectory=$PROG
ExecStart=$NODE $PROG/clv-agent.mjs$3
TimeoutStartSec=$4
$RESGUARDO
EOF
}
servico_agente bettrackr-clv "BetTrackr: uma passagem do agente do CLV (odd de fecho)" "" 4min
servico_agente bettrackr-clv-diario "BetTrackr: as odds do dia para as dicas de IA" " --daily" 30min

cat > "$UNIDADES/bettrackr-clv.timer" <<'EOF'
[Unit]
Description=BetTrackr: agente do CLV de 5 em 5 minutos

[Timer]
OnCalendar=*:0/5
AccuracySec=30s
Persistent=true

[Install]
WantedBy=timers.target
EOF

# A hora é a de Lisboa, seja qual for o fuso da VPS. Um systemd que não saiba de
# fusos no OnCalendar usa o da máquina.
DIARIO="*-*-* 06:15:00 Europe/Lisbon"
if ! systemd-analyze calendar "$DIARIO" >/dev/null 2>&1; then
  DIARIO="*-*-* 06:15:00"
  aviso "Este systemd não aceita o fuso no horário: a passagem diária é às 06:15 do fuso da VPS ($(date +%Z))."
  diz "   Para ser a de Lisboa: timedatectl set-timezone Europe/Lisbon"
fi
cat > "$UNIDADES/bettrackr-clv-diario.timer" <<EOF
[Unit]
Description=BetTrackr: odds do dia, de madrugada

[Timer]
OnCalendar=$DIARIO
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
verde "Unidades instaladas: bettrackr-bot, bettrackr-clv, bettrackr-clv-diario (.service e .timer)."

# ------------------------------------------------------------------
# 6. Ligar - só com o telemóvel desligado
# ------------------------------------------------------------------
titulo "6. Ligar"

if systemctl is-enabled --quiet bettrackr-clv.timer 2>/dev/null; then
  verde "Os timers já estavam ligados - é uma atualização."
else
  # Em dois passos, como no religar-bot.sh: numa pipeline só, o 'crontab -' pode
  # esvaziar o crontab enquanto o 'crontab -l' ainda o lê. E fica uma cópia.
  diz "   Só um de cada vez: antes de ligar aqui, tira o bot e o agente do crontab do"
  diz "   telemóvel. No Termux:"
  diz "     crontab -l > ~/crontab.antes-da-vps && grep -vE '$LINHAS_TERMUX' ~/crontab.antes-da-vps | crontab -"
  diz "   (Sem bot no telemóvel há mais de ~2h, reativa antes cada conta no painel /bot:"
  diz "   é com esse token que a VPS cria a passkey dela.)"
  RESPOSTA=""
  if [ -t 0 ]; then
    read -rp "   O telemóvel já não corre nenhum dos dois? Escreve 'sim' para ligar aqui: " RESPOSTA
  fi
  if [ "$RESPOSTA" != "sim" ]; then
    diz ""
    aviso "Instalado, mas desligado. Quando o telemóvel estiver parado:"
    diz "     sudo systemctl enable --now $TIMERS"
    diz "     sudo bash instalar.sh      (corre uma passagem de cada e diz o que viu)"
    exit 0
  fi
  # shellcheck disable=SC2086 # a lista de timers separa-se de propósito
  systemctl enable --now $TIMERS >/dev/null 2>&1 \
    || { erro "Não consegui ligar os timers: systemctl status $TIMERS"; exit 1; }
  verde "Timers ligados."
fi

# ------------------------------------------------------------------
# 7. Uma passagem de cada, e o que disseram
# ------------------------------------------------------------------
# Um serviço oneshot só volta quando acaba, por isso o start espera pela
# passagem. A saída vem do journal, desde o segundo em que se arrancou.
correr() { # unidade
  local desde
  desde="$(date '+%Y-%m-%d %H:%M:%S')"
  systemctl start "$1" >/dev/null 2>&1 || true
  sleep 1 # o journal recebe as últimas linhas um instante depois de o processo sair
  journalctl -u "$1" --since "$desde" -o cat --no-pager > "$SAIDA" 2>/dev/null
}

titulo "7. Uma passagem do bot (até um minuto ou dois)"
correr bettrackr-bot.service
grep -v 'SECRET=' "$SAIDA" | tail -n 12

ULTIMA="$(grep 'passagem:' "$SAIDA" | tail -n 1)"
if grep -q 'passkey criada e guardada' "$SAIDA"; then
  verde "A VPS criou a passkey dela na Betclic (BetTrackr VPS)."
fi
if grep -qE 'sem passkey local e sem ativacao|sem token de contexto valido' "$SAIDA"; then
  aviso "Falta um token da Betclic para a VPS criar a passkey (o do telemóvel já expirou)."
  diz "   1. Na app BetTrackr, separador Bot: em cada conta, cola um token novo da Betclic e carrega em «Ativar»."
  diz "   2. Corre uma passagem: sudo systemctl start bettrackr-bot.service"
elif grep -q 'sem contas ativadas nem cofres locais' "$SAIDA"; then
  aviso "Não há contas ativadas: ativa cada conta Betclic no separador Bot da app."
elif grep -qE 'Sessao BetTrackr expirada|respondeu 401' "$SAIDA"; then
  aviso "O BetTrackr recusa o token (401). Põe um novo em $ETC/bot.env (BETTRACKR_TOKEN) e corre:"
  diz "     sudo systemctl start bettrackr-bot.service"
elif grep -qE 'fetch failed|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ETIMEDOUT' "$SAIDA"; then
  aviso "O bot não chegou à Betclic ou ao BetTrackr (rede)."
elif [ -n "$ULTIMA" ] && ! printf '%s' "$ULTIMA" | grep -q 'falhas:'; then
  verde "Passagem do bot com sucesso."
else
  aviso "A passagem do bot não correu como devia - lê as linhas acima (journalctl -u bettrackr-bot -n 50)."
fi

titulo "8. Uma passagem do agente do CLV"
correr bettrackr-clv.service
grep -v 'SECRET=' "$SAIDA" | tail -n 8

if grep -q 'falta BETTRACKR_AGENT_SECRET' "$SAIDA"; then
  aviso "O agente arrancou sem o segredo: confirma o $ETC/agente.env."
elif grep -qE 'respondeu 401' "$SAIDA"; then
  aviso "O BetTrackr recusa o segredo do agente (401): tem de ser igual ao CLV_AGENT_SECRET da Vercel."
  diz "   Corrige o $ETC/agente.env e corre: sudo systemctl start bettrackr-clv.service"
elif grep -qE 'respondeu 404|sem JSON' "$SAIDA"; then
  aviso "O endereço do BetTrackr não é a API (404 ou uma página que não é JSON): $BASE"
elif grep -qE 'respondeu 5[0-9][0-9]' "$SAIDA"; then
  aviso "O BetTrackr respondeu com um erro dele (5xx) - a VPS está bem. Vê os logs da Vercel."
elif grep -qE 'http-403|http-429' "$SAIDA"; then
  aviso "A Betclic recusou leituras deste IP (403/429), apesar de o teste ter passado. Vê se passa sozinho."
elif grep -qE 'nada a ler|enviadas [0-9]' "$SAIDA"; then
  verde "Agente do CLV a correr: a passagem já aparece no painel /bot, em «Passagens do agente de CLV»."
else
  aviso "A passagem do agente não correu como devia - lê as linhas acima (journalctl -u bettrackr-clv -n 50)."
fi

titulo "Feito"
diz "   Estado dos timers:   systemctl list-timers 'bettrackr-*'"
diz "   Logs:                journalctl -u bettrackr-bot -n 50   (ou bettrackr-clv, bettrackr-clv-diario)"
diz "   Atualizar:           sudo bash instalar.sh /caminho/para/bot.mjs novo"
diz ""
diz "   Quando a VPS tiver uma passagem do bot com sucesso, tira do telemóvel o que ficou:"
if grep -qF 'BOT_PASSKEY_NOME' "$PROG/bot.mjs"; then
  diz "     • em betclic.pt/account/security, apaga as passkeys «BetTrackr Bot (...)» (ficam as «BetTrackr VPS (...)»);"
else
  diz "     • em betclic.pt/account/security, apaga a mais antiga das duas «BetTrackr Bot (...)» de cada conta;"
fi
diz "     • no Termux, apaga os cofres antigos: rm <pasta do bot>/passkey-*.enc <pasta do bot>/session-*.enc"
