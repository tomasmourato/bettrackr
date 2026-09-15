// src/lib/botApi.ts
// Cliente da rota /api/bot (estado do bot local da Betclic). Reservada a
// administradores no servidor (requireAdmin) - nada aqui dá permissões, só
// apresenta o que o servidor devolve. Ver routes/botRoutes.ts.

import { apiError } from "./apiError";
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

// Estado de ativação de UMA conta Betclic (ver migração 024). Uma por
// bookie_account do dono; o painel mostra uma linha por conta.
export interface BotAccountActivation {
  accountId: string;
  label: string; // nome da bookie_account (ex.: "Betclic - pessoal")
  username: string | null; // username Betclic da conta, se estiver preenchido
  active: boolean; // há token guardado e ainda válido
  expired: boolean; // há token guardado mas já expirou
  expiresAt: string | null;
  source: BotActivationSource | null;
  updatedAt: string | null;
}

// Uma passagem do agente de CLV (agent/clv-agent.ts, migração 026). Ao contrário
// do BotRun não é de ninguém: há um agente para o serviço todo. "capture" é a
// odd de fecho (de 5 em 5 minutos), "daily" as odds do dia (de madrugada), e as
// contagens querem dizer coisas diferentes em cada uma.
export interface ClvAgentRun {
  id: string;
  kind: "capture" | "daily";
  started_at: string;
  duration_ms: number | null;
  ok: boolean;
  candidates: number | null; // apostas por liquidar que o servidor considerou (só "capture")
  matches: number; // jogos a ler / jogos encontrados nas listagens
  read_count: number; // páginas lidas com preços / jogos com mercado completo
  written: number; // apostas escritas / jogos gravados
  failures: string | null; // "matchId:motivo | ..." quando alguma leitura falhou
  error: string | null;
  created_at: string;
}

export interface BotStatus {
  runs: BotRun[];
  lastSuccess: { started_at: string; imported: number } | null;
  importedTotal30d: number;
  failures30d: number;
  configured: boolean; // o servidor sabe cifrar (BOT_CTX_KEY/JWT_SECRET presente)?
  activations: BotAccountActivation[];
  // Só para staff (null para o botuser). missingTable: falta aplicar a migração 026.
  clvAgent: { runs: ClvAgentRun[]; missingTable: boolean } | null;
}

export async function fetchBotStatus(): Promise<BotStatus> {
  const res = await authFetch("/api/bot/status");
  const data = await parseJsonResponse(res);
  if (!res.ok) throw apiError(data, res, "bot.loadError");
  return data as BotStatus;
}

// Ativa o bot para UMA conta: entrega o token de contexto da Betclic ao servidor
// (cifrado lá), associado à bookie_account escolhida.
export async function activateBot(
  token: string,
  source: BotActivationSource,
  accountId: string,
): Promise<{ accountId: string; expiresAt: string; source: BotActivationSource }> {
  const res = await authFetch("/api/bot/context-token", {
    method: "POST",
    body: JSON.stringify({ token, source, accountId }),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw apiError(data, res, "bot.act.errGeneric");
  return data as { accountId: string; expiresAt: string; source: BotActivationSource };
}

// Desativa UMA conta: apaga o token guardado dessa conta.
export async function deactivateBot(accountId: string): Promise<void> {
  const res = await authFetch(`/api/bot/context-token?accountId=${encodeURIComponent(accountId)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await parseJsonResponse(res);
    throw apiError(data, res, "bot.act.errGeneric");
  }
}
