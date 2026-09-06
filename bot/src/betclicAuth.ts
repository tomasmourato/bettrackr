// betclicAuth.ts - a camada que fala com a Betclic. Duas cerimonias:
//
//   INSCRICAO (uma vez, autenticada com o Bearer que a sessao do admin ja tem):
//     POST /api/v1/me/passkeys/options  -> desafio + dados do utilizador
//     POST /api/v1/me/passkeys          -> regista a nossa chave publica
//
//   LOGIN (de hora a hora, SEM autenticacao - e o proprio ponto):
//     POST /api/v2/logins/passkeys/options -> desafio
//     POST /api/v2/logins/passkeys         -> assercao -> Bearer token
//
// O formato dos corpos segue o padrao WebAuthn/FIDO2 (o mesmo que servidores
// como o @simplewebauthn produzem e aceitam). Se o Marco 0 mostrar que a Betclic
// espera nomes de campo diferentes, o ajuste e nas duas funcoes `shape*` abaixo
// e em mais lado nenhum.
//
// Os pedidos reais da Betclic a estes endpoints (lidos do cURL do proprio
// browser) NAO levam cookies nem X-Bg-Fingerprint - nao ha anti-bot no caminho
// e nada de identidade de dispositivo a reproduzir. Levam so headers funcionais:
// e esses que enviamos, o conjunto minimo que o servidor aceita.

import { randomUUID } from "node:crypto";
import {
  SoftCredential,
  RegistrationResult,
  AssertionResult,
  b64url,
  fromB64any,
  createRegistration,
  createAssertion,
} from "./softAuthenticator.js";

const APIF = "https://apif.begmedia.pt";

// Versao da API que o cliente declara. Header funcional (nao identidade): sem
// ele os endpoints de login respondem 400. Muda com as versoes do site da
// Betclic - se um dia comecar a falhar com 400, e o primeiro a atualizar.
const APP_VERSION = "10.3.0-5";

// Headers funcionais que a app poe nos pedidos begmedia. O nome certo do
// universo e `x-bg-ref-universe: SPORTS` (nao `x-bg-universe`), e a lingua vai
// no accept-language padrao. Sem Content-Type: os "options" saem sem corpo.
function ctxHeaders(): Record<string, string> {
  return {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "pt-PT",
    "X-Bg-Ref-Universe": "SPORTS",
    AppVersion: APP_VERSION,
    // Id de correlacao por pedido - so um trace, gerado na hora (como o browser).
    "X-Correlation-Id": randomUUID(),
  };
}

export interface RegistrationOptions {
  challenge: Buffer;
  userHandle: Buffer; // os bytes de user.id que o servidor manda
  raw: any; // resposta crua, para diagnostico no Marco 0
}

export interface LoginOptions {
  challenge: Buffer;
  raw: any;
}

// body === null -> pedido sem corpo (e sem Content-Type). Caso contrario, JSON.
async function post(url: string, body: unknown, headers: Record<string, string>): Promise<Response> {
  if (body === null) return fetch(url, { method: "POST", headers });
  return fetch(url, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

// Extrai o desafio de uma resposta de opcoes, seja qual for o embrulho comum
// (challenge no topo, ou dentro de publicKey). Tolerante de propósito: e a
// parte que mais varia entre servidores.
function readChallenge(data: any): Buffer {
  const c = data?.challenge ?? data?.publicKey?.challenge ?? data?.options?.challenge;
  if (typeof c !== "string") throw new Error("resposta de opcoes sem 'challenge' reconhecivel");
  return fromB64any(c);
}

function readUserHandle(data: any): Buffer {
  const u = data?.user?.id ?? data?.publicKey?.user?.id;
  if (typeof u !== "string") throw new Error("resposta de opcoes sem 'user.id' reconhecivel");
  return fromB64any(u);
}

// ------------------------------------------------------------
// INSCRICAO
// ------------------------------------------------------------

function authHeaders(betclicToken: string): Record<string, string> {
  return { ...ctxHeaders(), Authorization: `Bearer ${betclicToken}` };
}

export async function requestRegistrationOptions(betclicToken: string): Promise<RegistrationOptions> {
  const res = await post(`${APIF}/api/v1/me/passkeys/options`, null, authHeaders(betclicToken));
  if (!res.ok) throw new Error(`opcoes de registo: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { challenge: readChallenge(data), userHandle: readUserHandle(data), raw: data };
}

// Corpo de POST /me/passkeys na forma exata que a Betclic espera (lida do
// pedido real do browser): alem do attestationObject, o backend le direto a
// publicKey (SPKI), o publicKeyAlgorithm e o authenticatorData. O nome da
// passkey NAO vai aqui - vai no header `device-name`.
function shapeRegistration(reg: RegistrationResult) {
  const id = b64url(reg.credentialId);
  return {
    id,
    rawId: id,
    response: {
      attestationObject: b64url(reg.attestationObject),
      clientDataJSON: b64url(reg.clientDataJSON),
      transports: ["internal"],
      publicKeyAlgorithm: -7,
      publicKey: b64url(reg.publicKeySpki),
      authenticatorData: b64url(reg.authenticatorData),
    },
    type: "public-key",
    clientExtensionResults: { credProps: { rk: true } },
    authenticatorAttachment: "platform",
  };
}

export async function submitRegistration(
  betclicToken: string,
  cred: SoftCredential,
  options: RegistrationOptions,
  deviceName = "BetTrackr",
): Promise<{ ok: boolean; status: number; body: string }> {
  const reg = createRegistration(cred, options.challenge);
  const headers = { ...authHeaders(betclicToken), "Device-Name": deviceName };
  const res = await post(`${APIF}/api/v1/me/passkeys`, shapeRegistration(reg), headers);
  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}

// ------------------------------------------------------------
// LOGIN (nao autenticado)
// ------------------------------------------------------------

// O login por passkey precisa de um token de CONTEXTO no Authorization - QUALQUER
// token begmedia valido serve, seja o anonimo de visitante ou o proprio token de
// utilizador (confirmado no Marco 0). E por isso que o bot se auto-sustenta: usa
// o access_token que ja tem (dura ~2h, corre de hora a hora) como contexto do
// login seguinte, sem precisar de cunhar tokens anonimos.
export async function requestLoginOptions(contextToken: string): Promise<LoginOptions> {
  const headers = { ...ctxHeaders(), Authorization: `Bearer ${contextToken}` };
  const res = await post(`${APIF}/api/v2/logins/passkeys/options`, null, headers);
  if (!res.ok) throw new Error(`opcoes de login: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { challenge: readChallenge(data), raw: data };
}

function shapeAssertion(cred: SoftCredential, a: AssertionResult, userHandle: Buffer) {
  const id = b64url(cred.credentialId);
  return {
    id,
    rawId: id,
    type: "public-key",
    response: {
      clientDataJSON: b64url(a.clientDataJSON),
      authenticatorData: b64url(a.authenticatorData),
      signature: b64url(a.signature),
      userHandle: b64url(userHandle),
    },
    clientExtensionResults: {},
  };
}

export interface LoginResult {
  ok: boolean;
  status: number;
  token: string | null;        // access_token: o Bearer para chamar /me/bets
  refreshToken: string | null; // renova o access sem repetir a passkey
  status_field: string | null; // "Validated" no caso bom
  body: string;
}

// A resposta boa e { status:"Validated", validated_info:{ tokens:{ access_token,
// refresh_token } } }. Mantemos alternativas por robustez.
function readTokens(data: any): { access: string | null; refresh: string | null; status: string | null } {
  const t = data?.validated_info?.tokens ?? data?.tokens ?? {};
  return {
    access: t.access_token ?? data?.access_token ?? data?.token ?? null,
    refresh: t.refresh_token ?? data?.refresh_token ?? null,
    status: data?.status ?? null,
  };
}

export async function submitLogin(
  cred: SoftCredential,
  userHandle: Buffer,
  options: LoginOptions,
  contextToken: string,
  signCount = 0,
): Promise<LoginResult> {
  const a = createAssertion(cred, options.challenge, signCount);
  const headers = { ...ctxHeaders(), Authorization: `Bearer ${contextToken}` };
  const res = await post(`${APIF}/api/v2/logins/passkeys`, shapeAssertion(cred, a, userHandle), headers);
  const text = await res.text();
  let access: string | null = null;
  let refresh: string | null = null;
  let status_field: string | null = null;
  try {
    const parsed = readTokens(JSON.parse(text));
    access = parsed.access;
    refresh = parsed.refresh;
    status_field = parsed.status;
  } catch {
    // resposta nao-JSON; deixa tudo a null e o corpo cru fala por si
  }
  return { ok: res.ok, status: res.status, token: access, refreshToken: refresh, status_field, body: text };
}
