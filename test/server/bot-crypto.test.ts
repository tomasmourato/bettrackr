import { afterAll, describe, expect, test } from "bun:test";
import {
  activationConfigured,
  activationKeyMaterial,
  decryptToken,
  encryptToken,
} from "../../lib/botCrypto";

// botCrypto lê o segredo de process.env a cada chamada. Guardamos o ambiente
// original e repomo-lo no fim para não contaminar os outros testes de servidor.
const ORIG = { BOT_CTX_KEY: process.env.BOT_CTX_KEY, JWT_SECRET: process.env.JWT_SECRET };
afterAll(() => {
  if (ORIG.BOT_CTX_KEY === undefined) delete process.env.BOT_CTX_KEY;
  else process.env.BOT_CTX_KEY = ORIG.BOT_CTX_KEY;
  if (ORIG.JWT_SECRET === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = ORIG.JWT_SECRET;
});

const KEY = "test-bot-ctx-key-0123456789abcdef"; // >= 16 chars

describe("botCrypto", () => {
  test("ida-e-volta: decryptToken(encryptToken(x)) === x", () => {
    process.env.BOT_CTX_KEY = KEY;
    const token = "eyJhbGciOiJSUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.sig";
    expect(decryptToken(encryptToken(token))).toBe(token);
  });

  test("o mesmo texto cifra para blobs diferentes (sal por-registo)", () => {
    process.env.BOT_CTX_KEY = KEY;
    const a = encryptToken("abc");
    const b = encryptToken("abc");
    expect(a).not.toBe(b);
    expect(decryptToken(a)).toBe("abc");
    expect(decryptToken(b)).toBe("abc");
  });

  test("adulteração do ciphertext é detetada (autenticação GCM)", () => {
    process.env.BOT_CTX_KEY = KEY;
    const parts = encryptToken("segredo").split(".");
    const ct = Buffer.from(parts[3], "base64");
    ct[ct.length - 1] ^= 0x01; // vira um bit
    parts[3] = ct.toString("base64");
    expect(() => decryptToken(parts.join("."))).toThrow();
  });

  test("uma chave diferente não decifra", () => {
    process.env.BOT_CTX_KEY = KEY;
    const blob = encryptToken("segredo");
    process.env.BOT_CTX_KEY = "outra-chave-totalmente-diferente-xyz";
    expect(() => decryptToken(blob)).toThrow();
  });

  test("formato inválido atira", () => {
    process.env.BOT_CTX_KEY = KEY;
    expect(() => decryptToken("nao.e.um.blob.valido")).toThrow();
    expect(() => decryptToken("semseparadores")).toThrow();
  });

  test("BOT_CTX_KEY tem prioridade sobre JWT_SECRET", () => {
    process.env.JWT_SECRET = "jwt-secret-suficientemente-longo-123";
    process.env.BOT_CTX_KEY = KEY;
    expect(activationKeyMaterial()).toBe(KEY);
    expect(activationConfigured()).toBe(true);
  });

  test("sem BOT_CTX_KEY, cai no JWT_SECRET", () => {
    delete process.env.BOT_CTX_KEY;
    process.env.JWT_SECRET = "jwt-secret-suficientemente-longo-123";
    expect(activationKeyMaterial()).toBe("jwt-secret-suficientemente-longo-123");
    expect(activationConfigured()).toBe(true);
  });

  test("sem nenhum segredo, não configurado", () => {
    delete process.env.BOT_CTX_KEY;
    delete process.env.JWT_SECRET;
    expect(activationConfigured()).toBe(false);
    expect(activationKeyMaterial()).toBeNull();
  });

  test("segredos curtos (< 16) são rejeitados", () => {
    process.env.BOT_CTX_KEY = "curto";
    delete process.env.JWT_SECRET;
    expect(activationConfigured()).toBe(false);
  });
});
