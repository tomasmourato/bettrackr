import { describe, expect, test } from "bun:test";
import { createHash, createPublicKey, createPrivateKey, verify } from "node:crypto";
import {
  RP_ID,
  ORIGIN,
  b64url,
  fromB64any,
  encodeCoseKey,
  generateCredential,
  rpIdHash,
  buildClientDataJSON,
  createRegistration,
  createAssertion,
} from "../src/softAuthenticator.js";

// O que estes testes fixam: uma assercao produzida por este autenticador tem
// de ser verificavel com a chave publica que o registo anunciou - exatamente o
// que o servidor da Betclic faz. Se isto passa, o par de chaves e as duas
// cerimonias estao coerentes, sem nunca falar com a Betclic.

const challenge = Buffer.from("desafio-de-teste-16b", "utf8"); // 20B, tanto faz

// Reconstroi a chave publica a partir da chave privada PEM - o mesmo par.
function pubFromCred(pem: string) {
  return createPublicKey(createPrivateKey(pem));
}

// Extrai (x, y) crus de uma chave COSE EC2/P-256 codificada por nos. Layout
// fixo: ... 0x21 0x58 0x20 <32B x> 0x22 0x58 0x20 <32B y>.
function coordsFromCose(cose: Buffer): { x: Buffer; y: Buffer } {
  const xi = cose.indexOf(Buffer.from([0x21, 0x58, 0x20]));
  const yi = cose.indexOf(Buffer.from([0x22, 0x58, 0x20]));
  return { x: cose.subarray(xi + 3, xi + 35), y: cose.subarray(yi + 3, yi + 35) };
}

describe("base64url", () => {
  test("round-trip aceita base64 e base64url", () => {
    const raw = Buffer.from([0xfb, 0xff, 0x00, 0x3e, 0x3f]);
    const url = b64url(raw); // usa - e _ , sem padding
    expect(url).not.toContain("+");
    expect(url).not.toContain("/");
    expect(url).not.toContain("=");
    expect(fromB64any(url).equals(raw)).toBe(true);
    expect(fromB64any(raw.toString("base64")).equals(raw)).toBe(true);
  });
});

describe("chave COSE", () => {
  test("recusa coordenadas que nao tenham 32 bytes", () => {
    expect(() => encodeCoseKey(Buffer.alloc(31), Buffer.alloc(32))).toThrow();
  });

  test("as coordenadas COSE sao as da chave gerada", () => {
    const cred = generateCredential();
    const { x, y } = coordsFromCose(cred.publicKeyCose);
    const jwk = pubFromCred(cred.privateKeyPem).export({ format: "jwk" }) as { x: string; y: string };
    expect(b64url(x)).toBe(jwk.x);
    expect(b64url(y)).toBe(jwk.y);
  });
});

describe("clientDataJSON", () => {
  test("leva tipo, origem e o desafio em base64url", () => {
    const data = JSON.parse(buildClientDataJSON("webauthn.get", challenge).toString("utf8"));
    expect(data.type).toBe("webauthn.get");
    expect(data.origin).toBe(ORIGIN);
    expect(data.crossOrigin).toBe(false);
    expect(data.challenge).toBe(b64url(challenge));
  });
});

describe("registo", () => {
  test("o authenticatorData abre com SHA-256(rpId) e tem o bit AT", () => {
    const cred = generateCredential();
    const reg = createRegistration(cred, challenge);
    // O authData vive dentro do attestationObject; confirmamos que o rpIdHash
    // aparece la (o attestationObject inteiro contem-no).
    expect(reg.attestationObject.includes(rpIdHash(RP_ID))).toBe(true);
    expect(reg.credentialId.equals(cred.credentialId)).toBe(true);
    // "none" como formato de atestacao.
    expect(reg.attestationObject.includes(Buffer.from("none", "utf8"))).toBe(true);
  });
});

describe("registo - campos que a Betclic le direto", () => {
  test("publicKey (SPKI) corresponde a chave privada, e authenticatorData e o authData", () => {
    const cred = generateCredential();
    const reg = createRegistration(cred, challenge);

    // A SPKI devolvida tem de ser a chave publica do par (parseavel e igual).
    const fromSpki = createPublicKey({ key: reg.publicKeySpki, format: "der", type: "spki" });
    const fromPriv = pubFromCred(cred.privateKeyPem);
    const j1 = fromSpki.export({ format: "jwk" }) as { x: string; y: string };
    const j2 = fromPriv.export({ format: "jwk" }) as { x: string; y: string };
    expect(j1.x).toBe(j2.x);
    expect(j1.y).toBe(j2.y);

    // authenticatorData e exatamente o authData embebido no attestationObject.
    expect(reg.attestationObject.includes(reg.authenticatorData)).toBe(true);
    // ... e abre com flags 0x45 (UP|UV|AT) no offset 32.
    expect(reg.authenticatorData[32]).toBe(0x45);
  });
});

describe("assercao", () => {
  test("a assinatura verifica com a chave publica do registo", () => {
    const cred = generateCredential();
    // O servidor guarda a chave publica anunciada no registo:
    const { x, y } = coordsFromCose(cred.publicKeyCose);
    const serverPubKey = createPublicKey({
      key: { kty: "EC", crv: "P-256", x: b64url(x), y: b64url(y) },
      format: "jwk",
    });

    // ... e mais tarde recebe esta assercao:
    const a = createAssertion(cred, challenge);
    const signed = Buffer.concat([
      a.authenticatorData,
      createHash("sha256").update(a.clientDataJSON).digest(),
    ]);

    expect(verify("sha256", signed, serverPubKey, a.signature)).toBe(true);
  });

  test("uma assinatura nao serve para outro desafio", () => {
    const cred = generateCredential();
    const pub = pubFromCred(cred.privateKeyPem);
    const a = createAssertion(cred, challenge);
    const outro = Buffer.concat([
      a.authenticatorData,
      createHash("sha256").update(buildClientDataJSON("webauthn.get", Buffer.from("outro", "utf8"))).digest(),
    ]);
    expect(verify("sha256", outro, pub, a.signature)).toBe(false);
  });

  test("o authenticatorData da assercao NAO leva o bit AT (flags 0x05)", () => {
    const cred = generateCredential();
    const a = createAssertion(cred, challenge);
    // [32 rpIdHash][1 flags][4 signCount] - sem attestedCredentialData.
    expect(a.authenticatorData.length).toBe(37);
    expect(a.authenticatorData[32]).toBe(0x05); // UP | UV, sem AT
  });
});
