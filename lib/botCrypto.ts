// lib/botCrypto.ts
// Cifra o token de contexto da Betclic que um admin entrega à app para ativar o
// bot (ver routes/botRoutes.ts + db/migrations/022_bot_context_tokens.sql). O
// token é curto (~2h) e é do próprio admin, mas mesmo assim nunca fica em claro
// na BD.
//
// A chave sai de BOT_CTX_KEY se existir; senão deriva-se de JWT_SECRET (já
// definido em produção) com um rótulo de separação de domínio, para a chave de
// cifra ser distinta da de assinatura dos JWT. Assim a ativação funciona logo
// após o deploy, sem obrigar a definir uma env nova. Sem nenhum dos dois, a
// ativação simplesmente não funciona - e as rotas respondem 503, não rebentam.
//
// PROPOSITADAMENTE SEM IMPORTS além de node:crypto: este módulo é compilado
// pela Vercel junto com a rota, e já houve deploys perdidos a partilhar código
// a mais entre `src/` e o backend (ver o aviso em lib/betclicOdds.ts).

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const LABEL = "bettrackr-bot-ctx-v1"; // separação de domínio: distingue esta chave da de assinatura

// O material de chave: BOT_CTX_KEY tem prioridade; JWT_SECRET é o recurso por
// omissão (já existe em produção). Devolve null se nenhum estiver definido ou
// for curto de mais para servir de segredo.
export function activationKeyMaterial(): string | null {
  const explicit = process.env.BOT_CTX_KEY;
  if (explicit && explicit.length >= 16) return explicit;
  const jwt = process.env.JWT_SECRET;
  if (jwt && jwt.length >= 16) return jwt;
  return null;
}

// O servidor consegue cifrar/decifrar? (as rotas usam isto para dar 503 cedo.)
export function activationConfigured(): boolean {
  return activationKeyMaterial() !== null;
}

// scrypt é caro de propósito. O rótulo entra na passphrase -> a chave derivada é
// distinta de qualquer outro uso do mesmo segredo.
function deriveKey(material: string, salt: Buffer): Buffer {
  return scryptSync(`${material}::${LABEL}`, salt, 32);
}

// Devolve um blob auto-contido "salt.iv.tag.ciphertext" (cada parte em base64),
// guardável num único TEXT. O sal é por-registo, por isso o mesmo token cifra
// para blobs diferentes.
export function encryptToken(plaintext: string): string {
  const material = activationKeyMaterial();
  if (!material) throw new Error("BOT_CTX_KEY/JWT_SECRET em falta");
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = deriveKey(material, salt);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [salt, iv, tag, ct].map((b) => b.toString("base64")).join(".");
}

// Inverte encryptToken. Atira se o blob estiver corrompido, se a chave tiver
// mudado (a autenticação GCM falha) ou se o formato não bater.
export function decryptToken(blob: string): string {
  const material = activationKeyMaterial();
  if (!material) throw new Error("BOT_CTX_KEY/JWT_SECRET em falta");
  const parts = blob.split(".");
  if (parts.length !== 4) throw new Error("blob de token inválido");
  const [salt, iv, tag, ct] = parts.map((p) => Buffer.from(p, "base64"));
  const key = deriveKey(material, salt);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}
