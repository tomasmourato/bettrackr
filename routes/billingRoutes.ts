// routes/billingRoutes.ts
// Subscrição de 3,99 €/mês que dá acesso às funcionalidades de IA e à extensão.
//
// O pagamento é feito no Stripe Checkout (a app nunca vê dados de cartão) e o
// estado volta pelo webhook. A base de dados é a fonte de verdade para o
// acesso: se o Stripe estiver em baixo, quem já pagou continua a entrar.
//
// Variáveis de ambiente:
//   STRIPE_SECRET_KEY      — sem ela o pagamento fica indisponível (mas a app
//                            funciona: o acesso manual e o trial não dependem
//                            do Stripe).
//   STRIPE_WEBHOOK_SECRET  — obrigatória para aceitar webhooks.
//   STRIPE_PRICE_ID        — opcional; se faltar, o preço vai inline no
//                            Checkout e não é preciso configurar nada no
//                            dashboard do Stripe.
//   STRIPE_TAX_CODE        — opcional; categoria fiscal do produto criado
//                            inline (ver TAX_CODE abaixo).
//   APP_URL                — base dos redirecionamentos; se faltar, é
//                            deduzida do próprio pedido.

import { Router, type Request, type Response } from "express";
import Stripe from "stripe";
import pool from "../db/pool.js";
import { authenticateToken, AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { loadAccess, PLAN } from "../lib/entitlements.js";

const router = Router();

// Categoria fiscal do produto. É obrigatória: as contas novas do Stripe têm
// "Managed Payments" ligado por defeito (o Stripe fica como vendedor e trata
// do IVA por nós) e recusam um produto sem categoria —
// "the product tax code is missing".
//
// txcd_10103000 = Software as a service (SaaS), uso pessoal: software na
// nuvem, acedido pelo browser, vendido a consumidores. É o que o BetTrackr é.
// Trocável por env se a contabilidade preferir outra categoria.
const TAX_CODE = process.env.STRIPE_TAX_CODE?.trim() || "txcd_10103000";

// ------------------------------------------------------------
// Cliente do Stripe
// ------------------------------------------------------------
let stripeClient: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

// Criado à primeira utilização, como o pool da BD: uma chave em falta não pode
// derrubar a função inteira no arranque.
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY não está definida no ambiente.");
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

// Base dos redirecionamentos. Não usamos o header Origin: seria o cliente a
// escolher para onde o Stripe o manda depois de pagar.
function appBaseUrl(req: Request): string {
  const configured = process.env.APP_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  const proto = (req.headers["x-forwarded-proto"] as string)?.split(",")[0] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

// ------------------------------------------------------------
// Leitura da subscrição do Stripe
// ------------------------------------------------------------

/**
 * O fim do período deixou de estar na subscrição e passou para os itens
 * (mudança da API do Stripe em 2025). Lê-se do item que termina mais tarde,
 * com recurso ao campo antigo para contas ainda presas a uma versão anterior.
 */
function periodEndOf(subscription: Stripe.Subscription): Date | null {
  const fromItems = subscription.items?.data
    ?.map((item) => (item as any).current_period_end as number | undefined)
    .filter((value): value is number => typeof value === "number");
  const legacy = (subscription as any).current_period_end as number | undefined;
  const seconds = fromItems?.length ? Math.max(...fromItems) : legacy;
  return typeof seconds === "number" ? new Date(seconds * 1000) : null;
}

/**
 * Uma subscrição está marcada para acabar?
 *
 * O `cancel_at_period_end` sozinho não chega: quando o utilizador cancela no
 * portal, esta versão da API agenda o fim em `cancel_at` (uma data concreta) e
 * deixa o booleano antigo a `false`. Ler só o booleano fazia a app dizer
 * "renova a 31 de agosto" a quem tinha acabado de cancelar.
 */
function isEnding(subscription: Stripe.Subscription): boolean {
  return subscription.cancel_at_period_end || Boolean(subscription.cancel_at);
}

/**
 * Data em que o acesso acaba se nada mudar: a do cancelamento agendado, se
 * houver, senão o fim do período pago (que renova).
 */
function accessEndsAt(subscription: Stripe.Subscription): Date | null {
  if (subscription.cancel_at) return new Date(subscription.cancel_at * 1000);
  return periodEndOf(subscription);
}

function priceOf(subscription: Stripe.Subscription): { cents: number; currency: string } {
  const price = subscription.items?.data?.[0]?.price;
  return {
    cents: typeof price?.unit_amount === "number" ? price.unit_amount : PLAN.priceCents,
    currency: price?.currency ?? PLAN.currency,
  };
}

/** Grava (ou atualiza) a subscrição de um utilizador a partir do objeto do Stripe. */
async function saveStripeSubscription(userId: string, subscription: Stripe.Subscription): Promise<void> {
  const { cents, currency } = priceOf(subscription);
  await pool.query(
    `INSERT INTO subscriptions (
       user_id, status, source, plan, price_cents, currency,
       current_period_end, cancel_at_period_end, stripe_subscription_id, updated_at
     )
     VALUES ($1, $2, 'stripe', $3, $4, $5, $6, $7, $8, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       status = EXCLUDED.status,
       source = 'stripe',
       plan = EXCLUDED.plan,
       price_cents = EXCLUDED.price_cents,
       currency = EXCLUDED.currency,
       current_period_end = EXCLUDED.current_period_end,
       cancel_at_period_end = EXCLUDED.cancel_at_period_end,
       stripe_subscription_id = EXCLUDED.stripe_subscription_id,
       -- Deixou de ser uma oferta manual: o Stripe passa a mandar.
       granted_by = NULL,
       updated_at = NOW()`,
    [
      userId,
      subscription.status,
      PLAN.key,
      cents,
      currency,
      accessEndsAt(subscription),
      isEnding(subscription),
      subscription.id,
    ],
  );
}

/**
 * Descobre a que utilizador pertence um evento. A metadata é o caminho
 * direto; o cliente do Stripe é a rede de segurança para subscrições criadas
 * fora da app (por exemplo, à mão no dashboard).
 */
async function userIdForSubscription(subscription: Stripe.Subscription): Promise<string | null> {
  const fromMetadata = subscription.metadata?.userId;
  if (fromMetadata) {
    const known = await pool.query("SELECT id FROM users WHERE id = $1", [fromMetadata]);
    if (known.rows[0]) return known.rows[0].id;
  }

  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
  if (!customerId) return null;

  const byCustomer = await pool.query("SELECT id FROM users WHERE stripe_customer_id = $1", [customerId]);
  return byCustomer.rows[0]?.id ?? null;
}

/** Garante que o utilizador tem um cliente no Stripe e devolve o respetivo id. */
async function ensureCustomer(userId: string): Promise<string> {
  const result = await pool.query(
    "SELECT email, username, stripe_customer_id FROM users WHERE id = $1",
    [userId],
  );
  const user = result.rows[0];
  if (!user) throw new Error("Utilizador não encontrado.");
  if (user.stripe_customer_id) return user.stripe_customer_id;

  const customer = await getStripe().customers.create({
    email: user.email,
    name: user.username ?? undefined,
    metadata: { userId },
  });
  await pool.query("UPDATE users SET stripe_customer_id = $1 WHERE id = $2", [customer.id, userId]);
  return customer.id;
}

// ============================================================
// POST /api/billing/webhook
//
// Montado no server.ts ANTES do express.json(), com express.raw(): a
// verificação da assinatura precisa dos bytes exatos que o Stripe enviou —
// um JSON.parse seguido de JSON.stringify já não bate certo.
// Exportado à parte por isso mesmo, em vez de viver neste router.
// ============================================================
export async function stripeWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret || !isStripeConfigured()) {
    res.status(503).json({ error: "Webhooks do Stripe não configurados." });
    return;
  }
  if (!Buffer.isBuffer(req.body)) {
    // Sem os bytes originais não há verificação possível. Falhar alto é melhor
    // do que aceitar um evento não verificado — quem pode escrever aqui pode
    // dar-se subscrições grátis.
    console.error("[billing] webhook recebido sem corpo em bruto — verifica a ordem dos middlewares.");
    res.status(400).json({ error: "Corpo do webhook inválido." });
    return;
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, signature as string, secret);
  } catch (error: any) {
    console.error("[billing] assinatura do webhook inválida:", error?.message);
    res.status(400).json({ error: "Assinatura inválida." });
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId ?? session.client_reference_id;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        if (userId && customerId) {
          await pool.query("UPDATE users SET stripe_customer_id = $1 WHERE id = $2", [customerId, userId]);
        }
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
        if (userId && subscriptionId) {
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
          await saveStripeSubscription(userId, subscription);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await userIdForSubscription(subscription);
        if (userId) {
          await saveStripeSubscription(userId, subscription);
        } else {
          console.warn("[billing] subscrição sem utilizador conhecido:", subscription.id);
        }
        break;
      }

      default:
        // Os restantes eventos não mudam o acesso; aceitar sem fazer nada
        // evita que o Stripe os fique a repetir.
        break;
    }

    res.json({ received: true });
  } catch (error: any) {
    // 500 faz o Stripe tentar de novo, que é o que queremos numa falha da BD.
    console.error("[billing] falha ao processar o webhook:", error?.message);
    res.status(500).json({ error: "Falha ao processar o evento." });
  }
}

// ------------------------------------------------------------
// Daqui para baixo é tudo autenticado.
// ------------------------------------------------------------
router.use(authenticateToken);

// ============================================================
// GET /api/billing e GET /api/billing/status -> estado do acesso do
// utilizador atual. Chamado pela app e pela extensão para saberem o que
// mostrar; os dois caminhos respondem o mesmo para nenhum lado ter de
// adivinhar qual é o certo.
// ============================================================
async function statusHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const access = await loadAccess(req.user!.id);
    if (!access) {
      res.status(404).json({ error: "Utilizador não encontrado." });
      return;
    }
    res.json({
      entitled: access.entitled,
      source: access.source,
      role: access.role,
      trialEndsAt: access.trialEndsAt,
      trialActive: access.trialActive,
      subscription: access.subscription,
      plan: { ...PLAN },
      // O cliente esconde o botão de pagar quando não há Stripe configurado,
      // em vez de mostrar um botão que rebenta.
      checkoutAvailable: isStripeConfigured(),
    });
  } catch (error) {
    console.error("Erro ao obter o estado da subscrição:", error);
    res.status(500).json({ error: "Erro ao obter o estado da subscrição." });
  }
}

router.get("/", statusHandler);
router.get("/status", statusHandler);

// ============================================================
// POST /api/billing/checkout -> devolve o url do Stripe Checkout
// ============================================================
router.post("/checkout", async (req: AuthenticatedRequest, res) => {
  if (!isStripeConfigured()) {
    res.status(503).json({ code: "STRIPE_UNAVAILABLE", error: "Os pagamentos ainda não estão disponíveis." });
    return;
  }

  try {
    const userId = req.user!.id;
    const access = await loadAccess(userId);
    if (access?.subscription && access.entitled && access.source === "subscription") {
      res.status(409).json({ code: "ALREADY_SUBSCRIBED", error: "Já existe uma subscrição ativa." });
      return;
    }

    const customerId = await ensureCustomer(userId);
    const base = appBaseUrl(req);
    const priceId = process.env.STRIPE_PRICE_ID;

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: userId,
      // Sem STRIPE_PRICE_ID o preço vai inline: dá para começar a cobrar sem
      // criar nada no dashboard do Stripe.
      line_items: [
        priceId
          ? { price: priceId, quantity: 1 }
          : {
              quantity: 1,
              price_data: {
                currency: PLAN.currency,
                unit_amount: PLAN.priceCents,
                recurring: { interval: PLAN.interval },
                // Os 3,99 € JÁ INCLUEM imposto. Sem isto o Stripe trata o
                // valor como líquido e soma o IVA por cima — um cliente
                // português via 4,91 € num sítio onde a app anuncia 3,99 €.
                //
                // Efeito colateral aceite: o que recebemos passa a depender do
                // país (23% em Portugal deixa 3,24 € líquidos; um país com
                // taxa menor deixa mais). É o normal em preços ao consumidor
                // na UE, onde o preço mostrado tem de ser o preço final.
                tax_behavior: "inclusive",
                product_data: {
                  name: "BetTrackr Pro",
                  description: "Funcionalidades de IA e extensão de browser.",
                  tax_code: TAX_CODE,
                },
              },
            },
      ],
      metadata: { userId },
      subscription_data: { metadata: { userId } },
      allow_promotion_codes: true,
      success_url: `${base}/settings?checkout=success`,
      cancel_url: `${base}/settings?checkout=cancelled`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    // A mensagem do Stripe fica no log (diz exatamente o que falhou); ao
    // cliente vai só o código, que ele traduz no idioma do utilizador.
    console.error("Erro ao criar a sessão de pagamento:", error?.message);
    res.status(502).json({ code: "CHECKOUT_FAILED", error: "Não foi possível iniciar o pagamento." });
  }
});

// ============================================================
// POST /api/billing/portal -> url do portal do Stripe (cancelar, mudar cartão)
// ============================================================
router.post("/portal", async (req: AuthenticatedRequest, res) => {
  if (!isStripeConfigured()) {
    res.status(503).json({ code: "STRIPE_UNAVAILABLE", error: "Os pagamentos ainda não estão disponíveis." });
    return;
  }

  try {
    const result = await pool.query("SELECT stripe_customer_id FROM users WHERE id = $1", [req.user!.id]);
    const customerId = result.rows[0]?.stripe_customer_id;
    if (!customerId) {
      res.status(409).json({ code: "NO_CUSTOMER", error: "Ainda não existe nenhum pagamento associado a esta conta." });
      return;
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appBaseUrl(req)}/settings`,
    });
    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Erro ao abrir o portal de faturação:", error?.message);
    res.status(502).json({ code: "PORTAL_FAILED", error: "Não foi possível abrir a gestão da subscrição." });
  }
});

export default router;
