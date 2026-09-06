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

export interface BotStatus {
  runs: BotRun[];
  lastSuccess: { started_at: string; imported: number } | null;
  importedTotal30d: number;
  failures30d: number;
}

export async function fetchBotStatus(): Promise<BotStatus> {
  const res = await authFetch("/api/bot/status");
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data as BotStatus;
}
