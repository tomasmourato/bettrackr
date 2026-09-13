// src/components/NotificationsPanel.tsx
// A página de notificações. Vive dentro da Gestão, no URL
// /admin?view=notifications - é lá que o push de "bot parado" abre. No desktop
// substitui o painel de gestão, com um «voltar»; no mobile abre numa SheetPage
// (src/mobile/screens/MobileAdmin.tsx). Os dados vêm do useNotifications de quem
// a abre, para o contador do sino e a lista serem a mesma leitura.
//
// Daqui sai também o aviso que o painel do bot mostra no topo (BotAlertBanner):
// é o mesmo alerta, contado da mesma maneira.

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  BellOff,
  Bot as BotIcon,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { AppNotification, BotStalledData } from "../lib/notificationsApi";
import type { NotificationsState } from "../hooks/useNotifications";
import { getPushPermission, type PushPermission } from "../lib/push";
import { isNativeApp } from "../lib/apiBase";
import { useI18n } from "../lib/i18n";

export type NotificationsMode = "desktop" | "mobile";

const CARD: Record<NotificationsMode, string> = {
  desktop: "bg-white dark:bg-zinc-900 rounded-sm border border-zinc-200 dark:border-zinc-800",
  mobile: "bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800",
};
const GHOST_BUTTON =
  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 text-zinc-600 dark:text-zinc-300 font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

/** O alerta de bot parado ainda em aberto, se houver. */
export function openBotAlert(items: AppNotification[]): AppNotification | undefined {
  return items.find((item) => item.kind === "bot_stalled" && !item.resolvedAt);
}

/** Data e hora curtas, como nas passagens do bot. */
function useStamp() {
  const { formatDate, formatTime } = useI18n();
  return (value: string) => `${formatDate(value)} ${formatTime(value)}`;
}

/** O texto de um alerta de bot parado, formado no idioma de quem lê. */
function BotStalledBody({ data, showHint }: { data: Partial<BotStalledData>; showHint: boolean }) {
  const { t } = useI18n();
  const stamp = useStamp();
  const silent = data.state === "silent";

  const line = silent
    ? t("notif.botStalled.silent", { date: data.lastRunAt ? stamp(data.lastRunAt) : "—" })
    : data.lastSuccessAt
      ? t("notif.botStalled.failing", { date: stamp(data.lastSuccessAt) })
      : t("notif.botStalled.failingNever");

  return (
    <div className="space-y-1">
      <p className="text-xs text-zinc-600 dark:text-zinc-300">{line}</p>
      {data.lastError && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className="font-semibold">{t("notif.botStalled.lastError")}:</span>{" "}
          <span className="font-mono text-red-600 dark:text-red-400 break-words">{data.lastError}</span>
        </p>
      )}
      {showHint && (
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
          {silent ? t("notif.botStalled.hintSilent") : t("notif.botStalled.hintFailing")}
        </p>
      )}
    </div>
  );
}

/** O aviso no topo do painel do bot, enquanto o alerta estiver em aberto. */
export function BotAlertBanner({ notification }: { notification: AppNotification }) {
  const { t } = useI18n();
  const stamp = useStamp();
  return (
    <div
      role="alert"
      className="rounded-sm border border-amber-300 dark:border-amber-900/70 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 flex items-start gap-3"
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t("notif.botStalled.title")}</p>
        <BotStalledBody data={notification.data as Partial<BotStalledData>} showHint />
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">{stamp(notification.createdAt)}</p>
      </div>
    </div>
  );
}

function NotificationItem({
  notification,
  isNew,
  mode,
  onOpenBot,
}: {
  notification: AppNotification;
  isNew: boolean;
  mode: NotificationsMode;
  onOpenBot?: () => void;
}) {
  const { t } = useI18n();
  const stamp = useStamp();
  const open = !notification.resolvedAt;
  const isBot = notification.kind === "bot_stalled";

  return (
    <div className={`${CARD[mode]} px-4 py-3 flex items-start gap-3`}>
      <div className="mt-0.5 shrink-0">
        {open ? (
          <AlertTriangle size={16} className="text-amber-500" />
        ) : (
          <CheckCircle2 size={16} className="text-emerald-500" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {isBot ? t("notif.botStalled.title") : t("notif.unknown")}
          </span>
          {isNew && (
            <span className="px-1.5 py-0.5 rounded-sm bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold uppercase tracking-wider font-mono">
              {t("notif.new")}
            </span>
          )}
          <span
            className={`text-[10px] font-semibold ${
              open ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {open || !notification.resolvedAt
              ? t("notif.open")
              : t("notif.resolvedAt", { date: stamp(notification.resolvedAt) })}
          </span>
        </div>

        {isBot && <BotStalledBody data={notification.data as Partial<BotStalledData>} showHint={open} />}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">{stamp(notification.createdAt)}</span>
          {isBot && open && onOpenBot && (
            <button
              type="button"
              onClick={onOpenBot}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              <BotIcon size={12} /> {t("notif.openBot")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Diz se os alertas chegam como push a este dispositivo, e porque não, quando não. */
function PushStatus({ state }: { state: NotificationsState }) {
  const { t } = useI18n();
  const native = isNativeApp();
  const [permission, setPermission] = useState<PushPermission | null>(native ? null : "unavailable");

  useEffect(() => {
    if (!native) return;
    let cancelled = false;
    void getPushPermission().then((value) => {
      if (!cancelled) setPermission(value);
    });
    return () => {
      cancelled = true;
    };
  }, [native, state.devices]);

  if (!state.loaded || (native && permission === null)) return null;

  let message: string;
  let on = false;
  if (!state.pushConfigured) message = t("notif.push.serverOff");
  else if (!native) message = t("notif.push.web");
  else if (permission === "unavailable") message = t("notif.push.needsApk");
  else if (permission === "denied") message = t("notif.push.denied");
  else if (permission === "granted" && state.devices > 0) {
    message = t("notif.push.on");
    on = true;
  } else message = t("notif.push.pending");

  return (
    <p
      className={`flex items-center gap-1.5 text-[11px] ${
        on ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"
      }`}
    >
      {on ? <Bell size={12} /> : <BellOff size={12} />}
      {message}
    </p>
  );
}

export default function NotificationsPanel({
  mode,
  state,
  onBack,
  onOpenBot,
}: {
  mode: NotificationsMode;
  state: NotificationsState;
  /** Só no desktop: no mobile a SheetPage já tem o seu fechar. */
  onBack?: () => void;
  onOpenBot?: () => void;
}) {
  const { t } = useI18n();
  const { items, loaded, loading, error, reload, markAllRead } = state;

  // Abrir a página dá as notificações como lidas. As que estavam por ler ficam
  // marcadas como «Nova» enquanto se está a ver - senão sumia a única pista.
  const [fresh, setFresh] = useState<Set<string>>(() => new Set());
  const markedRef = useRef(false);
  useEffect(() => {
    if (!loaded || markedRef.current) return;
    markedRef.current = true;
    const unread = items.filter((item) => !item.readAt).map((item) => item.id);
    if (unread.length === 0) return;
    setFresh(new Set(unread));
    void markAllRead();
  }, [loaded, items, markAllRead]);

  const refreshButton =
    mode === "desktop" ? (
      <button type="button" onClick={() => void reload()} disabled={loading} className={`${GHOST_BUTTON} text-xs`}>
        <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> {t("notif.refresh")}
      </button>
    ) : (
      <button
        type="button"
        onClick={() => void reload()}
        disabled={loading}
        aria-label={t("notif.refresh")}
        className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 disabled:opacity-50"
      >
        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
      </button>
    );

  return (
    <div className={mode === "desktop" ? "space-y-5 max-w-3xl" : "space-y-3 pb-4"} id="notifications-view">
      {mode === "desktop" ? (
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mb-2 inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <ArrowLeft size={12} /> {t("notif.back")}
              </button>
            )}
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">
              {t("notif.title")}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{t("notif.subtitle")}</p>
          </div>
          {refreshButton}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("notif.subtitle")}</p>
          {refreshButton}
        </div>
      )}

      <PushStatus state={state} />

      {error && (
        <div className="p-3 rounded-sm border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-medium">
          {error}
        </div>
      )}

      {!loaded && loading ? (
        <p className="py-10 text-center text-xs text-zinc-400 dark:text-zinc-500 font-mono flex items-center justify-center gap-2">
          <Loader2 size={14} className="animate-spin" /> {t("admin.loading")}
        </p>
      ) : loaded && items.length === 0 ? (
        <div className={`${CARD[mode]} px-4 py-8 text-sm text-zinc-500 dark:text-zinc-400 text-center`}>
          {t("notif.empty")}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <NotificationItem
              key={item.id}
              notification={item}
              isNew={fresh.has(item.id)}
              mode={mode}
              onOpenBot={onOpenBot}
            />
          ))}
        </div>
      )}
    </div>
  );
}
