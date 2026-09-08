// src/lib/billingApi.ts
// Estado da subscrição e ligação ao Stripe Checkout.
//
// O servidor é quem decide se há acesso (ver lib/entitlements.ts); aqui só se
// lê a decisão e se mostra o que for preciso. Nunca gatear apenas no cliente:
// esconder um botão não protege a quota do Gemini.

import { apiUrl, isNativeApp } from "./apiBase";
import { apiError, ApiError } from "./apiError";
import { authFetch, getToken, parseJsonResponse } from "./authApi";

export type AccessSource = "admin" | "subscription" | "trial" | "role" | "none";

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

export interface BillingStatus {
  entitled: boolean;
  source: AccessSource;
  role: "user" | "admin" | "founder" | "botuser";
  trialEndsAt: string | null;
  trialActive: boolean;
  subscription: SubscriptionSnapshot | null;
  plan: { key: string; priceCents: number; currency: string; interval: string };
  checkoutAvailable: boolean;
}

export async function fetchBillingStatus(): Promise<BillingStatus> {
  const res = await authFetch("/api/billing/status");
  const data = await parseJsonResponse(res);
  if (!res.ok) throw apiError(data, res, "errors.billing.status");
  return data as BillingStatus;
}

/**
 * Erro de pagamento com o código estável que o servidor devolve.
 *
 * O `error` do servidor está sempre em português (é o idioma em que as rotas
 * estão escritas); mostrá-lo tal e qual dava uma frase portuguesa no meio de
 * uma interface inglesa. Quem apanha este erro traduz o `code` e só usa o
 * texto do servidor quando não reconhece o código.
 */
export class BillingError extends ApiError {
  constructor(status: number, code?: string, serverMessage?: string) {
    super("errors.billing.request", status, code, serverMessage);
    this.name = "BillingError";
  }
}

async function requestUrl(path: string): Promise<string> {
  const res = await authFetch(path, { method: "POST", body: "{}" });
  const data = await parseJsonResponse(res);
  if (!res.ok || !data?.url) {
    throw new BillingError(res.status, data?.code ?? undefined, data?.error);
  }
  return data.url as string;
}

export function startCheckout(): Promise<string> {
  return requestUrl("/api/billing/checkout");
}

export function openBillingPortal(): Promise<string> {
  return requestUrl("/api/billing/portal");
}

/**
 * Leva o utilizador para uma página do Stripe.
 *
 * Na web navega-se o próprio separador: um window.open() depois de um await
 * já não conta como gesto do utilizador e apanha o bloqueador de pop-ups.
 * Na app nativa é o contrário - trocar o URL do WebView tirava o utilizador
 * de dentro da app, por isso abre-se no browser do sistema.
 */
export function goToStripe(url: string): void {
  if (isNativeApp()) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  window.location.href = url;
}

/**
 * Estado da subscrição para a extensão e outros consumidores sem sessão React.
 * Devolve null se não houver sessão iniciada.
 */
export async function fetchBillingStatusOrNull(): Promise<BillingStatus | null> {
  if (!getToken()) return null;
  try {
    const res = await fetch(apiUrl("/api/billing/status"), {
      headers: { Authorization: `Bearer ${getToken()}` },
      credentials: "same-origin",
    });
    if (!res.ok) return null;
    return (await res.json()) as BillingStatus;
  } catch {
    return null;
  }
}
