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

// O que ja esta no BetTrackr, por importKey: o id (para o PUT) e o status atual
// (para saber se a aposta mudou de estado - ex.: pendente -> liquidada). E a
// base da reconciliacao: novo => inserir, conhecido com status diferente =>
// atualizar. (Substitui o antigo knownImportKeys, que so trazia o conjunto.)
export interface KnownBet {
  id: string;
  status: string;
}

export async function knownBets(cfg: BettrackrConfig): Promise<Map<string, KnownBet>> {
  const res = await fetch(`${cfg.base}/api/bets`, {
    headers: { Authorization: `Bearer ${cfg.token}` },
  });
  if (res.status === 401) throw new Error("Sessao BetTrackr expirada (401). Renova o token.");
  if (!res.ok) throw new Error(`BetTrackr respondeu ${res.status} ao listar apostas.`);
  const data: any = await res.json().catch(() => ({}));
  const map = new Map<string, KnownBet>();
  for (const bet of data.bets || []) {
    const k = extractImportKey(bet);
    if (k) map.set(k, { id: String(bet.id), status: String(bet.status) });
  }
  return map;
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

// Atualiza uma aposta existente (PUT /api/bets/:id) - usado quando uma aposta
// muda de estado (pendente -> liquidada). O corpo e a aposta mapeada, que NAO
// traz closingOdd; por isso o servidor cai no ramo de preservacao e a odd de
// fecho do CLV fica intacta (ver ownsClosingOdds em routes/betsRoutes.ts).
export async function updateBet(cfg: BettrackrConfig, id: string, bet: any): Promise<PushResult> {
  const res = await fetch(`${cfg.base}/api/bets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.token}` },
    body: JSON.stringify(bet),
  });
  const body = await res.text();
  return { enviadas: 1, status: res.status, ok: res.ok, body };
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

// Pede ao BetTrackr um token do BetTrackr fresco (GET /api/bot/token), para o
// bot se auto-renovar e nao depender de um BETTRACKR_TOKEN atualizado a mao. O
// pedido usa o token atual (que tem de estar valido). Devolve null se falhar -
// o chamador fica com o token que ja tinha.
export async function fetchFreshToken(cfg: BettrackrConfig): Promise<string | null> {
  try {
    const res = await fetch(`${cfg.base}/api/bot/token`, {
      headers: { Authorization: `Bearer ${cfg.token}` },
    });
    if (!res.ok) return null;
    const data: any = await res.json().catch(() => ({}));
    return typeof data.token === "string" && data.token ? data.token : null;
  } catch {
    return null;
  }
}

// Apaga a ativacao guardada no BetTrackr (DELETE /api/bot/context-token). Usado
// depois de um re-enrolment automatico para consumir o token e nao repetir o
// registo em ciclo. Best-effort - se falhar, nao e critico.
export async function deleteContextToken(cfg: BettrackrConfig): Promise<void> {
  try {
    await fetch(`${cfg.base}/api/bot/context-token`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${cfg.token}` },
    });
  } catch {
    // silencioso de proposito
  }
}

// Vai buscar ao BetTrackr o token de contexto que o admin ativou na app (painel
// /bot -> GET /api/bot/context-token). E o que dispensa o BETCLIC_CONTEXT_TOKEN
// a mao: no arranque frio, o bot puxa daqui em vez de exigir a env. Devolve null
// se nao houver (404), se expirou (410) ou se a rede falhar - o arranque decide.
export async function fetchContextToken(cfg: BettrackrConfig): Promise<string | null> {
  try {
    const res = await fetch(`${cfg.base}/api/bot/context-token`, {
      headers: { Authorization: `Bearer ${cfg.token}` },
    });
    if (!res.ok) return null;
    const data: any = await res.json().catch(() => ({}));
    return typeof data.token === "string" && data.token ? data.token : null;
  } catch {
    return null;
  }
}
