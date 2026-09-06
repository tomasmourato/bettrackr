import { describe, expect, test, beforeEach, afterAll } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  saveVault,
  loadVault,
  credentialToVault,
  vaultToCredential,
  saveSession,
  loadSession,
} from "../src/vault.js";
import { generateCredential } from "../src/softAuthenticator.js";

// O cofre tem de: cifrar em repouso (nada de PEM em claro no ficheiro),
// devolver exatamente o que entrou, e RECUSAR-SE a decifrar se a passphrase
// mudar ou o ficheiro for adulterado.

const dir = mkdtempSync(join(tmpdir(), "vault-"));
const file = join(dir, "passkey.enc");
const KEY = "BETCLIC_BOT_KEY";
const GOOD = "0123456789abcdef0123456789abcdef";

beforeEach(() => {
  process.env[KEY] = GOOD;
});
afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

function sampleContents() {
  const cred = generateCredential();
  return credentialToVault(cred, Buffer.from("um-user-handle-de-36-bytes-............", "utf8"));
}

describe("vault", () => {
  test("round-trip: o que se guarda e o que se le", () => {
    const contents = sampleContents();
    saveVault(file, contents);
    const back = loadVault(file);
    expect(back).toEqual(contents);
  });

  test("o PEM nao aparece em claro no ficheiro cifrado", () => {
    const contents = sampleContents();
    saveVault(file, contents);
    const raw = readFileSync(file, "utf8");
    expect(raw).not.toContain("BEGIN PRIVATE KEY");
    expect(raw).not.toContain(contents.privateKeyPem.slice(20, 60));
  });

  test("passphrase errada nao decifra", () => {
    saveVault(file, sampleContents());
    process.env[KEY] = "chave-completamente-diferente-mas-longa";
    expect(() => loadVault(file)).toThrow();
  });

  test("ficheiro adulterado nao decifra (GCM deteta)", () => {
    saveVault(file, sampleContents());
    const f = JSON.parse(readFileSync(file, "utf8"));
    const data = Buffer.from(f.data.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    data[0] ^= 0xff; // vira um bit
    f.data = data.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    writeFileSync(file, JSON.stringify(f));
    expect(() => loadVault(file)).toThrow();
  });

  test("recusa passphrase curta ou ausente", () => {
    saveVault(file, sampleContents());
    process.env[KEY] = "curta";
    expect(() => loadVault(file)).toThrow(/curta/);
    delete process.env[KEY];
    expect(() => loadVault(file)).toThrow();
  });

  test("credentialToVault <-> vaultToCredential preserva a credencial", () => {
    const cred = generateCredential();
    const handle = Buffer.from("outro-handle-qualquer", "utf8");
    const { cred: back, userHandle } = vaultToCredential(credentialToVault(cred, handle));
    expect(back.credentialId.equals(cred.credentialId)).toBe(true);
    expect(back.privateKeyPem).toBe(cred.privateKeyPem);
    expect(back.publicKeyCose.equals(cred.publicKeyCose)).toBe(true);
    expect(userHandle.equals(handle)).toBe(true);
  });
});

describe("sessao", () => {
  const sfile = join(dir, "session.enc");
  test("round-trip do access/refresh token", () => {
    const state = { accessToken: "aaa.bbb.ccc", refreshToken: "rrr", savedAt: new Date().toISOString() };
    saveSession(sfile, state);
    expect(loadSession(sfile)).toEqual(state);
  });

  test("os tokens nao aparecem em claro no ficheiro", () => {
    saveSession(sfile, { accessToken: "SECRET-ACCESS", refreshToken: "SECRET-REFRESH", savedAt: "x" });
    const raw = readFileSync(sfile, "utf8");
    expect(raw).not.toContain("SECRET-ACCESS");
    expect(raw).not.toContain("SECRET-REFRESH");
  });

  test("sem ficheiro devolve null (arranca em bootstrap)", () => {
    expect(loadSession(join(dir, "nao-existe.enc"))).toBe(null);
  });

  test("passphrase errada devolve null, nao rebenta", () => {
    saveSession(sfile, { accessToken: "a", refreshToken: null, savedAt: "x" });
    process.env[KEY] = "uma-passphrase-completamente-diferente";
    expect(loadSession(sfile)).toBe(null);
  });
});
