// bettrackr.ts - o lado do BetTrackr: ler o que ja la esta (para deduplicar) e
// enviar as apostas novas. Usa a API que ja existe (README do projeto):
//   GET  /api/bets        -> lista as apostas do utilizador autenticado
//   POST /api/bets/bulk   -> importa varias (max 1000), transacional
// Autentica com o JWT do BetTrackr do dono da conta (Authorization: Bearer).

export interface BettrackrConfig {
  base: string; // ex.: https://betrackr.vercel.app  ou  http://localhost:3000
  token: string; // JWT do BetTrackr da conta onde importar
}

function extractImportKey(bet: any): string | null {
  const meta =
    typeof bet.metadata === "string"
      ? (() => {
          try {
            return JSON.parse(bet.metadata);
          } catch {
            return {};
          }
        })()
      : bet.metadata || {};
  if (meta.importKey) return String(meta.importKey);
  if (meta.source && meta.ref) return `${meta.source}:${meta.ref}`;
  if (meta.ref) return `betclic:${meta.ref}`; // apostas antigas (so Betclic)
  return null;
}

// Conjunto de importKeys ja no BetTrackr - a base da deduplicacao do lado do
// cliente (o mesmo que a extensao faz, ate a migracao 020 por o indice unico).
export async function knownImportKeys(cfg: BettrackrConfig): Promise<Set<string>> {
  const res = await fetch(`${cfg.base}/api/bets`, {
    headers: { Authorization: `Bearer ${cfg.token}` },
  });
  if (res.status === 401) throw new Error("Sessao BetTrackr expirada (401). Renova o token.");
  if (!res.ok) throw new Error(`BetTrackr respondeu ${res.status} ao listar apostas.`);
  const data: any = await res.json().catch(() => ({}));
  const keys = new Set<string>();
  for (const bet of data.bets || []) {
    const k = extractImportKey(bet);
    if (k) keys.add(k);
  }
  return keys;
}

export interface PushResult {
  enviadas: number;
  status: number;
  ok: boolean;
  body: string;
}

// Envia um lote (max 1000). O corpo e { bets: Bet[] } em camelCase, tal como a
// extensao envia. NAO mexe em closingOdd: as apostas mapeadas nao a trazem, por
// isso a odd de fecho apanhada pelo cron do CLV fica intacta.
export async function pushBets(cfg: BettrackrConfig, bets: any[]): Promise<PushResult> {
  const res = await fetch(`${cfg.base}/api/bets/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.token}` },
    body: JSON.stringify({ bets }),
  });
  const body = await res.text();
  return { enviadas: bets.length, status: res.status, ok: res.ok, body };
}

// Heartbeat: reporta uma passagem ao painel de admin (POST /api/bot/heartbeat).
// Best-effort - se falhar, nao faz a passagem falhar (a telemetria nao e critica).
export interface HeartbeatPayload {
  ok: boolean;
  startedAt: string; // ISO
  durationMs?: number;
  read?: number;
  imported?: number;
  error?: string;
}

export async function heartbeat(cfg: BettrackrConfig, payload: HeartbeatPayload): Promise<void> {
  try {
    await fetch(`${cfg.base}/api/bot/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.token}` },
      body: JSON.stringify(payload),
    });
  } catch {
    // silencioso de proposito
  }
}
