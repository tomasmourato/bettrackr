// src/lib/subscriptionDisplay.ts
// Traduz o estado bruto da subscrição para o que os ecrãs mostram.
//
// Vive à parte porque a versão desktop e a mobile têm de dizer exatamente a
// mesma coisa: se a regra do "faltam X dias" mudar, muda nos dois sítios de
// uma vez.

import type { Language } from "../types";
import type { BillingStatus } from "./billingApi";
import { formatDate, formatPrice, type TFn, type TKey } from "./i18n";

export type SubscriptionTone = "ok" | "warn" | "off";

export interface SubscriptionDisplay {
  /** Chave do estado a mostrar no crachá. */
  stateKey: TKey;
  tone: SubscriptionTone;
  /** Linha secundária já traduzida (renovação, fim da experiência...). */
  detail: string | null;
  /** Aviso extra quando algo precisa de atenção. */
  warning: string | null;
  price: string;
  canSubscribe: boolean;
  canManage: boolean;
}

/** Dias inteiros que faltam até uma data ISO; negativo se já passou. */
export function daysUntil(iso: string | null, now = Date.now()): number {
  if (!iso) return 0;
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return 0;
  return Math.ceil((target - now) / 86_400_000);
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };

export function describeSubscription(
  status: BillingStatus,
  lang: Language,
  t: TFn,
): SubscriptionDisplay {
  const price = formatPrice(lang, status.plan.priceCents, status.plan.currency);
  const subscription = status.subscription;
  const periodEnd = subscription?.currentPeriodEnd ?? null;
  const endLabel = periodEnd ? formatDate(lang, periodEnd, DATE_FORMAT) : null;

  // Quem é da casa entra sempre; mostrar-lhe "sem subscrição" só confundia.
  if (status.source === "admin") {
    return {
      stateKey: status.role === "founder" ? "billing.state.founder" : "billing.state.admin",
      tone: "ok",
      detail: null,
      warning: null,
      price,
      // Nada impede um administrador de subscrever a sério, mas o botão aqui
      // seria ruído: o acesso dele não depende disso.
      canSubscribe: false,
      canManage: Boolean(subscription),
    };
  }

  if (status.source === "subscription" && subscription) {
    const manual = subscription.source === "manual";
    // Cancelada mas ainda a correr: o acesso vai até ao fim do período pago.
    // A data vai no aviso, por isso a linha de detalhe fica de fora - dizer
    // "renova a 31 de agosto" logo por cima de "cancelada" era contraditório.
    const ending = subscription.cancelAtPeriodEnd;
    const pastDue = subscription.status === "past_due";

    let detail: string | null = null;
    if (ending) {
      detail = null;
    } else if (manual) {
      detail = endLabel ? t("billing.accessUntil", { date: endLabel }) : t("billing.noEndDate");
    } else if (endLabel) {
      detail = t("billing.renewsOn", { date: endLabel });
    }

    return {
      stateKey: pastDue ? "billing.state.pastDue" : "billing.state.active",
      tone: pastDue || ending ? "warn" : "ok",
      detail: manual && detail ? `${t("billing.sourceManual")} · ${detail}` : detail,
      warning: ending
        ? endLabel
          ? t("billing.cancelScheduled", { date: endLabel })
          : t("billing.cancelScheduledNoDate")
        : null,
      price,
      canSubscribe: false,
      // O portal continua a fazer falta depois de cancelar: é lá que se
      // retoma a subscrição.
      canManage: !manual,
    };
  }

  if (status.source === "trial") {
    const left = daysUntil(status.trialEndsAt);
    return {
      stateKey: "billing.state.trial",
      tone: left <= 3 ? "warn" : "ok",
      detail: status.trialEndsAt
        ? t("billing.trialEndsOn", { date: formatDate(lang, status.trialEndsAt, DATE_FORMAT) })
        : null,
      warning: left > 0 ? t("billing.trialDaysLeft", { count: left }) : null,
      price,
      canSubscribe: true,
      canManage: false,
    };
  }

  return {
    stateKey: "billing.state.none",
    tone: "off",
    detail: status.trialEndsAt && daysUntil(status.trialEndsAt) <= 0 ? t("billing.trialOver") : null,
    warning: null,
    price,
    canSubscribe: true,
    // Quem já pagou alguma vez consegue voltar ao portal para reativar.
    canManage: Boolean(status.subscription),
  };
}
