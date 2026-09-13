// lib/push.ts
// Notificações push para a app Android, pelo Firebase Cloud Messaging (API HTTP
// v1). Sem o SDK firebase-admin: são dois pedidos HTTP e um JWT assinado com a
// conta de serviço, e o jsonwebtoken já é dependência do servidor.
//
// Configuração: FCM_SERVICE_ACCOUNT com o JSON da conta de serviço do projeto
// Firebase (Definições do projeto -> Contas de serviço -> Gerar nova chave
// privada), tal e qual ou em base64. Sem ela pushConfigured() é false e nada
// rebenta: as notificações continuam a aparecer na página, só não há push.

import jwt from "jsonwebtoken";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
const TIMEOUT_MS = 10_000;

/**
 * O canal Android dos alertas. Tem de ser o MESMO id que a app cria em
 * src/lib/push.ts - um canal que o telemóvel não conhece cai no canal genérico
 * do Firebase, sem nome nem importância.
 */
export const PUSH_CHANNEL_ID = "bot_alerts";

export interface ServiceAccount {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

/** Lê a conta de serviço, em JSON ou em base64. null se não servir. */
export function parseServiceAccount(raw: string | undefined): ServiceAccount | null {
  const text = (raw ?? "").trim();
  if (!text) return null;

  const json = text.startsWith("{") ? text : Buffer.from(text, "base64").toString("utf8");
  try {
    const data = JSON.parse(json);
    if (
      typeof data?.project_id !== "string" ||
      typeof data?.client_email !== "string" ||
      typeof data?.private_key !== "string"
    ) {
      return null;
    }
    return {
      projectId: data.project_id,
      clientEmail: data.client_email,
      // Colada num campo de uma linha, a chave chega com os \n como texto.
      privateKey: data.private_key.replace(/\\n/g, "\n"),
    };
  } catch {
    return null;
  }
}

function serviceAccount(): ServiceAccount | null {
  return parseServiceAccount(process.env.FCM_SERVICE_ACCOUNT);
}

export function pushConfigured(): boolean {
  return serviceAccount() !== null;
}

// O token de acesso dura uma hora; numa função quente da Vercel reaproveita-se.
let cachedAccess: { token: string; expiresAt: number; clientEmail: string } | null = null;

async function accessToken(account: ServiceAccount): Promise<string> {
  if (
    cachedAccess &&
    cachedAccess.clientEmail === account.clientEmail &&
    cachedAccess.expiresAt - 60_000 > Date.now()
  ) {
    return cachedAccess.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    { iss: account.clientEmail, scope: FCM_SCOPE, aud: GOOGLE_TOKEN_URL, iat: now, exp: now + 3600 },
    account.privateKey,
    { algorithm: "RS256" },
  );

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || typeof data?.access_token !== "string") {
    throw new Error(`Google OAuth respondeu ${res.status}: ${data?.error_description || data?.error || "sem token"}`);
  }

  cachedAccess = {
    token: data.access_token,
    expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000,
    clientEmail: account.clientEmail,
  };
  return cachedAccess.token;
}

export interface PushMessage {
  title: string;
  body: string;
  /** O FCM só aceita strings aqui. A app lê-o ao tocar na notificação. */
  data?: Record<string, string>;
}

/** O corpo do messages:send para UM dispositivo. */
export function buildFcmMessage(token: string, message: PushMessage) {
  return {
    message: {
      token,
      notification: { title: message.title, body: message.body },
      data: message.data ?? {},
      android: {
        priority: "HIGH",
        notification: { channel_id: PUSH_CHANNEL_ID },
      },
    },
  };
}

/**
 * O FCM diz que este token já não serve? (app desinstalada, dados apagados,
 * token renovado.) Esses apagam-se; um erro nosso no pedido não apaga nada.
 */
export function isDeadToken(status: number, body: any): boolean {
  if (status === 404) return true;
  const details: any[] = Array.isArray(body?.error?.details) ? body.error.details : [];
  if (details.some((detail) => detail?.errorCode === "UNREGISTERED")) return true;
  return status === 400 && /registration token/i.test(String(body?.error?.message ?? ""));
}

export interface PushResult {
  sent: number;
  failed: number;
  /** Tokens que o FCM deu como mortos - quem chamou deve apagá-los. */
  dead: string[];
}

/** Manda a mesma notificação a vários dispositivos. Um que falhe não trava os outros. */
export async function sendPush(tokens: string[], message: PushMessage): Promise<PushResult> {
  const result: PushResult = { sent: 0, failed: 0, dead: [] };
  const account = serviceAccount();
  if (!account || tokens.length === 0) return result;

  const bearer = await accessToken(account);
  const url = `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(account.projectId)}/messages:send`;

  for (const token of tokens) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearer}` },
        body: JSON.stringify(buildFcmMessage(token, message)),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.ok) {
        result.sent++;
        continue;
      }
      const body = await res.json().catch(() => ({}));
      if (isDeadToken(res.status, body)) {
        result.dead.push(token);
      } else {
        result.failed++;
        console.warn(`[push] FCM respondeu ${res.status}:`, body?.error?.message);
      }
    } catch (error: any) {
      result.failed++;
      console.warn("[push] envio falhou:", error?.message);
    }
  }
  return result;
}
