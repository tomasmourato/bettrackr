// softAuthenticator.ts - um autenticador WebAuthn implementado em software.
//
// A Betclic suporta passkeys e, no registo, pede `attestation: "none"` - ou
// seja, NAO verifica que tipo de dispositivo criou a chave. Um autenticador de
// plataforma (Touch ID, Windows Hello) e este codigo produzem a mesma coisa:
// um par de chaves P-256 e uma assinatura. A diferenca - um humano a por o
// dedo - vive so no bit UV do authenticatorData, que aqui pomos a 1. Nao ha do
// lado do servidor forma de a distinguir, e e por isso que isto funciona.
//
// O modulo e PURO: nao faz rede nem I/O, nao le segredos, nao sabe o que e a
// Betclic para la do rpId. Recebe desafios (bytes) e uma credencial, devolve os
// blocos WebAuthn ja montados. Quem fala com a Betclic e o betclicAuth.ts; quem
// guarda a chave cifrada e o vault.ts. Assim isto testa-se offline, com vetores
// conhecidos, sem tocar em conta nenhuma.

import { createHash, generateKeyPairSync, sign, createPrivateKey, createPublicKey, randomBytes, KeyObject } from "node:crypto";

// A rpId da Betclic e "www.betclic.pt" (com o www) - lido da cerimonia real.
// O rpIdHash entra no authenticatorData e o servidor recalcula-o; um "betclic.pt"
// sem www daria um hash diferente e a assercao seria recusada.
export const RP_ID = "www.betclic.pt";
export const ORIGIN = "https://www.betclic.pt";

// Bits do campo `flags` do authenticatorData (WebAuthn 6.1).
const FLAG_UP = 0x01; // User Present
const FLAG_UV = 0x04; // User Verified - a Betclic pede userVerification:"required"
const FLAG_AT = 0x40; // Attested credential data presente (so no registo)

export interface SoftCredential {
  // Identificador da credencial (rawId). 32 bytes aleatorios - a Betclic nao
  // impoe tamanho; 32 e o que os autenticadores de plataforma costumam usar.
  credentialId: Buffer;
  // Chave privada em PKCS8 PEM - e ISTO que o vault.ts cifra e guarda. E o
  // unico segredo do bot; quem o tiver entra na conta.
  privateKeyPem: string;
  // Chave publica em formato COSE (CBOR), pronta a ir no attestedCredentialData.
  publicKeyCose: Buffer;
}

// base64url sem padding - o alfabeto que o WebAuthn usa em todo o lado.
export function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Aceita base64 OU base64url, com ou sem padding, e devolve os bytes. O
// desafio da Betclic chega numa destas formas e nao queremos partir por causa
// de um `-` vs `+`.
export function fromB64any(s: string): Buffer {
  const norm = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = norm.length % 4 === 0 ? norm : norm + "=".repeat(4 - (norm.length % 4));
  return Buffer.from(pad, "base64");
}

// ------------------------------------------------------------
// CBOR - so o suficiente para uma chave COSE e o attestationObject.
//
// Escrevemos a mao (em vez de uma dependencia) porque o alfabeto e minusculo e
// fixo: inteiros (positivos e negativos), byte strings, text strings e mapas
// pequenos. As chaves dos mapas saem em ordem canonica CTAP2 (comprimento e
// depois lexicografica), que para uma chave COSE da a ordem natural 1,3,-1,-2,-3.
// ------------------------------------------------------------

// Cabecalho de um item CBOR: tipo maior (3 bits altos) + argumento.
function cborHead(major: number, n: number): Buffer {
  const mt = major << 5;
  if (n < 24) return Buffer.from([mt | n]);
  if (n < 0x100) return Buffer.from([mt | 24, n]);
  if (n < 0x10000) return Buffer.from([mt | 25, n >> 8, n & 0xff]);
  // 32 bits chega de sobra para tudo o que aqui aparece.
  return Buffer.from([mt | 26, (n >>> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]);
}

function cborUint(n: number): Buffer {
  return cborHead(0, n);
}

// Inteiro negativo: tipo maior 1, argumento = -1-n. Ex.: -7 -> arg 6, -257 -> arg 256.
function cborNint(n: number): Buffer {
  return cborHead(1, -1 - n);
}

function cborBytes(b: Buffer): Buffer {
  return Buffer.concat([cborHead(2, b.length), b]);
}

function cborText(s: string): Buffer {
  const b = Buffer.from(s, "utf8");
  return Buffer.concat([cborHead(3, b.length), b]);
}

// Inteiro COSE (pode ser negativo) - usado nas chaves e valores da chave COSE.
function cborInt(n: number): Buffer {
  return n < 0 ? cborNint(n) : cborUint(n);
}

// ------------------------------------------------------------
// Chave publica em COSE (RFC 8152), para uma chave EC2 P-256/ES256:
//   1 (kty):  2  (EC2)
//   3 (alg): -7  (ES256)
//  -1 (crv):  1  (P-256)
//  -2 (x):   32 bytes
//  -3 (y):   32 bytes
// ------------------------------------------------------------
export function encodeCoseKey(x: Buffer, y: Buffer): Buffer {
  if (x.length !== 32 || y.length !== 32) {
    throw new Error(`coordenadas EC invalidas: x=${x.length} y=${y.length} (esperado 32)`);
  }
  return Buffer.concat([
    cborHead(5, 5), // mapa de 5 pares
    cborInt(1), cborInt(2),
    cborInt(3), cborInt(-7),
    cborInt(-1), cborInt(1),
    cborInt(-2), cborBytes(x),
    cborInt(-3), cborBytes(y),
  ]);
}

// ------------------------------------------------------------
// Geracao da credencial: par P-256 novo + credentialId aleatorio.
//
// As coordenadas x/y saem do JWK da chave publica (base64url de 32 bytes cada).
// ------------------------------------------------------------
export function generateCredential(): SoftCredential {
  const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const jwk = publicKey.export({ format: "jwk" }) as { x: string; y: string };
  const x = fromB64any(jwk.x);
  const y = fromB64any(jwk.y);
  const credentialId = randomBytes(32);
  return {
    credentialId,
    privateKeyPem: privateKey.export({ format: "pem", type: "pkcs8" }).toString(),
    publicKeyCose: encodeCoseKey(x, y),
  };
}

// SHA-256(rpId) - os 32 bytes que abrem o authenticatorData.
export function rpIdHash(rpId: string = RP_ID): Buffer {
  return createHash("sha256").update(rpId, "utf8").digest();
}

// clientDataJSON - o que o browser assinaria. O `challenge` vai em base64url
// (string), NAO os bytes crus: o servidor descodifica e compara com o que
// emitiu. `crossOrigin:false` porque a cerimonia corre na propria origem.
export function buildClientDataJSON(type: "webauthn.create" | "webauthn.get", challenge: Buffer): Buffer {
  const obj = { type, challenge: b64url(challenge), origin: ORIGIN, crossOrigin: false };
  return Buffer.from(JSON.stringify(obj), "utf8");
}

// authenticatorData (WebAuthn 6.1). No registo leva o attestedCredentialData
// (aaguid a zero, credId, chave COSE) e o bit AT; na assercao nao.
function buildAuthData(opts: {
  rpId?: string;
  signCount: number;
  attested?: { credentialId: Buffer; coseKey: Buffer };
}): Buffer {
  const hash = rpIdHash(opts.rpId ?? RP_ID);
  let flags = FLAG_UP | FLAG_UV;
  const parts: Buffer[] = [];
  if (opts.attested) {
    flags |= FLAG_AT;
    const aaguid = Buffer.alloc(16, 0); // atestacao "none" -> AAGUID a zero
    const idLen = Buffer.alloc(2);
    idLen.writeUInt16BE(opts.attested.credentialId.length, 0);
    parts.push(aaguid, idLen, opts.attested.credentialId, opts.attested.coseKey);
  }
  const count = Buffer.alloc(4);
  count.writeUInt32BE(opts.signCount >>> 0, 0);
  return Buffer.concat([hash, Buffer.from([flags]), count, ...parts]);
}

// attestationObject = CBOR{ fmt:"none", attStmt:{}, authData }. As chaves saem
// por ordem alfabetica de comprimento igual, que e o que os verificadores
// esperam de uma atestacao "none".
export function buildAttestationObject(authData: Buffer): Buffer {
  return Buffer.concat([
    cborHead(5, 3), // mapa de 3 pares
    cborText("fmt"), cborText("none"),
    cborText("attStmt"), cborHead(5, 0), // mapa vazio
    cborText("authData"), cborBytes(authData),
  ]);
}

export interface RegistrationResult {
  credentialId: Buffer;
  clientDataJSON: Buffer;
  attestationObject: Buffer;
  // Campos que o browser tambem envia e que o backend da Betclic le direto:
  authenticatorData: Buffer; // o authData cru (o mesmo que vai dentro do attObj)
  publicKeySpki: Buffer;     // a chave publica em SPKI DER (getPublicKey())
}

// Cerimonia de registo: transforma o desafio do servidor nos blocos que a
// resposta a POST /me/passkeys leva. O signCount fica a 0, como reportam os
// autenticadores de plataforma.
export function createRegistration(cred: SoftCredential, challenge: Buffer): RegistrationResult {
  const clientDataJSON = buildClientDataJSON("webauthn.create", challenge);
  const authData = buildAuthData({
    signCount: 0,
    attested: { credentialId: cred.credentialId, coseKey: cred.publicKeyCose },
  });
  // getPublicKey() do browser devolve a chave em SPKI DER; derivamos o mesmo da
  // nossa chave privada. E o que o backend usa para guardar a chave publica.
  const publicKeySpki = createPublicKey(createPrivateKey(cred.privateKeyPem)).export({
    format: "der",
    type: "spki",
  });
  return {
    credentialId: cred.credentialId,
    clientDataJSON,
    attestationObject: buildAttestationObject(authData),
    authenticatorData: authData,
    publicKeySpki,
  };
}

export interface AssertionResult {
  authenticatorData: Buffer;
  clientDataJSON: Buffer;
  signature: Buffer; // ECDSA DER, tal como o WebAuthn espera para ES256
}

// Cerimonia de login (a que corre de hora a hora). A assinatura cobre
// authenticatorData || SHA-256(clientDataJSON), em ECDSA-P256-SHA256. O
// `crypto.sign` do Node ja devolve DER (ASN.1), que e o formato do WebAuthn.
//
// signCount mantem-se a 0: e o que os autenticadores de plataforma reportam, e
// evita a heuristica de "contador que anda para tras" quando ha varias sessoes.
export function createAssertion(cred: SoftCredential, challenge: Buffer, signCount = 0): AssertionResult {
  const clientDataJSON = buildClientDataJSON("webauthn.get", challenge);
  const authData = buildAuthData({ signCount });
  const clientHash = createHash("sha256").update(clientDataJSON).digest();
  const signed = Buffer.concat([authData, clientHash]);
  const key: KeyObject = createPrivateKey(cred.privateKeyPem);
  const signature = sign("sha256", signed, key);
  return { authenticatorData: authData, clientDataJSON, signature };
}
