// routes/botRoutes.ts
// Estado do bot local da Betclic (bot/). Duas rotas, ambas reservadas a
// administradores (a feature é privada; ver db/migrations/021_bot_runs.sql):
//
//   POST /api/bot/heartbeat  -> o bot reporta uma passagem
//   GET  /api/bot/status     -> o painel lê as passagens recentes
//
// A identidade vem sempre do JWT (req.user.id), nunca do corpo: cada admin só
// vê e escreve as suas próprias passagens. Isto NÃO recebe nem guarda segredos
// do bot (token da Betclic, chave da passkey) - só telemetria.

import { Router } from "express";
import pool from "../db/pool.js";
import { authenticateToken, AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/accessMiddleware.js";

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
    res.json({
      runs: runs.rows,
      lastSuccess: lastOk.rows[0] ?? null,
      importedTotal30d: totals.rows[0].imported_total,
      failures30d: totals.rows[0].failures_30d,
    });
  } catch (err) {
    console.error("Erro ao ler o estado do bot:", err);
    res.status(500).json({ error: "Erro ao ler o estado do bot." });
  }
});

export default router;
