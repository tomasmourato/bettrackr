// src/components/SubscriptionCard.tsx
// Cartão da subscrição nas Definições (desktop). Mostra o estado atual e leva
// ao Stripe para subscrever ou gerir. O equivalente mobile vive em
// src/mobile/screens/MobileSettings.tsx.

import { CheckCircle2, CreditCard, Loader2, ShieldCheck, Sparkles } from "lucide-react";

import { useBillingActions } from "../hooks/useBillingActions";
import { useCheckoutReturn } from "../hooks/useCheckoutReturn";
import type { BillingStatus } from "../lib/billingApi";
import { isNativeApp } from "../lib/apiBase";
import { useI18n } from "../lib/i18n";
import { describeSubscription, type SubscriptionTone } from "../lib/subscriptionDisplay";

const TONE_BADGE: Record<SubscriptionTone, string> = {
  ok: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900",
  warn: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900",
  off: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800",
};

const INCLUDED = [
  "billing.includes.screenshot",
  "billing.includes.insights",
  "billing.includes.extension",
] as const;

interface SubscriptionCardProps {
  status: BillingStatus | null;
  loading: boolean;
  /** Relê o estado — usado ao voltar do Stripe. */
  onRefresh: () => Promise<void>;
}

export default function SubscriptionCard({ status, loading, onRefresh }: SubscriptionCardProps) {
  const { t, lang } = useI18n();
  const { busy, error, subscribe, manage } = useBillingActions();
  const outcome = useCheckoutReturn(() => void onRefresh());

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-sm p-5 border border-zinc-200 dark:border-zinc-800">
      <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display flex items-center gap-2 mb-4">
        <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" /> {t("billing.title")}
      </h4>

      {outcome && (
        <p
          className={`mb-4 p-3 rounded-sm border text-xs font-medium ${
            outcome === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900"
              : "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800"
          }`}
        >
          {outcome === "success" ? t("billing.checkoutSuccess") : t("billing.checkoutCancelled")}
        </p>
      )}

      {loading && !status ? (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono flex items-center gap-2">
          <Loader2 size={13} className="animate-spin" /> {t("billing.loading")}
        </p>
      ) : !status ? (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">{t("admin.error")}</p>
      ) : (
        (() => {
          const view = describeSubscription(status, lang, t);
          return (
            <div className="space-y-4 text-xs">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-display">
                    {t("billing.planName")}
                  </p>
                  <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {t("billing.perMonth", { price: view.price })}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-sm border text-[10px] font-bold uppercase tracking-wider font-mono ${TONE_BADGE[view.tone]}`}
                >
                  {t(view.stateKey)}
                </span>
              </div>

              {view.detail && <p className="text-zinc-600 dark:text-zinc-300">{view.detail}</p>}
              {view.warning && (
                <p className="p-2.5 rounded-sm border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 font-medium">
                  {view.warning}
                </p>
              )}

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500 font-mono">
                {t("billing.includesTitle")}
              </p>
              <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-300">
                {INCLUDED.map((key) => (
                  <li key={key} className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{t("billing.freeNote")}</p>

              {error && (
                <p className="p-2.5 rounded-sm border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-medium">
                  {error}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {view.canSubscribe &&
                  (status.checkoutAvailable ? (
                    <button
                      onClick={subscribe}
                      disabled={busy !== null}
                      className="flex items-center gap-2 px-3 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-colors cursor-pointer"
                    >
                      {busy === "checkout" ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                      {busy === "checkout" ? t("billing.opening") : t("billing.subscribeFor", { price: view.price })}
                    </button>
                  ) : (
                    <p className="text-zinc-500 dark:text-zinc-400">{t("billing.unavailable")}</p>
                  ))}

                {view.canManage && status.checkoutAvailable && (
                  <button
                    onClick={manage}
                    disabled={busy !== null}
                    className="flex items-center gap-2 px-3 py-2 rounded-sm border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 text-zinc-700 dark:text-zinc-300 font-semibold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {busy === "portal" ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />}
                    {busy === "portal" ? t("billing.opening") : t("billing.manage")}
                  </button>
                )}
              </div>

              {isNativeApp() && (view.canSubscribe || view.canManage) && status.checkoutAvailable && (
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{t("billing.nativeNotice")}</p>
              )}
            </div>
          );
        })()
      )}
    </div>
  );
}
