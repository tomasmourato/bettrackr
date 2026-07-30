// src/mobile/components/MobileSubscription.tsx
// Versão mobile do cartão da subscrição e do aviso que substitui os ecrãs
// pagos. O conteúdo (estado, datas, avisos) vem do mesmo
// src/lib/subscriptionDisplay.ts que a versão desktop usa — aqui só muda a
// forma: cartões arredondados e alvos de toque grandes.

import { CheckCircle2, Loader2, Lock, RefreshCw, Sparkles } from "lucide-react";

import { useBillingActions } from "../../hooks/useBillingActions";
import { useCheckoutReturn } from "../../hooks/useCheckoutReturn";
import { isNativeApp } from "../../lib/apiBase";
import type { BillingStatus } from "../../lib/billingApi";
import { useI18n } from "../../lib/i18n";
import { describeSubscription, type SubscriptionTone } from "../../lib/subscriptionDisplay";
import { Pressable } from "../ui";

const TONE_BADGE: Record<SubscriptionTone, string> = {
  ok: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  warn: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  off: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const INCLUDED = [
  "billing.includes.screenshot",
  "billing.includes.insights",
  "billing.includes.extension",
] as const;

function Included() {
  const { t } = useI18n();
  return (
    <>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500 font-mono mb-1.5">
        {t("billing.includesTitle")}
      </p>
      <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
      {INCLUDED.map((key) => (
        <li key={key} className="flex items-start gap-2">
          <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{t(key)}</span>
        </li>
        ))}
      </ul>
    </>
  );
}

function ErrorLine({ message }: { message: string }) {
  return (
    <p className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-medium">
      {message}
    </p>
  );
}

const PRIMARY =
  "w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60";
const SECONDARY =
  "w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-semibold disabled:opacity-60";

// ------------------------------------------------------------
// Cartão das Definições
// ------------------------------------------------------------
export function MobileSubscriptionCard({
  status,
  loading,
  onRefresh,
}: {
  status: BillingStatus | null;
  loading: boolean;
  onRefresh: () => Promise<void>;
}) {
  const { t, lang } = useI18n();
  const { busy, error, subscribe, manage } = useBillingActions();
  const outcome = useCheckoutReturn(() => void onRefresh());

  if (loading && !status) {
    return (
      <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-2 font-mono">
        <Loader2 size={13} className="animate-spin" /> {t("billing.loading")}
      </div>
    );
  }
  if (!status) {
    return (
      <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 text-xs text-zinc-400 dark:text-zinc-500">
        {t("admin.error")}
      </div>
    );
  }

  const view = describeSubscription(status, lang, t);

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
      {outcome && (
        <p
          className={`p-3 rounded-xl text-xs font-medium ${
            outcome === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          }`}
        >
          {outcome === "success" ? t("billing.checkoutSuccess") : t("billing.checkoutCancelled")}
        </p>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-display">
            {t("billing.planName")}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {t("billing.perMonth", { price: view.price })}
          </p>
        </div>
        <span className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${TONE_BADGE[view.tone]}`}>
          {t(view.stateKey)}
        </span>
      </div>

      {view.detail && <p className="text-xs text-zinc-600 dark:text-zinc-300">{view.detail}</p>}
      {view.warning && (
        <p className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs font-medium">
          {view.warning}
        </p>
      )}

      <Included />
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{t("billing.freeNote")}</p>

      {error && <ErrorLine message={error} />}

      {view.canSubscribe &&
        (status.checkoutAvailable ? (
          <Pressable as="button" onClick={subscribe} disabled={busy !== null} className={PRIMARY}>
            {busy === "checkout" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {busy === "checkout" ? t("billing.opening") : t("billing.subscribeFor", { price: view.price })}
          </Pressable>
        ) : (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("billing.unavailable")}</p>
        ))}

      {view.canManage && status.checkoutAvailable && (
        <Pressable as="button" onClick={manage} disabled={busy !== null} className={SECONDARY}>
          {busy === "portal" ? <Loader2 size={14} className="animate-spin" /> : null}
          {busy === "portal" ? t("billing.opening") : t("billing.manage")}
        </Pressable>
      )}

      {isNativeApp() && status.checkoutAvailable && (view.canSubscribe || view.canManage) && (
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{t("billing.nativeNotice")}</p>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Aviso no lugar de um ecrã pago
// ------------------------------------------------------------
export function MobilePaywall({
  status,
  onRefresh,
  refreshing = false,
}: {
  status: BillingStatus;
  onRefresh: () => void;
  refreshing?: boolean;
}) {
  const { t, lang } = useI18n();
  const { busy, error, subscribe } = useBillingActions();
  const view = describeSubscription(status, lang, t);

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 mt-4">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-emerald-600/10 flex items-center justify-center shrink-0">
          <Lock size={18} className="text-emerald-600 dark:text-emerald-400" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-display">
            {t("billing.locked.title")}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{t("billing.locked.body")}</p>
        </div>
      </div>

      {view.detail && <p className="text-xs text-zinc-600 dark:text-zinc-300">{view.detail}</p>}

      <Included />
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{t("billing.freeNote")}</p>

      {error && <ErrorLine message={error} />}

      {status.checkoutAvailable ? (
        <Pressable as="button" onClick={subscribe} disabled={busy !== null} className={PRIMARY}>
          {busy === "checkout" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {busy === "checkout" ? t("billing.opening") : t("billing.subscribeFor", { price: view.price })}
        </Pressable>
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("billing.unavailable")}</p>
      )}

      <Pressable as="button" onClick={onRefresh} disabled={refreshing} className={SECONDARY}>
        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> {t("billing.refresh")}
      </Pressable>

      {isNativeApp() && status.checkoutAvailable && (
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{t("billing.nativeNotice")}</p>
      )}
    </div>
  );
}
