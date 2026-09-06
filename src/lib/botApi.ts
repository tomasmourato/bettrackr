// src/lib/botApi.ts
// Cliente da rota /api/bot (estado do bot local da Betclic). Reservada a
// administradores no servidor (requireAdmin) - nada aqui dá permissões, só
// apresenta o que o servidor devolve. Ver routes/botRoutes.ts.

import { authFetch, parseJsonResponse } from "./authApi";

export interface BotRun {
  id: string;
  started_at: string;
  duration_ms: number | null;
  ok: boolean;
  read_count: number;
  imported: number;
  error: string | null;
  created_at: string;
}

export type BotActivationSource = "manual" | "extension";

export interface BotActivation {
  configured: boolean; // o servidor sabe cifrar (BOT_CTX_KEY/JWT_SECRET presente)?
  active: boolean; // há token guardado e ainda válido
  expired: boolean; // há token guardado mas já expirou
  expiresAt: string | null;
  source: BotActivationSource | null;
  updatedAt: string | null;
}

export interface BotStatus {
  runs: BotRun[];
  lastSuccess: { started_at: string; imported: number } | null;
  importedTotal30d: number;
  failures30d: number;
  activation: BotActivation;
}

export async function fetchBotStatus(): Promise<BotStatus> {
  const res = await authFetch("/api/bot/status");
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data as BotStatus;
}

// Ativa o bot: entrega o token de contexto da Betclic ao servidor (cifrado lá).
export async function activateBot(
  token: string,
  source: BotActivationSource,
): Promise<{ expiresAt: string; source: BotActivationSource }> {
  const res = await authFetch("/api/bot/context-token", {
    method: "POST",
    body: JSON.stringify({ token, source }),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data as { expiresAt: string; source: BotActivationSource };
}

// Desativa: apaga o token guardado.
export async function deactivateBot(): Promise<void> {
  const res = await authFetch("/api/bot/context-token", { method: "DELETE" });
  if (!res.ok) {
    const data = await parseJsonResponse(res);
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
}
