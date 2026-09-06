// src/components/BotPanel.tsx
// Painel do bot da Betclic (privado, admin). So MOSTRA o estado que o bot local
// reporta (routes/botRoutes.ts): ultima passagem, importadas, falhas. Nao
// controla o bot - o bot corre em casa (bot/README.md). Usado pela shell
// desktop e, envolvido, pela mobile (src/mobile/screens/MobileBot.tsx).

import { useEffect, useState, useCallback } from "react";
import { Loader2, RefreshCw, CheckCircle2, XCircle, Bot as BotIcon } from "lucide-react";
import { fetchBotStatus, type BotStatus, type BotRun } from "../lib/botApi";
import { useI18n } from "../lib/i18n";

const CARD = "bg-white dark:bg-zinc-900 rounded-sm border border-zinc-200 dark:border-zinc-800";
const GHOST_BUTTON =
  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 text-zinc-600 dark:text-zinc-300 font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={`${CARD} px-4 py-3`}>
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500 font-mono">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100 font-display tabular-nums">{value}</p>
    </div>
  );
}

function RunRow({ run }: { run: BotRun }) {
  const { t, formatDate } = useI18n();
  const seconds = run.duration_ms != null ? `${(run.duration_ms / 1000).toFixed(1)}s` : "—";
  return (
    <div className={`${CARD} px-4 py-3 flex items-start gap-3`}>
      <div className="mt-0.5 shrink-0">
        {run.ok ? (
          <CheckCircle2 size={16} className="text-emerald-500" />
        ) : (
          <XCircle size={16} className="text-red-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {run.ok ? t("bot.ok") : t("bot.failed")}
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">{formatDate(run.started_at)}</span>
        </div>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
          {run.read_count} {t("bot.read")} · {run.imported} {t("bot.imported")} · {t("bot.duration")} {seconds}
        </p>
        {run.error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400 break-words font-mono">{run.error}</p>
        )}
      </div>
    </div>
  );
}

export default function BotPanel() {
  const { t, formatDate } = useI18n();
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStatus(await fetchBotStatus());
    } catch {
      setError(t("bot.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <BotIcon size={22} className="text-emerald-500 mt-0.5" />
          <div>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-display">{t("bot.title")}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("bot.subtitle")}</p>
          </div>
        </div>
        <button type="button" onClick={() => void load()} className={GHOST_BUTTON} disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {t("bot.refresh")}
        </button>
      </div>

      {error && (
        <div className={`${CARD} px-4 py-3 text-sm text-red-600 dark:text-red-400`}>{error}</div>
      )}

      {status && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Metric
              label={t("bot.lastSuccess")}
              value={status.lastSuccess ? formatDate(status.lastSuccess.started_at) : t("bot.never")}
            />
            <Metric label={t("bot.imported30d")} value={String(status.importedTotal30d)} />
            <Metric label={t("bot.failures30d")} value={String(status.failures30d)} />
          </div>

          <div className="space-y-2">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500 font-mono">
              {t("bot.recentRuns")}
            </h2>
            {status.runs.length === 0 ? (
              <div className={`${CARD} px-4 py-6 text-sm text-zinc-500 dark:text-zinc-400 text-center`}>
                {t("bot.empty")}
              </div>
            ) : (
              <div className="space-y-2">
                {status.runs.map((run) => (
                  <RunRow key={run.id} run={run} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
