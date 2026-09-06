// src/components/PaywallNotice.tsx
// O que aparece no lugar de um ecrã pago (Importar por IA, Dicas) quando a
// conta não tem acesso. O bloqueio real é do servidor (402); isto é só a
// forma educada de o dizer.

import { CheckCircle2, Loader2, Lock, RefreshCw, Sparkles } from "lucide-react";

import { useBillingActions } from "../hooks/useBillingActions";
import type { BillingStatus } from "../lib/billingApi";
import { isNativeApp } from "../lib/apiBase";
import { useI18n } from "../lib/i18n";
import { describeSubscription } from "../lib/subscriptionDisplay";

const INCLUDED = [
  "billing.includes.screenshot",
  "billing.includes.insights",
  "billing.includes.extension",
  "billing.includes.clv",
] as const;

interface PaywallNoticeProps {
  status: BillingStatus;
  /** Relê o estado - para quem pagou noutro separador não ficar preso aqui. */
  onRefresh: () => void;
  refreshing?: boolean;
}

export default function PaywallNotice({ status, onRefresh, refreshing = false }: PaywallNoticeProps) {
  const { t, lang } = useI18n();
  const { busy, error, subscribe } = useBillingActions();
  const view = describeSubscription(status, lang, t);

  return (
    <div className="max-w-xl mx-auto my-8 bg-white dark:bg-zinc-900 rounded-sm border border-zinc-200 dark:border-zinc-800 p-6 text-xs">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-9 h-9 rounded-sm bg-emerald-600/10 border border-emerald-500/30 flex items-center justify-center">
          <Lock size={16} className="text-emerald-600 dark:text-emerald-400" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">
            {t("billing.locked.title")}
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">{t("billing.locked.body")}</p>
        </div>
      </div>

      {view.detail && <p className="text-zinc-600 dark:text-zinc-300 mb-3">{view.detail}</p>}

      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500 font-mono mb-1.5">
        {t("billing.includesTitle")}
      </p>
      <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-300 mb-3">
        {INCLUDED.map((key) => (
          <li key={key} className="flex items-start gap-2">
            <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-4">{t("billing.freeNote")}</p>

      {error && (
        <p className="mb-3 p-2.5 rounded-sm border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-medium">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {status.checkoutAvailable ? (
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
        )}

        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-sm border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 text-zinc-700 dark:text-zinc-300 font-semibold transition-colors cursor-pointer disabled:opacity-60"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /> {t("billing.refresh")}
        </button>
      </div>

      {isNativeApp() && status.checkoutAvailable && (
        <p className="mt-3 text-[11px] text-zinc-400 dark:text-zinc-500">{t("billing.nativeNotice")}</p>
      )}
    </div>
  );
}
