// routes/botRoutes.ts
// Estado e ativação do bot local da Betclic (bot/). Todas as rotas reservadas a
// quem tem acesso ao bot - staff (admin/founder) ou 'botuser' (amigos que usam o
// bot sem gerir nada; ver requireBotAccess e a migração 023). A feature é
// privada (ver db/migrations/021_bot_runs.sql):
//
//   POST   /api/bot/heartbeat       -> o bot reporta uma passagem
//   GET    /api/bot/status          -> o painel lê as passagens + ativações por conta
//   POST   /api/bot/context-token   -> ativa UMA conta: entrega um token de contexto (cifrado)
//   GET    /api/bot/context-token   -> o bot no telemóvel puxa as ativações no arranque frio
//   DELETE /api/bot/context-token   -> desativa UMA conta
//
// ÂMBITO DE CONTA (migração 024): há donos com 2+ contas na Betclic, por isso a
// ativação é por (user_id, account_id) - account_id é uma bookie_account de
// bookmaker Betclic. O bot processa todas as ativações do dono, uma por conta, e
// etiqueta as apostas com esse account_id.
//
// A identidade vem sempre do JWT (req.user.id), nunca do corpo: cada dono só vê
// e escreve o seu próprio estado, e uma conta só se aceita depois de confirmada
// como dele (ownsBetclicAccount). O único segredo que aqui passa é o token de
// contexto da Betclic (curto, do próprio dono) - e esse é guardado CIFRADO
// (lib/botCrypto.ts), nunca em claro. A chave da passkey nunca toca no servidor.

import { Router } from "express";
import pool from "../db/pool.js";
import { authenticateToken, AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { requireBotAccess } from "../middleware/accessMiddleware.js";
import { activationConfigured, encryptToken, decryptToken } from "../lib/botCrypto.js";
import { signToken } from "./authRoutes.js";

const router = Router();

router.use(authenticateToken);
router.use(requireBotAccess);

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A conta é do próprio dono E de bookmaker Betclic? A ativação tem de estar
// ancorada a uma bookie_account real dele - senão o bot etiquetaria as apostas
// numa conta que não é sua. (Espelha o validateAccountOwnership de betsRoutes,
// duplicado de propósito para não acoplar as rotas.) Betclic case-insensitive.
async function ownsBetclicAccount(userId: string, accountId: string): Promise<boolean> {
  const r = await pool.query(
    "SELECT 1 FROM bookie_accounts WHERE id = $1 AND user_id = $2 AND LOWER(bookmaker) = 'betclic'",
    [accountId, userId],
  );
  return r.rows.length > 0;
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
    // Ativações POR CONTA (sem decifrar o token - só metadados para o painel).
    // Join a bookie_accounts para o painel mostrar o nome da conta. Só as que
    // têm conta associada (a linha legada de account_id NULL não aparece).
    const act = await pool.query(
      `SELECT t.account_id, t.expires_at, t.source, t.updated_at, a.label, a.username
         FROM bot_context_tokens t
         JOIN bookie_accounts a ON a.id = t.account_id
        WHERE t.user_id = $1
        ORDER BY a.label ASC`,
      [req.user!.id],
    );
    const activations = act.rows.map((row) => {
      const expired = isExpired(row.expires_at);
      return {
        accountId: row.account_id,
        label: row.label,
        username: row.username ?? null,
        active: !expired,
        expired,
        expiresAt: row.expires_at ?? null,
        source: row.source ?? null,
        updatedAt: row.updated_at ?? null,
      };
    });
    res.json({
      runs: runs.rows,
      lastSuccess: lastOk.rows[0] ?? null,
      importedTotal30d: totals.rows[0].imported_total,
      failures30d: totals.rows[0].failures_30d,
      configured: activationConfigured(),
      activations,
    });
  } catch (err) {
    console.error("Erro ao ler o estado do bot:", err);
    res.status(500).json({ error: "Erro ao ler o estado do bot." });
  }
});

// ------------------------------------------------------------
// POST /context-token - ativa UMA conta Betclic: entrega um token de contexto
// (o Bearer que a página usa contra a begmedia). Guardado CIFRADO, por conta.
// Corpo: { token, accountId, source?: "manual" | "extension" }
// ------------------------------------------------------------
router.post("/context-token", async (req: AuthenticatedRequest, res) => {
  if (!activationConfigured()) {
    res.status(503).json({ error: "Ativação não configurada no servidor (falta BOT_CTX_KEY/JWT_SECRET)." });
    return;
  }
  const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
  const source = req.body?.source === "extension" ? "extension" : "manual";
  const accountId = typeof req.body?.accountId === "string" ? req.body.accountId.trim() : "";
  if (!token) {
    res.status(400).json({ error: "Token em falta." });
    return;
  }
  if (!accountId || !UUID_RE.test(accountId)) {
    res.status(400).json({ error: "Falta a conta (accountId) a que esta ativação pertence." });
    return;
  }
  if (!(await ownsBetclicAccount(req.user!.id, accountId))) {
    res.status(400).json({ error: "Conta Betclic inválida ou inexistente." });
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
      `INSERT INTO bot_context_tokens (user_id, account_id, token_enc, source, expires_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, TIMEZONE('utc', NOW()))
       ON CONFLICT (user_id, account_id) DO UPDATE
         SET token_enc = EXCLUDED.token_enc,
             source = EXCLUDED.source,
             expires_at = EXCLUDED.expires_at,
             updated_at = TIMEZONE('utc', NOW())`,
      [req.user!.id, accountId, enc, source, new Date(expMs).toISOString()],
    );
    res.status(201).json({ success: true, accountId, expiresAt: new Date(expMs).toISOString(), source });
  } catch (err) {
    console.error("Erro ao guardar o token de ativação do bot:", err);
    res.status(500).json({ error: "Erro ao guardar a ativação." });
  }
});

// ------------------------------------------------------------
// GET /context-token - o bot (no telemóvel do dono) puxa as ativações no
// arranque frio, autenticado com o JWT do BetTrackr do próprio dono. Devolve
// um ARRAY de ativações não expiradas (uma por conta) para o bot iterar. Uma
// lista vazia é resposta válida (o bot fica sem nada por que arrancar).
// ------------------------------------------------------------
router.get("/context-token", async (req: AuthenticatedRequest, res) => {
  if (!activationConfigured()) {
    res.status(503).json({ error: "Ativação não configurada no servidor." });
    return;
  }
  try {
    const r = await pool.query(
      `SELECT account_id, token_enc, expires_at, source
         FROM bot_context_tokens
        WHERE user_id = $1 AND account_id IS NOT NULL`,
      [req.user!.id],
    );
    const activations: Array<{ accountId: string; token: string; expiresAt: string | null; source: string }> = [];
    for (const row of r.rows) {
      if (isExpired(row.expires_at)) continue; // não servir tokens mortos
      let token: string;
      try {
        token = decryptToken(row.token_enc);
      } catch {
        continue; // chave do servidor mudou: ignora esta, não parte a resposta toda
      }
      activations.push({ accountId: row.account_id, token, expiresAt: row.expires_at ?? null, source: row.source });
    }
    res.json({ activations });
  } catch (err) {
    console.error("Erro ao ler os tokens de ativação do bot:", err);
    res.status(500).json({ error: "Erro ao ler a ativação." });
  }
});

// ------------------------------------------------------------
// DELETE /context-token - desativa UMA conta (apaga o token guardado dessa
// conta). O accountId vem no query (?accountId=) - usado pelo painel ao
// desativar e pelo bot ao consumir uma ativação após um re-enrolment.
// ------------------------------------------------------------
router.delete("/context-token", async (req: AuthenticatedRequest, res) => {
  const accountId = typeof req.query.accountId === "string" ? req.query.accountId.trim() : "";
  if (!accountId || !UUID_RE.test(accountId)) {
    res.status(400).json({ error: "Falta a conta (accountId) a desativar." });
    return;
  }
  try {
    await pool.query(
      "DELETE FROM bot_context_tokens WHERE user_id = $1 AND account_id = $2",
      [req.user!.id, accountId],
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao apagar o token de ativação do bot:", err);
    res.status(500).json({ error: "Erro ao desativar." });
  }
});

// ------------------------------------------------------------
// GET /token - emite um token do BetTrackr fresco para o bot se auto-renovar.
// O bot chama isto a cada passagem e guarda o novo (cifrado) para a proxima:
// como corre de 30 em 30 min e o token dura 7 dias, nunca "expira" enquanto o
// bot estiver a andar. O BETTRACKR_TOKEN do bot.env passa a ser so o arranque.
// Autenticado como qualquer rota do bot (admin), com a identidade do JWT.
// ------------------------------------------------------------
router.get("/token", (req: AuthenticatedRequest, res) => {
  const token = signToken({ id: req.user!.id, username: req.user!.username }, "bot");
  res.json({ token });
});

export default router;
