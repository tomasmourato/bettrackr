// routes/botRoutes.ts
// Estado e ativação do bot local da Betclic (bot/). Todas as rotas reservadas a
// administradores (a feature é privada; ver db/migrations/021_bot_runs.sql):
//
//   POST   /api/bot/heartbeat       -> o bot reporta uma passagem
//   GET    /api/bot/status          -> o painel lê as passagens + estado de ativação
//   POST   /api/bot/context-token   -> o admin ativa: entrega um token de contexto (cifrado)
//   GET    /api/bot/context-token   -> o bot no telemóvel puxa o token no arranque frio
//   DELETE /api/bot/context-token   -> o admin desativa
//
// A identidade vem sempre do JWT (req.user.id), nunca do corpo: cada admin só
// vê e escreve o seu próprio estado. O único segredo que aqui passa é o token de
// contexto da Betclic (curto, do próprio admin) - e esse é guardado CIFRADO
// (lib/botCrypto.ts), nunca em claro. A chave da passkey nunca toca no servidor.

import { Router } from "express";
import pool from "../db/pool.js";
import { authenticateToken, AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/accessMiddleware.js";
import { activationConfigured, encryptToken, decryptToken } from "../lib/botCrypto.js";

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

const RUN_COLUMNS = `
  id, started_at, duration_ms, ok, read_count, imported, error, created_at
`;

// Coage um valor a inteiro >= 0 (o corpo vem do bot, mas validamos na mesma).
function toCount(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

// Lê o exp (ms) de um JWT SEM o verificar - só para não guardar/servir tokens já
// mortos. Não temos (nem precisamos) a chave pública da Betclic: quem valida o
// token a sério é o próprio login por passkey ao usá-lo.
function decodeJwtExpMs(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isExpired(expiresAt: string | Date | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

// ------------------------------------------------------------
// POST /heartbeat - o bot reporta o resultado de uma passagem.
// Corpo: { ok, startedAt, durationMs?, read?, imported?, error? }
// ------------------------------------------------------------
router.post("/heartbeat", async (req: AuthenticatedRequest, res) => {
  const b = req.body ?? {};
  if (typeof b.ok !== "boolean") {
    res.status(400).json({ error: "Campo 'ok' (boolean) obrigatório." });
    return;
  }
  const started = b.startedAt ? new Date(b.startedAt) : new Date();
  if (Number.isNaN(started.getTime())) {
    res.status(400).json({ error: "startedAt inválido." });
    return;
  }
  const durationMs = b.durationMs === undefined || b.durationMs === null ? null : toCount(b.durationMs);
  const error = b.ok ? null : typeof b.error === "string" ? b.error.slice(0, 1000) : null;

  try {
    // Grava a passagem e, na mesma ida à BD, poda as antigas (> 30 dias) para
    // a tabela não crescer sem fim - é telemetria, não histórico eterno.
    const result = await pool.query(
      `INSERT INTO bot_runs (user_id, started_at, duration_ms, ok, read_count, imported, error)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${RUN_COLUMNS}`,
      [req.user!.id, started.toISOString(), durationMs, b.ok, toCount(b.read), toCount(b.imported), error],
    );
    await pool.query(
      "DELETE FROM bot_runs WHERE user_id = $1 AND started_at < NOW() - INTERVAL '30 days'",
      [req.user!.id],
    );
    res.status(201).json({ success: true, run: result.rows[0] });
  } catch (err) {
    console.error("Erro ao gravar heartbeat do bot:", err);
    res.status(500).json({ error: "Erro ao gravar o estado do bot." });
  }
});

// ------------------------------------------------------------
// GET /status - as passagens recentes + um resumo para o painel.
// ------------------------------------------------------------
router.get("/status", async (req: AuthenticatedRequest, res) => {
  try {
    const runs = await pool.query(
      `SELECT ${RUN_COLUMNS} FROM bot_runs WHERE user_id = $1 ORDER BY started_at DESC LIMIT 20`,
      [req.user!.id],
    );
    // Última passagem bem-sucedida (para o painel dizer "última importação há X").
    const lastOk = await pool.query(
      `SELECT started_at, imported
         FROM bot_runs WHERE user_id = $1 AND ok = true ORDER BY started_at DESC LIMIT 1`,
      [req.user!.id],
    );
    const totals = await pool.query(
      `SELECT COALESCE(SUM(imported), 0)::int AS imported_total,
              COUNT(*) FILTER (WHERE ok = false)::int AS failures_30d
         FROM bot_runs WHERE user_id = $1 AND started_at > NOW() - INTERVAL '30 days'`,
      [req.user!.id],
    );
    // Estado de ativação (sem decifrar o token - só metadados para o painel).
    const act = await pool.query(
      `SELECT expires_at, source, updated_at FROM bot_context_tokens WHERE user_id = $1`,
      [req.user!.id],
    );
    const arow = act.rows[0];
    const expired = arow ? isExpired(arow.expires_at) : false;
    res.json({
      runs: runs.rows,
      lastSuccess: lastOk.rows[0] ?? null,
      importedTotal30d: totals.rows[0].imported_total,
      failures30d: totals.rows[0].failures_30d,
      activation: {
        configured: activationConfigured(),
        active: !!arow && !expired,
        expired,
        expiresAt: arow?.expires_at ?? null,
        source: arow?.source ?? null,
        updatedAt: arow?.updated_at ?? null,
      },
    });
  } catch (err) {
    console.error("Erro ao ler o estado do bot:", err);
    res.status(500).json({ error: "Erro ao ler o estado do bot." });
  }
});

// ------------------------------------------------------------
// POST /context-token - o admin ativa o bot: entrega um token de contexto da
// Betclic (o Bearer que a página usa contra a begmedia). Guardado CIFRADO.
// Corpo: { token, source?: "manual" | "extension" }
// ------------------------------------------------------------
router.post("/context-token", async (req: AuthenticatedRequest, res) => {
  if (!activationConfigured()) {
    res.status(503).json({ error: "Ativação não configurada no servidor (falta BOT_CTX_KEY/JWT_SECRET)." });
    return;
  }
  const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
  const source = req.body?.source === "extension" ? "extension" : "manual";
  if (!token) {
    res.status(400).json({ error: "Token em falta." });
    return;
  }
  const expMs = decodeJwtExpMs(token);
  if (expMs === null) {
    res.status(400).json({ error: "Isto não parece um token válido da Betclic." });
    return;
  }
  if (expMs <= Date.now()) {
    res.status(400).json({ error: "Esse token já expirou. Abre a Betclic (histórico de apostas) e captura um novo." });
    return;
  }
  try {
    const enc = encryptToken(token);
    await pool.query(
      `INSERT INTO bot_context_tokens (user_id, token_enc, source, expires_at, updated_at)
         VALUES ($1, $2, $3, $4, TIMEZONE('utc', NOW()))
       ON CONFLICT (user_id) DO UPDATE
         SET token_enc = EXCLUDED.token_enc,
             source = EXCLUDED.source,
             expires_at = EXCLUDED.expires_at,
             updated_at = TIMEZONE('utc', NOW())`,
      [req.user!.id, enc, source, new Date(expMs).toISOString()],
    );
    res.status(201).json({ success: true, expiresAt: new Date(expMs).toISOString(), source });
  } catch (err) {
    console.error("Erro ao guardar o token de ativação do bot:", err);
    res.status(500).json({ error: "Erro ao guardar a ativação." });
  }
});

// ------------------------------------------------------------
// GET /context-token - o bot (no telemóvel do admin) puxa o token no arranque
// frio, autenticado com o JWT do BetTrackr do próprio admin. 404 se não houver,
// 410 se expirou (o bot trata os dois como "sem token").
// ------------------------------------------------------------
router.get("/context-token", async (req: AuthenticatedRequest, res) => {
  if (!activationConfigured()) {
    res.status(503).json({ error: "Ativação não configurada no servidor." });
    return;
  }
  try {
    const r = await pool.query(
      `SELECT token_enc, expires_at, source FROM bot_context_tokens WHERE user_id = $1`,
      [req.user!.id],
    );
    const row = r.rows[0];
    if (!row) {
      res.status(404).json({ error: "Sem token de ativação. Ativa o bot no painel /bot." });
      return;
    }
    if (isExpired(row.expires_at)) {
      res.status(410).json({ error: "Token de ativação expirado. Reativa o bot no painel /bot." });
      return;
    }
    let token: string;
    try {
      token = decryptToken(row.token_enc);
    } catch {
      res.status(500).json({ error: "Não foi possível decifrar o token (a chave do servidor mudou?)." });
      return;
    }
    res.json({ token, expiresAt: row.expires_at, source: row.source });
  } catch (err) {
    console.error("Erro ao ler o token de ativação do bot:", err);
    res.status(500).json({ error: "Erro ao ler a ativação." });
  }
});

// ------------------------------------------------------------
// DELETE /context-token - o admin desativa (apaga o token guardado).
// ------------------------------------------------------------
router.delete("/context-token", async (req: AuthenticatedRequest, res) => {
  try {
    await pool.query("DELETE FROM bot_context_tokens WHERE user_id = $1", [req.user!.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao apagar o token de ativação do bot:", err);
    res.status(500).json({ error: "Erro ao desativar." });
  }
});

export default router;
