// marco0.ts - o teste que decide se todo o resto vale a pena.
//
// Pergunta uma coisa so: um login por passkey, feito da TUA ligacao de casa,
// entra sem disparar o SMS de "novo dispositivo"? Se disparar, o bot nao serve
// e paramos aqui - antes de escrever painel, tabelas ou cron.
//
// CORRE ISTO EM CASA, na tua ligacao normal. Corrido daqui (browser do Claude)
// o IP seria o errado e o teste nao valeria nada.
//
// Uso (ver bot/README.md para os detalhes):
//   npx tsx bot/marco0.ts enrol <betclic-bearer-token>
//     -> gera uma passkey em software e regista-a na tua conta.
//        Confirma depois em betclic.pt/account/security que ela aparece.
//   npx tsx bot/marco0.ts login
//     -> entra com essa passkey. VE O TELEMOVEL: chegou SMS? Olha o resultado.
//   npx tsx bot/marco0.ts cleanup <betclic-bearer-token>
//     -> apaga a passkey de teste (ou apaga-a a mao na pagina de seguranca).
//
// A chave de teste fica em bot/marco0-key.json, em claro e local. E descartavel
// e esta no .gitignore; apaga-a no fim.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  generateCredential,
  b64url,
  fromB64any,
  SoftCredential,
} from "./src/softAuthenticator.js";
import {
  requestRegistrationOptions,
  submitRegistration,
  requestLoginOptions,
  submitLogin,
} from "./src/betclicAuth.js";
import { fetchBetclicBets } from "./src/betclicBets.js";
import { saveVault, credentialToVault } from "./src/vault.js";

const KEY_FILE = join(import.meta.dirname, "marco0-key.json");
const APIF = "https://apif.begmedia.pt";

interface StoredKey {
  credentialId: string; // base64url
  privateKeyPem: string;
  publicKeyCose: string; // base64url
  userHandle: string; // base64url
}

function save(cred: SoftCredential, userHandle: Buffer): void {
  const data: StoredKey = {
    credentialId: b64url(cred.credentialId),
    privateKeyPem: cred.privateKeyPem,
    publicKeyCose: b64url(cred.publicKeyCose),
    userHandle: b64url(userHandle),
  };
  writeFileSync(KEY_FILE, JSON.stringify(data, null, 2));
}

function load(): { cred: SoftCredential; userHandle: Buffer } {
  if (!existsSync(KEY_FILE)) throw new Error("sem marco0-key.json - corre primeiro 'enrol'.");
  const d: StoredKey = JSON.parse(readFileSync(KEY_FILE, "utf8"));
  return {
    cred: {
      credentialId: fromB64any(d.credentialId),
      privateKeyPem: d.privateKeyPem,
      publicKeyCose: fromB64any(d.publicKeyCose),
    },
    userHandle: fromB64any(d.userHandle),
  };
}

async function cmdEnrol(token: string): Promise<void> {
  if (!token) throw new Error("falta o token: npx tsx bot/marco0.ts enrol <token>");
  console.log("1/3  a pedir opcoes de registo a Betclic...");
  const options = await requestRegistrationOptions(token);
  console.log(`     desafio de ${options.challenge.length}B, userHandle de ${options.userHandle.length}B`);

  console.log("2/3  a gerar par P-256 e a registar a chave publica...");
  const cred = generateCredential();
  const result = await submitRegistration(token, cred, options, "BetTrackr Marco0 (apagar)");

  if (!result.ok) {
    console.error(`     FALHOU (${result.status}): ${result.body.slice(0, 400)}`);
    console.error("     A forma do corpo pode diferir do padrao - ajusta shapeRegistration() em betclicAuth.ts.");
    process.exit(1);
  }
  save(cred, options.userHandle);
  console.log("3/3  registada. Chave de teste guardada em bot/marco0-key.json");
  console.log("");
  console.log(">>> Abre betclic.pt/account/security e confirma que aparece uma passkey nova.");
  console.log(">>> Depois corre:  npx tsx marco0.ts login");
}

async function cmdLogin(anonToken: string): Promise<void> {
  if (!anonToken) {
    throw new Error(
      "falta o token ANONIMO: npx tsx marco0.ts login <token-anonimo>  " +
        "(e o Authorization do pedido logins/passkeys/options - HS256, sem sub)",
    );
  }
  const { cred, userHandle } = load();
  console.log("1/2  a pedir desafio de login (com o token de visitante)...");
  const options = await requestLoginOptions(anonToken);
  console.log(`     desafio de ${options.challenge.length}B`);

  console.log("2/2  a assinar a assercao e a entrar...");
  const result = await submitLogin(cred, userHandle, options, anonToken);

  console.log("");
  console.log("=".repeat(60));
  if (result.ok && result.token) {
    console.log(`RESULTADO: LOGIN OK (status="${result.status_field}").`);
    console.log(`  access_token:  ${result.token.length} chars`);
    console.log(`  refresh_token: ${result.refreshToken ? result.refreshToken.length + " chars" : "(nao veio)"}`);
    console.log("  -> a passkey em software entra sozinha. Marco 0 concluido.");
  } else if (result.ok) {
    console.log(`RESULTADO: 200, mas sem access_token. Corpo: ${result.body.slice(0, 500)}`);
  } else {
    console.log(`RESULTADO: login recusado (${result.status}). ${result.body.slice(0, 500)}`);
  }
  console.log("=".repeat(60));
}

async function cmdCleanup(token: string): Promise<void> {
  if (!token) throw new Error("falta o token: npx tsx bot/marco0.ts cleanup <token>");
  const { cred } = load();
  const id = b64url(cred.credentialId);
  console.log(`a apagar a passkey de teste (${id.slice(0, 12)}...)`);
  const res = await fetch(`${APIF}/api/v1/me/passkeys/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json, text/plain, */*", "Accept-Language": "pt-PT", "X-Bg-Ref-Universe": "SPORTS", "X-Correlation-Id": randomUUID() },
  });
  console.log(`resposta ${res.status}. Confirma na pagina de seguranca que desapareceu.`);
  console.log("Apaga tambem bot/marco0-key.json a mao.");
}

// Sonda o endpoint de opcoes em conjuntos de headers cada vez maiores, para
// achar o MENOR que passa. So leitura - nao regista passkey nenhuma. O objetivo
// e nao enviar headers de browser (sec-ch-ua, user-agent a fingir) a menos que
// o servidor os exija mesmo.
async function cmdDebug(token: string): Promise<void> {
  if (!token) throw new Error("falta o token: npx tsx marco0.ts debug <token>");
  const url = "https://apif.begmedia.pt/api/v1/me/passkeys/options";

  const uuid = () => randomUUID();
  const funcional = (): Record<string, string> => ({
    Authorization: `Bearer ${token}`,
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "pt-PT",
    "X-Bg-Ref-Universe": "SPORTS",
    "X-Correlation-Id": uuid(),
  });
  const browserCtx: Record<string, string> = {
    Origin: "https://www.betclic.pt",
    Referer: "https://www.betclic.pt/",
  };
  const browserFull: Record<string, string> = {
    ...browserCtx,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
  };

  const variants: { nome: string; headers: Record<string, string> }[] = [
    { nome: "A) so headers funcionais (x-bg-ref-universe, accept-language, correlation-id)", headers: funcional() },
    { nome: "B) A + origin + referer", headers: { ...funcional(), ...browserCtx } },
    { nome: "C) B + user-agent + sec-fetch-* (mimica de browser)", headers: { ...funcional(), ...browserFull } },
  ];

  for (const v of variants) {
    console.log("");
    console.log("=".repeat(60));
    console.log(v.nome);
    try {
      const res = await fetch(url, { method: "POST", headers: v.headers });
      console.log(`  status: ${res.status} ${res.statusText}`);
      const body = await res.text();
      if (res.ok) {
        console.log(`  OK - corpo (${body.length}B): ${body.slice(0, 300)}`);
      } else {
        console.log(`  corpo (${body.length}B): ${body.slice(0, 400)}`);
      }
    } catch (e: any) {
      console.log(`  erro de rede: ${e.message}`);
    }
  }
  console.log("");
  console.log("A primeira variante que der 200 e a que o betclicAuth.ts deve usar.");
}

// Sonda o endpoint de OPCOES DE LOGIN (nao autenticado) com headers cada vez
// maiores, para achar o menor conjunto que devolve um desafio. So leitura, e
// nao mexe na sessao do browser. O login por passkey deu 401 so com os headers
// funcionais; aqui vemos se falta Origin/Referer/User-Agent ou um corpo.
async function cmdDebugLogin(anonToken: string): Promise<void> {
  if (!anonToken) throw new Error("falta o token anonimo: npx tsx marco0.ts debug-login <token-anonimo>");
  const url = "https://apif.begmedia.pt/api/v2/logins/passkeys/options";
  const funcional = (): Record<string, string> => ({
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "pt-PT",
    "X-Bg-Ref-Universe": "SPORTS",
    "X-Correlation-Id": randomUUID(),
    Authorization: `Bearer ${anonToken}`,
  });
  const appversion = { AppVersion: "10.3.0-5" };
  const browserCtx: Record<string, string> = {
    Origin: "https://www.betclic.pt",
    Referer: "https://www.betclic.pt/",
  };
  const ua = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
  };
  const variants: { nome: string; headers: Record<string, string>; body: string | null }[] = [
    { nome: "A) funcional + auth (atual)", headers: funcional(), body: null },
    { nome: "B) + appversion", headers: { ...funcional(), ...appversion }, body: null },
    { nome: "C) + appversion + origin + referer", headers: { ...funcional(), ...appversion, ...browserCtx }, body: null },
    { nome: "D) + tudo (appversion, origin, referer, user-agent, sec-fetch)", headers: { ...funcional(), ...appversion, ...browserCtx, ...ua }, body: null },
  ];
  for (const v of variants) {
    console.log("");
    console.log("=".repeat(60));
    console.log(v.nome);
    try {
      const init: RequestInit =
        v.body === null
          ? { method: "POST", headers: v.headers }
          : { method: "POST", headers: { ...v.headers, "Content-Type": "application/json" }, body: v.body };
      const res = await fetch(url, init);
      console.log(`  status: ${res.status} ${res.statusText}`);
      const body = await res.text();
      console.log(`  corpo (${body.length}B): ${body.slice(0, 400)}`);
    } catch (e: any) {
      console.log(`  erro de rede: ${e.message}`);
    }
  }
  console.log("");
  console.log("A primeira que devolver um desafio (challenge) e a forma certa do login.");
}

// Ciclo completo: login por passkey com o token de contexto -> le as apostas
// reais da conta. E o teste que prova que o bot consegue MESMO ler dados, nao
// so autenticar. So leitura.
async function cmdBets(contextToken: string): Promise<void> {
  if (!contextToken) throw new Error("falta um token de contexto: npx tsx marco0.ts bets <token-begmedia>");
  const { cred, userHandle } = load();

  console.log("1/3  login por passkey...");
  const options = await requestLoginOptions(contextToken);
  const login = await submitLogin(cred, userHandle, options, contextToken);
  if (!login.ok || !login.token) {
    console.log(`     FALHOU (${login.status}): ${login.body.slice(0, 300)}`);
    process.exit(1);
  }
  console.log(`     OK - access_token de ${login.token.length} chars`);

  console.log("2/3  a ler as apostas terminadas (primeira pagina)...");
  const ended = await fetchBetclicBets(login.token, "ended", {
    maxPages: 1,
    onPage: ({ lidas }) => console.log(`     lidas ${lidas}`),
  });

  console.log("3/3  amostra:");
  console.log(`     ${ended.length} aposta(s) na primeira pagina.`);
  for (const bet of ended.slice(0, 3)) {
    const ref = bet.bet_reference ?? bet.reference ?? bet.id ?? "?";
    const stake = bet.stake ?? bet.amount ?? "?";
    const status = bet.status ?? bet.result ?? "?";
    const sels = Array.isArray(bet.selections) ? bet.selections.length : "?";
    console.log(`       ref=${ref}  stake=${stake}  status=${status}  pernas=${sels}`);
  }
  console.log("");
  console.log("Se aparecem apostas tuas, o bot le a conta de ponta a ponta.");
}

async function cmdVaultImport(): Promise<void> {
  const { cred, userHandle } = load();
  const out = join(import.meta.dirname, "passkey.enc");
  saveVault(out, credentialToVault(cred, userHandle));
  console.log(`cofre escrito: ${out}`);
  console.log("Agora podes apagar bot/marco0-key.json. O bot passa a ler do cofre.");
}

const [cmd, arg] = process.argv.slice(2);
const run =
  cmd === "enrol" ? cmdEnrol(arg) :
  cmd === "login" ? cmdLogin(arg) :
  cmd === "cleanup" ? cmdCleanup(arg) :
  cmd === "debug" ? cmdDebug(arg) :
  cmd === "debug-login" ? cmdDebugLogin(arg) :
  cmd === "bets" ? cmdBets(arg) :
  cmd === "vault-import" ? cmdVaultImport() :
  Promise.reject(new Error("comando: enrol <token> | login | cleanup <token> | debug <token> | debug-login | bets <token> | vault-import"));

run.catch((e) => {
  console.error("erro:", e.message);
  process.exit(1);
});
