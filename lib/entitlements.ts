// lib/entitlements.ts
// Fonte única da pergunta "esta conta pode usar as funcionalidades pagas?".
//
// Três coisas dão acesso, por esta ordem:
//   1. ser administrador — quem gere a app não pode ficar de fora dela;
//   2. ter subscrição válida (Stripe ou concedida à mão no painel de gestão);
//   3. estar dentro do período experimental.
//
// Tanto o middleware que protege as rotas como o /api/billing/status usam
// este módulo, para não haver duas respostas diferentes à mesma pergunta.

import pool from "../db/pool.js";

// ------------------------------------------------------------
// Plano
// ------------------------------------------------------------
export const PLAN = {
  key: "pro_monthly",
  priceCents: 399,
  currency: "eur",
  interval: "month",
} as const;

// Código estável devolvido no 402. O cliente traduz-o; a mensagem em texto é
// só um fallback para quem chamar a API fora da app (extensão, curl).
export const SUBSCRIPTION_REQUIRED = "SUBSCRIPTION_REQUIRED";

// Enquanto o Stripe tenta cobrar de novo o estado fica "past_due". Cortar o
// acesso logo à primeira falha castiga um cartão que expirou entretanto, por
// isso damos alguns dias antes de fechar a porta.
const PAST_DUE_GRACE_MS = 3 * 24 * 60 * 60 * 1000;

export type Role = "user" | "admin";
export type AccessSource = "admin" | "subscription" | "trial" | "none";

export interface SubscriptionSnapshot {
  status: string;
  source: "stripe" | "manual";
  plan: string;
  priceCents: number;
  currency: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  note: string | null;
  updatedAt: string | null;
}

export interface AccessState {
  userId: string;
  role: Role;
  entitled: boolean;
  /** O que está a dar o acesso neste momento (o primeiro que se aplica). */
  source: AccessSource;
  trialEndsAt: string | null;
  trialActive: boolean;
  subscription: SubscriptionSnapshot | null;
  stripeCustomerId: string | null;
}

function asDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function iso(value: unknown): string | null {
  return asDate(value)?.toISOString() ?? null;
}

/**
 * Uma subscrição só conta se o estado for de acesso E o período pago ainda não
 * tiver acabado. current_period_end a NULL numa subscrição manual significa
 * "sem fim" — é assim que um administrador oferece acesso permanente.
 */
export function subscriptionGrantsAccess(
  snapshot: Pick<SubscriptionSnapshot, "status" | "currentPeriodEnd">,
  now = new Date(),
): boolean {
  const end = asDate(snapshot.currentPeriodEnd);

  if (snapshot.status === "active" || snapshot.status === "trialing") {
    return !end || end.getTime() > now.getTime();
  }
  if (snapshot.status === "past_due") {
    return !!end && end.getTime() + PAST_DUE_GRACE_MS > now.getTime();
  }
  // canceled/unpaid/incomplete/paused não dão acesso. Nota: no Stripe um
  // cancelamento "no fim do período" mantém o estado em "active" com
  // cancel_at_period_end=true, por isso o acesso vai até ao fim, como deve ser.
  return false;
}

function snapshotFromRow(row: any): SubscriptionSnapshot | null {
  if (!row?.status) return null;
  return {
    status: row.status,
    source: row.source,
    plan: row.plan,
    priceCents: Number(row.price_cents),
    currency: row.currency,
    currentPeriodEnd: iso(row.current_period_end),
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    note: row.note ?? null,
    updatedAt: iso(row.updated_at),
  };
}

/** Colunas da subscrição, com prefixo, para reutilizar noutras consultas. */
export const SUBSCRIPTION_COLUMNS = `
  s.status, s.source, s.plan, s.price_cents, s.currency,
  s.current_period_end, s.cancel_at_period_end, s.note, s.updated_at
`;

/**
 * As mesmas regras de subscriptionGrantsAccess()/accessFromRow(), mas em SQL,
 * para o painel de gestão poder filtrar e contar sem trazer a tabela toda para
 * memória. Pressupõe `users u LEFT JOIN subscriptions s ON s.user_id = u.id`.
 *
 * Se as regras acima mudarem, esta expressão muda com elas — os três dias de
 * tolerância são o PAST_DUE_GRACE_MS.
 */
export const ENTITLED_SQL = `(
  u.role = 'admin'
  OR (u.trial_ends_at IS NOT NULL AND u.trial_ends_at > NOW())
  OR (
    s.status IN ('active', 'trialing')
    AND (s.current_period_end IS NULL OR s.current_period_end > NOW())
  )
  OR (
    s.status = 'past_due'
    AND s.current_period_end IS NOT NULL
    AND s.current_period_end + INTERVAL '3 days' > NOW()
  )
)`;

/** Constrói o estado de acesso a partir de uma linha já lida (users + subscriptions). */
export function accessFromRow(row: any, now = new Date()): AccessState {
  const role: Role = row.role === "admin" ? "admin" : "user";
  const subscription = snapshotFromRow(row);
  const trialEnd = asDate(row.trial_ends_at);
  const trialActive = !!trialEnd && trialEnd.getTime() > now.getTime();
  const subscriptionActive = !!subscription && subscriptionGrantsAccess(subscription, now);

  const source: AccessSource =
    role === "admin" ? "admin" : subscriptionActive ? "subscription" : trialActive ? "trial" : "none";

  return {
    userId: row.id,
    role,
    entitled: source !== "none",
    source,
    trialEndsAt: iso(row.trial_ends_at),
    trialActive,
    subscription,
    stripeCustomerId: row.stripe_customer_id ?? null,
  };
}

/** Lê o estado de acesso de um utilizador. Devolve null se a conta não existir. */
export async function loadAccess(userId: string): Promise<AccessState | null> {
  const result = await pool.query(
    `SELECT u.id, u.role, u.trial_ends_at, u.stripe_customer_id, ${SUBSCRIPTION_COLUMNS}
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id
      WHERE u.id = $1`,
    [userId],
  );
  const row = result.rows[0];
  return row ? accessFromRow(row) : null;
}
