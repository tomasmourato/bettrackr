// vault.ts - o cofre da chave privada da passkey.
//
// A chave privada P-256 e o unico segredo do bot: quem a tiver entra na conta
// Betclic. Por isso nunca fica em claro no disco. Aqui cifra-se com AES-256-GCM
// sob uma chave-mestra que vive FORA do cofre - numa variavel de ambiente
// (BETCLIC_BOT_KEY), lida no arranque. Uma copia do ficheiro cifrado sem a
// variavel de ambiente nao vale nada.
//
// GCM traz autenticacao: se o ficheiro for adulterado, o decifrar rebenta em
// vez de devolver lixo. Cada gravacao usa um IV novo (nonce de 12 bytes), como
// manda o modo.
//
// O que se guarda e um SoftCredential (a chave privada PEM + o credentialId +
// a chave publica COSE) mais o userHandle que a Betclic atribuiu no registo -
// tudo o que o login por passkey precisa, e nada do lado da Betclic.

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, chmodSync } from "node:fs";
import { SoftCredential, b64url, fromB64any } from "./softAuthenticator.js";

// Formato do ficheiro cifrado: tudo em base64url, IV + tag a parte para o GCM.
interface VaultFile {
  v: 1;
  salt: string; // sal do scrypt (deriva a chave AES da passphrase)
  iv: string; // nonce de 12 bytes
  tag: string; // tag de autenticacao GCM (16 bytes)
  data: string; // ciphertext
}

// O conteudo em claro, antes de cifrar / depois de decifrar.
export interface VaultContents {
  credentialId: string; // base64url
  privateKeyPem: string;
  publicKeyCose: string; // base64url
  userHandle: string; // base64url
}

const ENV_KEY = "BETCLIC_BOT_KEY";

// Deriva a chave AES-256 (32 bytes) da passphrase do ambiente, com scrypt e um
// sal por ficheiro. scrypt e caro de propósito: mesmo que a passphrase seja
// fraca, um ataque de forca bruta ao ficheiro fica lento.
function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return scryptSync(passphrase, salt, 32);
}

function readPassphrase(): string {
  const p = process.env[ENV_KEY];
  if (!p || p.length < 16) {
    throw new Error(
      `${ENV_KEY} em falta ou curta de mais. Gera uma:\n` +
        `  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"\n` +
        `e poe-na no ambiente (ex.: no ficheiro do systemd), nunca no repositorio.`,
    );
  }
  return p;
}

// Cifra genericos (AES-256-GCM + scrypt), reutilizados pelo cofre da credencial
// e pela sessao. Cada gravacao usa sal e IV novos.
function encryptToFile(path: string, obj: unknown): void {
  const passphrase = readPassphrase();
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = deriveKey(passphrase, salt);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(obj), "utf8");
  const data = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const file: VaultFile = {
    v: 1,
    salt: b64url(salt),
    iv: b64url(iv),
    tag: b64url(cipher.getAuthTag()),
    data: b64url(data),
  };
  writeFileSync(path, JSON.stringify(file), { encoding: "utf8" });
  try {
    chmodSync(path, 0o600); // so-leitura-do-dono quando o SO deixa
  } catch {
    // Windows nao tem modos POSIX; segue sem falhar.
  }
}

function decryptFromFile(path: string): unknown {
  const passphrase = readPassphrase();
  const file: VaultFile = JSON.parse(readFileSync(path, "utf8"));
  if (file.v !== 1) throw new Error(`versao de cofre desconhecida: ${file.v}`);
  const key = deriveKey(passphrase, fromB64any(file.salt));
  const decipher = createDecipheriv("aes-256-gcm", key, fromB64any(file.iv));
  decipher.setAuthTag(fromB64any(file.tag));
  try {
    const out = Buffer.concat([decipher.update(fromB64any(file.data)), decipher.final()]);
    return JSON.parse(out.toString("utf8"));
  } catch {
    throw new Error("nao foi possivel decifrar: passphrase errada ou ficheiro adulterado.");
  }
}

// Cifra e grava a credencial da passkey.
export function saveVault(path: string, contents: VaultContents): void {
  encryptToFile(path, contents);
}

// Le e decifra a credencial. Rebenta se adulterado (GCM) ou passphrase errada.
export function loadVault(path: string): VaultContents {
  if (!existsSync(path)) throw new Error(`cofre nao encontrado: ${path}`);
  return decryptFromFile(path) as VaultContents;
}

// ------------------------------------------------------------
// Sessao: o access_token (~2h) e o refresh_token que o login por passkey
// devolve. Persistir CIFRADO permite ao bot arrancar sozinho apos um reinicio
// (deploy, crash, reboot) sem pedir um token a mao - desde que o access ainda
// seja valido. Fica num ficheiro a parte da credencial.
// ------------------------------------------------------------
export interface SessionState {
  accessToken: string;
  refreshToken: string | null;
  savedAt: string; // ISO
}

export function saveSession(path: string, state: SessionState): void {
  encryptToFile(path, state);
}

export function loadSession(path: string): SessionState | null {
  if (!existsSync(path)) return null;
  try {
    return decryptFromFile(path) as SessionState;
  } catch {
    // Sessao ilegivel (passphrase mudou, ficheiro corrompido) - trata como
    // "sem sessao"; o bot volta ao bootstrap manual em vez de rebentar.
    return null;
  }
}

// Ponte entre o cofre e o autenticador: converte de/para SoftCredential.
export function credentialToVault(cred: SoftCredential, userHandle: Buffer): VaultContents {
  return {
    credentialId: b64url(cred.credentialId),
    privateKeyPem: cred.privateKeyPem,
    publicKeyCose: b64url(cred.publicKeyCose),
    userHandle: b64url(userHandle),
  };
}

export function vaultToCredential(v: VaultContents): { cred: SoftCredential; userHandle: Buffer } {
  return {
    cred: {
      credentialId: fromB64any(v.credentialId),
      privateKeyPem: v.privateKeyPem,
      publicKeyCose: fromB64any(v.publicKeyCose),
    },
    userHandle: fromB64any(v.userHandle),
  };
}
