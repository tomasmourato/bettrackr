// routes/adminRoutes.ts
// Painel de gestão: só para quem tem role = 'admin'.
//
// Permite ver as contas todas, mudar papéis, conceder ou revogar subscrições
// à mão (útil para quem paga por fora, para parceiros e para testes), esticar
// o período experimental e apagar contas. Tudo o que muda uma conta fica
// registado no admin_audit_log - inclusive quem o fez.

import { Router } from "express";
import pool from "../db/pool.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireAdmin, requireFounder, AccessRequest } from "../middleware/accessMiddleware.js";
import { BET_SELECT_COLUMNS } from "../db/betColumns.js";
import { accessFromRow, ENTITLED_SQL, PLAN, SUBSCRIPTION_COLUMNS } from "../lib/entitlements.js";
import { cancelStripeSubscription, isStripeConfigured } from "./billingRoutes.js";

const router = Router();
router.use(authenticateToken);
router.use(requireAdmin);

const PAGE_SIZE_DEFAULT = 25;
const PAGE_SIZE_MAX = 100;

// Um administrador pode conceder acesso permanente, mas não por engano: o
// limite existe para um "12" distraído não virar 12 anos.
const MAX_GRANT_MONTHS = 60;

function clampInt(raw: unknown, fallback: number, min: number, max: number): number {
  const value = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Grava a ação no log de auditoria. Nunca deixa a rota falhar: perder uma
 * linha de auditoria é mau, mas desfazer uma alteração que já foi escrita na
 * base de dados por causa disso é pior.
 */
async function audit(
  admin: { id: string; username: string },
  action: string,
  target: { id: string | null; username: string | null },
  details: Record<string, unknown> = {},
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO admin_audit_log (admin_id, admin_username, action, target_user_id, target_username, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [admin.id, admin.username, action, target.id, target.username, JSON.stringify(details)],
    );
  } catch (error) {
    console.error("[admin] falha ao registar auditoria:", error);
  }
}

// Conta quem tem acesso ao painel - administradores E fundadores. É este
// número que impede a app de ficar sem ninguém que lá entre.
async function countStaff(): Promise<number> {
  const result = await pool.query(
    "SELECT COUNT(*)::int AS total FROM users WHERE role IN ('admin', 'founder')",
  );
  return result.rows[0]?.total ?? 0;
}

/** Lê a conta pelo id, já com a subscrição, no formato que o painel mostra. */
async function loadUserRow(userId: string) {
  const result = await pool.query(
    `SELECT u.id, u.username, u.email, u.role, u.language, u.created_at,
            u.trial_ends_at, u.stripe_customer_id,
            ${SUBSCRIPTION_COLUMNS},
            (SELECT COUNT(*)::int FROM bets b WHERE b.user_id = u.id) AS bets_count
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id
      WHERE u.id = $1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

function presentUser(row: any) {
  const access = accessFromRow(row);
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: access.role,
    language: row.language ?? null,
    createdAt: row.created_at,
    betsCount: row.bets_count ?? 0,
    hasStripeCustomer: Boolean(row.stripe_customer_id),
    entitled: access.entitled,
    accessSource: access.source,
    trialEndsAt: access.trialEndsAt,
    trialActive: access.trialActive,
    subscription: access.subscription,
  };
}

// ============================================================
// GET /api/admin/overview -> números do topo do painel
// ============================================================
router.get("/overview", async (_req: AccessRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(*)::int AS users,
         COUNT(*) FILTER (WHERE u.role IN ('admin', 'founder'))::int AS admins,
         COUNT(*) FILTER (WHERE u.created_at > NOW() - INTERVAL '30 days')::int AS new_users_30d,
         COUNT(*) FILTER (WHERE ${ENTITLED_SQL})::int AS entitled,
         COUNT(*) FILTER (WHERE s.status IN ('active', 'trialing') AND s.source = 'stripe')::int AS paying,
         COUNT(*) FILTER (WHERE s.status IN ('active', 'trialing') AND s.source = 'manual')::int AS granted,
         COUNT(*) FILTER (WHERE s.status = 'past_due')::int AS past_due,
         COUNT(*) FILTER (
           WHERE s.status IS NULL
             AND u.trial_ends_at IS NOT NULL
             AND u.trial_ends_at > NOW()
         )::int AS on_trial,
         COALESCE(SUM(s.price_cents) FILTER (
           WHERE s.status IN ('active', 'trialing') AND s.source = 'stripe'
         ), 0)::int AS mrr_cents
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id`,
    );
    const bets = await pool.query("SELECT COUNT(*)::int AS total FROM bets");

    res.json({
      ...result.rows[0],
      bets: bets.rows[0]?.total ?? 0,
      currency: PLAN.currency,
    });
  } catch (error) {
    console.error("[admin] erro no resumo:", error);
    res.status(500).json({ error: "Erro ao obter o resumo." });
  }
});

// ============================================================
// GET /api/admin/users?search=&filter=&page=&pageSize=
// filter: all | entitled | blocked | paying | granted | trial | admins
// ============================================================
router.get("/users", async (req: AccessRequest, res) => {
  const page = clampInt(req.query.page, 1, 1, 100000);
  const pageSize = clampInt(req.query.pageSize, PAGE_SIZE_DEFAULT, 1, PAGE_SIZE_MAX);
  const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
  const filter = typeof req.query.filter === "string" ? req.query.filter : "all";

  const where: string[] = [];
  const values: unknown[] = [];

  if (search) {
    values.push(`%${search}%`);
    where.push(`(u.username ILIKE $${values.length} OR u.email ILIKE $${values.length})`);
  }

  switch (filter) {
    case "entitled":
      where.push(ENTITLED_SQL);
      break;
    case "blocked":
      where.push(`NOT ${ENTITLED_SQL}`);
      break;
    case "paying":
      where.push("s.source = 'stripe' AND s.status IN ('active', 'trialing')");
      break;
    case "granted":
      where.push("s.source = 'manual' AND s.status IN ('active', 'trialing')");
      break;
    case "trial":
      where.push("s.status IS NULL AND u.trial_ends_at IS NOT NULL AND u.trial_ends_at > NOW()");
      break;
    case "admins":
      where.push("u.role IN ('admin', 'founder')");
      break;
    default:
      break;
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const total = await pool.query(
      `SELECT COUNT(*)::int AS total FROM users u LEFT JOIN subscriptions s ON s.user_id = u.id ${whereSql}`,
      values,
    );

    values.push(pageSize, (page - 1) * pageSize);
    const rows = await pool.query(
      `SELECT u.id, u.username, u.email, u.role, u.language, u.created_at,
              u.trial_ends_at, u.stripe_customer_id,
              ${SUBSCRIPTION_COLUMNS},
              (SELECT COUNT(*)::int FROM bets b WHERE b.user_id = u.id) AS bets_count
         FROM users u
         LEFT JOIN subscriptions s ON s.user_id = u.id
         ${whereSql}
         ORDER BY u.created_at DESC
         LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );

    res.json({
      users: rows.rows.map(presentUser),
      total: total.rows[0]?.total ?? 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("[admin] erro ao listar utilizadores:", error);
    res.status(500).json({ error: "Erro ao listar os utilizadores." });
  }
});

// ============================================================
// GET /api/admin/users/:id -> detalhe de uma conta
// ============================================================
router.get("/users/:id", async (req: AccessRequest, res) => {
  if (!isUuid(req.params.id)) {
    res.status(400).json({ error: "Identificador inválido." });
    return;
  }
  try {
    const row = await loadUserRow(req.params.id);
    if (!row) {
      res.status(404).json({ error: "Utilizador não encontrado." });
      return;
    }
    res.json({ user: presentUser(row) });
  } catch (error) {
    console.error("[admin] erro ao obter utilizador:", error);
    res.status(500).json({ error: "Erro ao obter o utilizador." });
  }
});

// ============================================================
// PATCH /api/admin/users/:id/role -> { role: 'user' | 'admin' }
// ============================================================
router.patch("/users/:id/role", async (req: AccessRequest, res) => {
  const targetId = req.params.id;
  const role = req.body?.role;

  if (!isUuid(targetId)) {
    res.status(400).json({ error: "Identificador inválido." });
    return;
  }
  // 'founder' não é atribuível por aqui de propósito: se a API o soubesse
  // dar, também lho saberia tirar, e a proteção deixava de valer. Cria-se com
  // o scripts/make-admin.mjs.
  if (role !== "user" && role !== "admin") {
    res.status(400).json({ error: "role tem de ser 'user' ou 'admin'." });
    return;
  }
  // Despromover-se a si próprio tirava o acesso ao painel a meio do trabalho.
  if (targetId === req.user!.id && role !== "admin") {
    res.status(409).json({ error: "Não podes retirar-te a ti próprio o papel de administrador." });
    return;
  }

  try {
    const current = await pool.query("SELECT username, role FROM users WHERE id = $1", [targetId]);
    if (!current.rows[0]) {
      res.status(404).json({ error: "Utilizador não encontrado." });
      return;
    }
    // O cargo de fundador é intocável pela API - é isso que impede um
    // administrador promovido de se virar contra quem o promoveu.
    if (current.rows[0].role === "founder") {
      res.status(409).json({ error: "O cargo de fundador não pode ser alterado a partir do painel." });
      return;
    }
    // Sem ninguém com acesso ao painel, ninguém volta lá a entrar - nem para
    // se promover de novo.
    if (current.rows[0].role === "admin" && role === "user" && (await countStaff()) <= 1) {
      res.status(409).json({ error: "Tem de existir pelo menos um administrador." });
      return;
    }

    await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, targetId]);
    await audit(req.user!, "role.update", { id: targetId, username: current.rows[0].username }, {
      from: current.rows[0].role,
      to: role,
    });

    const row = await loadUserRow(targetId);
    res.json({ success: true, user: row ? presentUser(row) : null });
  } catch (error) {
    console.error("[admin] erro ao mudar o papel:", error);
    res.status(500).json({ error: "Erro ao alterar o papel." });
  }
});

// ============================================================
// PATCH /api/admin/users/:id/trial -> { days: number }
// days positivo estica o período a partir de hoje; 0 termina-o já.
// ============================================================
router.patch("/users/:id/trial", async (req: AccessRequest, res) => {
  const targetId = req.params.id;
  const days = Number(req.body?.days);

  if (!isUuid(targetId)) {
    res.status(400).json({ error: "Identificador inválido." });
    return;
  }
  if (!Number.isFinite(days) || days < 0 || days > 3650) {
    res.status(400).json({ error: "days tem de ser um número entre 0 e 3650." });
    return;
  }

  try {
    const current = await pool.query("SELECT username FROM users WHERE id = $1", [targetId]);
    if (!current.rows[0]) {
      res.status(404).json({ error: "Utilizador não encontrado." });
      return;
    }

    // days = 0 apaga o período experimental (NULL), em vez de o pôr a acabar
    // "há um segundo". Um segundo cabe inteiro dentro da diferença normal
    // entre o relógio da base de dados e o do servidor, e o resultado era o
    // fim ficar no futuro para quem lê: o painel continuava a dizer
    // "experiência" durante uns segundos depois de a tirarmos. NULL não
    // depende de relógio nenhum.
    const result = await pool.query(
      `UPDATE users
          SET trial_ends_at = CASE WHEN $1::int = 0
                                   THEN NULL
                                   ELSE NOW() + make_interval(days => $1::int)
                              END
        WHERE id = $2
        RETURNING trial_ends_at`,
      [Math.round(days), targetId],
    );

    await audit(req.user!, "trial.update", { id: targetId, username: current.rows[0].username }, {
      days: Math.round(days),
      trialEndsAt: result.rows[0]?.trial_ends_at,
    });

    const row = await loadUserRow(targetId);
    res.json({ success: true, user: row ? presentUser(row) : null });
  } catch (error) {
    console.error("[admin] erro ao alterar o período experimental:", error);
    res.status(500).json({ error: "Erro ao alterar o período experimental." });
  }
});

// ============================================================
// PUT /api/admin/users/:id/subscription -> concede/renova à mão
// Corpo: { months?: number (0 = sem fim), note?: string }
// ============================================================
router.put("/users/:id/subscription", async (req: AccessRequest, res) => {
  const targetId = req.params.id;
  const months = req.body?.months === undefined ? 1 : Number(req.body.months);
  const note = typeof req.body?.note === "string" ? req.body.note.trim().slice(0, 300) : null;

  if (!isUuid(targetId)) {
    res.status(400).json({ error: "Identificador inválido." });
    return;
  }
  if (!Number.isFinite(months) || months < 0 || months > MAX_GRANT_MONTHS) {
    res.status(400).json({ error: `months tem de ser um número entre 0 e ${MAX_GRANT_MONTHS}.` });
    return;
  }

  try {
    const current = await pool.query("SELECT username FROM users WHERE id = $1", [targetId]);
    if (!current.rows[0]) {
      res.status(404).json({ error: "Utilizador não encontrado." });
      return;
    }

    const existing = await pool.query(
      "SELECT source, stripe_subscription_id FROM subscriptions WHERE user_id = $1",
      [targetId],
    );
    // Escrever por cima de uma subscrição do Stripe punha a base de dados a
    // dizer uma coisa e o Stripe outra - e o próximo webhook desfazia a oferta.
    if (existing.rows[0]?.source === "stripe" && existing.rows[0]?.stripe_subscription_id) {
      res.status(409).json({
        error: "Esta conta tem uma subscrição do Stripe. Cancela-a no Stripe antes de conceder acesso manual.",
      });
      return;
    }

    // months = 0 -> sem fim (acesso permanente).
    const result = await pool.query(
      `INSERT INTO subscriptions (
         user_id, status, source, plan, price_cents, currency,
         current_period_end, cancel_at_period_end, granted_by, note, updated_at
       )
       VALUES (
         $1, 'active', 'manual', $2, $3, $4,
         CASE WHEN $5::int = 0 THEN NULL ELSE NOW() + make_interval(months => $5::int) END,
         FALSE, $6, $7, NOW()
       )
       ON CONFLICT (user_id) DO UPDATE SET
         status = 'active',
         source = 'manual',
         plan = EXCLUDED.plan,
         price_cents = EXCLUDED.price_cents,
         currency = EXCLUDED.currency,
         current_period_end = EXCLUDED.current_period_end,
         cancel_at_period_end = FALSE,
         stripe_subscription_id = NULL,
         granted_by = EXCLUDED.granted_by,
         note = EXCLUDED.note,
         updated_at = NOW()
       RETURNING current_period_end`,
      [targetId, PLAN.key, PLAN.priceCents, PLAN.currency, Math.round(months), req.user!.id, note],
    );

    await audit(req.user!, "subscription.grant", { id: targetId, username: current.rows[0].username }, {
      months: Math.round(months),
      currentPeriodEnd: result.rows[0]?.current_period_end,
      note,
    });

    const row = await loadUserRow(targetId);
    res.json({ success: true, user: row ? presentUser(row) : null });
  } catch (error) {
    console.error("[admin] erro ao conceder subscrição:", error);
    res.status(500).json({ error: "Erro ao conceder a subscrição." });
  }
});

// ============================================================
// DELETE /api/admin/users/:id/subscription -> retira o acesso à conta
//
// Serve para os dois tipos de subscrição. Numa oferta manual basta marcar a
// linha como cancelada; numa do Stripe cancela-se TAMBÉM lá, senão ficava a
// pior das combinações: o utilizador sem acesso e a ser cobrado à mesma.
//
// Cancelar não devolve dinheiro - reembolsos fazem-se no Stripe, e reembolsar
// uma cobrança não cancela a subscrição (são coisas independentes).
// ============================================================
router.delete("/users/:id/subscription", async (req: AccessRequest, res) => {
  const targetId = req.params.id;
  if (!isUuid(targetId)) {
    res.status(400).json({ error: "Identificador inválido." });
    return;
  }

  try {
    const current = await pool.query(
      `SELECT u.username, s.source, s.stripe_subscription_id
         FROM users u LEFT JOIN subscriptions s ON s.user_id = u.id
        WHERE u.id = $1`,
      [targetId],
    );
    if (!current.rows[0]) {
      res.status(404).json({ error: "Utilizador não encontrado." });
      return;
    }
    const { username, source, stripe_subscription_id: stripeId } = current.rows[0];
    if (!source) {
      res.status(404).json({ error: "Esta conta não tem subscrição." });
      return;
    }

    if (source === "stripe" && stripeId) {
      if (!isStripeConfigured()) {
        res.status(409).json({
          error: "Sem ligação ao Stripe não é possível parar a cobrança. Cancela a subscrição no Stripe.",
        });
        return;
      }
      const cancelled = await cancelStripeSubscription(stripeId);
      if (!cancelled) {
        // Não se mexe na base de dados: dizer "cancelada" aqui enquanto o
        // Stripe continua a cobrar seria pior do que falhar.
        res.status(502).json({ error: "Não foi possível cancelar a subscrição no Stripe. Tenta novamente." });
        return;
      }
    }

    await pool.query(
      `UPDATE subscriptions
          SET status = 'canceled', cancel_at_period_end = FALSE,
              current_period_end = NOW(), updated_at = NOW()
        WHERE user_id = $1`,
      [targetId],
    );
    await audit(req.user!, "subscription.revoke", { id: targetId, username }, { source });

    const row = await loadUserRow(targetId);
    res.json({ success: true, user: row ? presentUser(row) : null });
  } catch (error) {
    console.error("[admin] erro ao revogar subscrição:", error);
    res.status(500).json({ error: "Erro ao revogar a subscrição." });
  }
});

// ============================================================
// DELETE /api/admin/users/:id -> apaga a conta (e tudo o que depende dela)
// ============================================================
router.delete("/users/:id", async (req: AccessRequest, res) => {
  const targetId = req.params.id;
  if (!isUuid(targetId)) {
    res.status(400).json({ error: "Identificador inválido." });
    return;
  }
  if (targetId === req.user!.id) {
    res.status(409).json({ error: "Não podes apagar a tua própria conta a partir daqui." });
    return;
  }

  try {
    const current = await pool.query("SELECT username, email, role FROM users WHERE id = $1", [targetId]);
    if (!current.rows[0]) {
      res.status(404).json({ error: "Utilizador não encontrado." });
      return;
    }
    if (current.rows[0].role === "founder") {
      res.status(409).json({ error: "A conta de fundador não pode ser apagada a partir do painel." });
      return;
    }
    if (current.rows[0].role === "admin" && (await countStaff()) <= 1) {
      res.status(409).json({ error: "Tem de existir pelo menos um administrador." });
      return;
    }

    // As apostas, contas e amizades vão atrás por ON DELETE CASCADE.
    await pool.query("DELETE FROM users WHERE id = $1", [targetId]);
    await audit(req.user!, "user.delete", { id: null, username: current.rows[0].username }, {
      email: current.rows[0].email,
      role: current.rows[0].role,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("[admin] erro ao apagar utilizador:", error);
    res.status(500).json({ error: "Erro ao apagar a conta." });
  }
});

// ============================================================
// GET /api/admin/audit?limit= -> últimas ações dos administradores
// ============================================================
router.get("/audit", async (req: AccessRequest, res) => {
  const limit = clampInt(req.query.limit, 50, 1, 200);
  try {
    const result = await pool.query(
      `SELECT id, admin_username, action, target_username, details, created_at
         FROM admin_audit_log
        ORDER BY created_at DESC
        LIMIT $1`,
      [limit],
    );
    res.json({
      entries: result.rows.map((row) => ({
        id: row.id,
        adminUsername: row.admin_username,
        action: row.action,
        targetUsername: row.target_username,
        details: row.details ?? {},
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error("[admin] erro ao ler a auditoria:", error);
    res.status(500).json({ error: "Erro ao obter o registo de auditoria." });
  }
});

// ============================================================
// GET /api/admin/users/:id/bets -> perfil de um membro (só o fundador)
//
// A mesma vista que o social dá de um amigo, mas para qualquer conta e sem
// precisar de amizade. Fica atrás do requireFounder e não do requireAdmin de
// proposito: gerir contas e ler as apostas de toda a gente são poderes
// diferentes, e o segundo não acompanha uma promoção a administrador.
//
// Devolve as apostas ignoradas de fora, como o social faz: quem as marcou
// assim tirou-as das suas contas, e um perfil que as mostrasse dava números
// que nao batem certo com os que o proprio utilizador ve.
// ============================================================
router.get("/users/:id/bets", requireFounder, async (req: AccessRequest, res) => {
  const targetId = req.params.id;
  if (!isUuid(targetId)) {
    res.status(400).json({ error: "Identificador inválido." });
    return;
  }

  try {
    const user = await pool.query(
      "SELECT id, username, email, created_at FROM users WHERE id = $1",
      [targetId],
    );
    if (user.rows.length === 0) {
      res.status(404).json({ error: "Utilizador não encontrado." });
      return;
    }

    const bets = await pool.query(
      `SELECT ${BET_SELECT_COLUMNS}
         FROM bets
        WHERE user_id = $1 AND is_ignored = FALSE
        ORDER BY date_time DESC NULLS LAST, created_at DESC`,
      [targetId],
    );

    res.json({ user: user.rows[0], bets: bets.rows });
  } catch (error) {
    console.error("[admin] erro ao obter as apostas do membro:", error);
    res.status(500).json({ error: "Erro ao obter as apostas do membro." });
  }
});

export default router;
