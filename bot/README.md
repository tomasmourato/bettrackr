# Bot local da Betclic

Importa as tuas apostas da Betclic de hora a hora, **sem browser aberto**, a
correr na **tua** maquina (Raspberry Pi, NAS, PC sempre ligado) e nao na nuvem.

Corre em casa de propósito: assim os pedidos saem da tua ligacao em Portugal — a
tua conta acedida por ti, de onde tu estas — e a chave privada nunca sai deste
computador. Ver o plano para o raciocinio e os limites.

> **Aviso, sem rodeios.** Os T&C da betclic.pt (Bem Operations, licencas SRIJ
> 001/004) proibem uso por robos (clausula 1.1.2) e preveem *suspensao da conta
> ate esclarecimento* se detetarem um (1.7.6). Isto vale para qualquer
> automacao. O risco e teu e de quem partilha a feature. Este codigo so le, nunca
> aposta, e a passkey e revogavel a dois cliques — mas o risco nao e zero.

---

## Marco 0 — o teste que decide tudo

**Antes de qualquer outra coisa**, prova que um login por passkey da tua ligacao
de casa entra sem disparar o SMS de "novo dispositivo". Se disparar, o bot nao
serve e paramos aqui.

### 0. Preparar

```bash
cd bettrackr/bot
npm install            # so precisa de 'tsx' (ja esta no repo principal; senao: npm i -D tsx)
```

Corre tudo **da tua ligacao normal**, nao de uma VPN nem de um servidor.

### 1. Obter o teu Bearer token da Betclic

O token e o que a tua sessao ja usa; nao e uma password e nao o partilhas com
ninguem. Para o ler:

1. Abre `betclic.pt` no teu browser, com sessao iniciada.
2. Abre as ferramentas de programador (F12) → separador **Console**.
3. Cola isto e carrega Enter:

   ```js
   (() => {
     const of = window.fetch;
     window.fetch = function (i, init) {
       try {
         const u = typeof i === "string" ? i : i?.url;
         const h = new Headers(init?.headers || (i && i.headers) || {});
         const a = h.get("Authorization");
         if (u?.includes("begmedia") && a?.startsWith("Bearer ")) {
           console.log("%cTOKEN:", "color:lime", a.slice(7));
         }
       } catch {}
       return of.apply(this, arguments);
     };
     console.log("pronto — agora abre as tuas Apostas / historico");
   })();
   ```

4. Clica em **Apostas** (ou recarrega o historico). O token aparece no console,
   a verde. Copia-o (o texto todo a seguir a `TOKEN:`).

### 2. Registar a passkey de teste

```bash
npx tsx marco0.ts enrol <cola-o-token-aqui>
```

Depois **abre `betclic.pt/account/security`** e confirma que aparece uma chave de
acesso nova. (E normal; e o que estamos a testar.)

### 3. Entrar com ela — a pergunta do teste

```bash
npx tsx marco0.ts login
```

Le o resultado e **olha para o telemovel**:

- **Login OK, sem SMS** → o caminho e este. Avanca-se para o resto do plano.
- **Login OK, mas chegou SMS** → a Betclic exige 2Fo mesmo com passkey. Para-se.
- **Login recusado (4xx)** → le a mensagem; se falar de dispositivo/2FA, e a
  resposta a pergunta. Se falar do formato do pedido, ajusta-se `shape*()` em
  `src/betclicAuth.ts` e repete-se.

### 4. Limpar

```bash
npx tsx marco0.ts cleanup <token>     # apaga a passkey de teste pela API
```

ou apaga-a a mao em `betclic.pt/account/security` (os `...` → apagar). Apaga
tambem `bot/marco0-key.json`.

---

## Depois do Marco 0

Se o teste passar, o resto do plano ganha corpo: cofre cifrado (`vault.ts`),
ciclo de importacao (`sync.ts`), o servico com timer horario (`index.ts`), o
painel de estado no BetTrackr e a unidade systemd para o Pi. Nada disso se
constroi antes de o Marco 0 dar verde.

## O que ja esta feito e testado

- `src/softAuthenticator.ts` — o autenticador WebAuthn em software (par P-256,
  CBOR, atestacao e assercao). Testado offline em `test/softAuthenticator.test.ts`
  (`bun test test`): uma assercao nossa verifica com a chave publica do registo,
  que e o que o servidor da Betclic faz.
- `src/betclicAuth.ts` — as duas cerimonias contra os endpoints reais da Betclic.
- `marco0.ts` — o teste acima.

---

## O bot completo (Metade A)

Depois do Marco 0, o `bot/` ja corre de ponta a ponta: login por passkey ->
ler apostas novas da Betclic -> (mapear) -> enviar ao BetTrackr. So le da
Betclic; so escreve na conta do proprio dono.

### 1. Mover a chave para o cofre cifrado

O `enrol` do Marco 0 guardou a chave em claro (`marco0-key.json`). Passa-a para
o cofre cifrado e apaga o ficheiro em claro:

```bash
# a passphrase do cofre - guarda-a, e o que decifra a chave da passkey
export BETCLIC_BOT_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
npx tsx marco0.ts vault-import      # escreve bot/passkey.enc
rm marco0-key.json                  # ja nao e preciso
```

### 2. Uma passagem em dry-run (nao envia nada, so imprime)

Ve o que o bot importaria, sem tocar no BetTrackr. Precisa so de um token de
contexto begmedia recente (o mesmo do passo 2 do Marco 0) e da passphrase:

```bash
export BETCLIC_BOT_KEY=<a mesma de cima>
export BETCLIC_CONTEXT_TOKEN=<token begmedia recente>
npm run once            # login por passkey -> le -> imprime "[dry] ..."
```

### 3. A serio: enviar para o BetTrackr

Acrescenta o destino. Com `BETTRACKR_BASE` + `BETTRACKR_TOKEN` definidos, o
`--once` deixa de ser dry-run e envia mesmo (com deduplicacao):

```bash
export BETTRACKR_BASE=https://betrackr.vercel.app
export BETTRACKR_TOKEN=<JWT do BetTrackr da conta>
npm run once            # uma passagem real
npm start               # continuo, de hora a hora
```

> Ate a migracao 020 (Metade B) por o indice unico, a deduplicacao e so do lado
> do cliente (le o historico do BetTrackr e compara), tal como a extensao. Correr
> duas instancias ao mesmo tempo (extensao + bot) pode duplicar; o indice unico
> resolve isso de vez.

### 4. A correr sozinho de 30 em 30 min (telemovel / Termux, como o CLV)

O bot corre em modo `--once` (uma passagem e sai), disparado por um crontab de
30 em 30 minutos - exatamente o padrao do CLV. Nao e o daemon; e o cron a chamar
o `--once`, e o encadeamento do token faz-se pela sessao cifrada (session.enc),
nao por um processo sempre vivo.

Porque 30 min funciona: o access_token dura ~2h, por isso a sessao guardada esta
sempre fresca entre passagens; so o PRIMEIRO arranque precisa do
`BETCLIC_CONTEXT_TOKEN`.

No Termux, um ficheiro de ambiente (`~/bettrackr/bot/bot.env`, modo 600) com os
segredos:

```
BETCLIC_BOT_KEY=<32 bytes hex>
BETTRACKR_BASE=https://betrackr.vercel.app
BETTRACKR_TOKEN=<JWT do BetTrackr da conta>
BETCLIC_CONTEXT_TOKEN=<so para o 1o arranque; podes apagar depois>
```

Um wrapper `~/bettrackr/bot/run.sh`:

```bash
#!/data/data/com.termux/files/usr/bin/bash
cd ~/bettrackr/bot
set -a; . ./bot.env; set +a
npx tsx src/index.ts --once >> ~/bettrackr/bot/bot.log 2>&1
```

E a entrada no `crontab -e` (Termux):

```
*/30 * * * * ~/bettrackr/bot/run.sh
```

**Alternativa (Raspberry Pi / PC sempre ligado):** o daemon continuo, com a
unidade systemd em [betclic-bot.service](betclic-bot.service) (intervalo default
1800s = 30 min). Os segredos vao no mesmo tipo de ficheiro de ambiente.

### Variaveis de ambiente

| Var | Para que serve |
| --- | --- |
| `BETCLIC_BOT_KEY` | passphrase do cofre (decifra a chave da passkey). Obrigatoria. |
| `BETCLIC_CONTEXT_TOKEN` | so o dry-run legado. No modo real (multi-conta) o arranque de cada conta vem da ativacao no painel /bot, nao daqui. |
| `BETTRACKR_BASE` / `BETTRACKR_TOKEN` | destino no BetTrackr. Sem eles => dry-run. Tambem deixam o bot puxar a ativacao da app. O `BETTRACKR_TOKEN` so serve de ARRANQUE: o bot auto-renova-o a cada passagem (GET /api/bot/token) e guarda-o na sessao cifrada, por isso nao ha refresh a mao de 7 em 7 dias enquanto o bot correr dentro da validade. |
| `BOT_INTERVAL_SEC` | intervalo entre passagens (default 1800 = 30 min). |
| `BOT_DIR` | pasta onde vivem os cofres e sessoes POR CONTA (default: a pasta `bot/`). Multi-conta guarda aqui `passkey-<accountId>.enc` e `session-<accountId>.enc`, um par por conta Betclic. |
| `BOT_VAULT` / `BOT_KEYFILE` | so o dry-run legado (sem `BETTRACKR_*`): cofre `passkey.enc` / chave em claro `marco0-key.json`, para testar o mapeamento localmente sem multi-conta. |

### Varias contas Betclic (multi-conta)

Um dono pode ter 2+ contas na Betclic. O painel **/bot** mostra **um cartao por
conta Betclic** (as bookie_accounts de bookmaker Betclic, criadas nas contas por
casa). Ativa-se **uma vez por conta**: com cada conta Betclic com sessao
iniciada, captura-se/cola-se o token dessa conta no cartao dela.

Este processo (o bot) trata **todas** as contas ativadas em cada passagem, uma a
uma, cada uma com o seu `passkey-<accountId>.enc` e `session-<accountId>.enc` na
pasta `BOT_DIR`. As apostas de cada conta vao etiquetadas com o `accountId`, por
isso caem na bookie_account certa (tal como a extensao encaminha por username).
**Isolamento de falhas:** se uma conta falhar (ex.: sessao Betclic expirada), so
essa pausa nessa passagem - as outras seguem e o bot nao morre.

> **Migracao a partir do bot antigo (uma conta):** os ficheiros antigos
> `passkey.enc` / `session.enc` (sem `accountId` no nome) deixam de ser usados no
> modo real. Reativa **cada** conta uma vez no painel /bot e o bot cria os cofres
> por conta sozinho (enrolment automatico). Podes apagar os ficheiros antigos.

### Ativacao pela app (dispensa o `BETCLIC_CONTEXT_TOKEN` a mao)

Cada dono ativa o bot no painel **/bot** da app - e la, nao neste ficheiro, que o
token de contexto e entregue, **por conta** (ver acima):

- **Desktop / webapp:** a extensao BetTrackr capta o token da Betclic sozinha.
  Botao «Capturar token da extensao» no cartao da conta -> a app envia-o cifrado
  para o servidor. Inicia sessao na Betclic com a conta desse cartao antes de
  capturar.
- **Mobile:** cola-se o token da conta no campo do cartao dela.

O bot (este processo) puxa esse token no arranque frio via
`GET /api/bot/context-token`, autenticado com o `BETTRACKR_TOKEN`. Ou seja: basta
`BETTRACKR_BASE` + `BETTRACKR_TOKEN` definidos e a ativacao feita no painel; o
`BETCLIC_CONTEXT_TOKEN` passa a ser so um atalho alternativo. O token vai cifrado
(AES-256-GCM) na tabela `bot_context_tokens`; a chave da passkey continua a nunca
sair desta maquina.

**A passkey e criada AUTOMATICAMENTE.** Nao e preciso `marco0 enrol` nem
`vault-import` a mao: se nao houver `passkey.enc`, o bot cria a passkey na 1a
passagem com o token da ativacao e guarda o cofre. E se a passkey for apagada na
Betclic (o login passa a falhar), basta reativar no painel /bot que o bot a
recria sozinho na passagem seguinte - o setup e a recuperacao de um admin fazem-se
todos pela app. A chave privada nasce e vive no dispositivo; nunca passa pelo
servidor. (O `marco0 enrol` continua a existir para quem quiser provisionar a
passkey a mao antes de por o bot a correr.)

### Arranque e reinicio

Cada conta precisa de UM token de contexto begmedia para o **primeiro** arranque.
Duas formas, por ordem de preferencia: (1) ativa-la no painel /bot da app - o bot
puxa o token dessa conta sozinho; (2) a sessao cifrada de uma passagem anterior
dessa conta. A partir dai cada conta encadeia sozinha: cada login por passkey da
um access_token (~2h) que serve de contexto ao seguinte.

Apos cada passagem com sucesso o bot **guarda a sessao cifrada** de cada conta
(`session-<accountId>.enc`, com a `BETCLIC_BOT_KEY`). Num reinicio - deploy,
crash, reboot - le essas sessoes e, se o access ainda for valido (< 2h),
rearranca **sem** precisar de um token novo. O token do BetTrackr (do dono, nao
da conta) tambem fica guardado nessas sessoes e e reutilizado no arranque.

Se uma conta ficar mais de ~2h sem passar, a sua sessao expira - e ai a ativacao
pela app fecha o caso: reativa essa conta no painel /bot e a passagem seguinte
puxa o token novo, sem tocar em ficheiros.
