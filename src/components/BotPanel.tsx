// src/components/BotPanel.tsx
// Painel do bot da Betclic (privado, admin). Duas partes:
//
//  1. ATIVAÇÃO - o admin entrega ao bot um token de contexto da Betclic. No
//     desktop, a extensão captura-o sozinha (o inject.js já o tem); no mobile,
//     cola-se à mão. O token vai cifrado para o servidor (routes/botRoutes.ts)
//     e o bot no telemóvel puxa-o no arranque frio (bot/src/index.ts).
//  2. ESTADO - só MOSTRA o que o bot local reporta (última passagem, importadas,
//     falhas). Não controla o bot; o bot corre em casa (bot/README.md).
//
// Partilhado pelas duas shells: a desktop passa mode="desktop", a mobile
// mode="mobile" (src/mobile/screens/MobileBot.tsx).

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Bot as BotIcon,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  DownloadCloud,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  fetchBotStatus,
  activateBot,
  deactivateBot,
  type BotStatus,
  type BotRun,
  type BotAccountActivation,
  type BotActivationSource,
} from "../lib/botApi";
import { fetchAccounts } from "../lib/accountsApi";
import { STORAGE_KEYS } from "../lib/storageKeys";
import type { BookieAccount } from "../types";
import { requestBetclicToken } from "../hooks/useBetclicExtension";
import { useI18n } from "../lib/i18n";
import { messageOf } from "../lib/apiError";

export type BotMode = "desktop" | "mobile";

const CARD = "bg-white dark:bg-zinc-900 rounded-sm border border-zinc-200 dark:border-zinc-800";
const GHOST_BUTTON =
  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 text-zinc-600 dark:text-zinc-300 font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const PRIMARY_BUTTON =
  "flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const ICON_BUTTON =
  "flex items-center justify-center p-1.5 rounded-sm border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

// Cartões escondidos no painel /bot: conveniência por-visor, guardada em
// localStorage (nunca no servidor). Um conjunto de accountIds. Toda a leitura e
// escrita vai protegida - localStorage pode falhar (modo privado, quota cheia).
const HIDDEN_KEY = STORAGE_KEYS.botHiddenAccounts;
function loadHiddenAccounts(): Set<string> {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.map(String)) : new Set();
  } catch {
    return new Set();
  }
}
function saveHiddenAccounts(set: Set<string>): void {
  try {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify([...set]));
  } catch {
    // localStorage indisponível - a app continua; só não persiste a escolha.
  }
}

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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-zinc-400 dark:text-zinc-500">{label}</dt>
      <dd className="font-mono text-zinc-600 dark:text-zinc-300 break-all">{value}</dd>
    </>
  );
}

function RunRow({ run }: { run: BotRun }) {
  const { t, formatDate, formatTime } = useI18n();
  const [open, setOpen] = useState(false);
  const seconds = run.duration_ms != null ? `${(run.duration_ms / 1000).toFixed(1)}s` : "—";
  // Data + hora completas para o detalhe (o resumo mostra só a data + hora curta).
  const stamp = (v: string) =>
    formatDate(v, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
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
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
            {formatDate(run.started_at)} {formatTime(run.started_at)}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
          {run.read_count} {t("bot.read")} · {run.imported} {t("bot.imported")} · {t("bot.duration")} {seconds}
        </p>
        {run.error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400 break-words font-mono">{run.error}</p>
        )}

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
          aria-expanded={open}
        >
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {open ? t("bot.runLess") : t("bot.runDetails")}
        </button>

        {open && (
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
            <DetailRow label={t("bot.runStarted")} value={stamp(run.started_at)} />
            <DetailRow
              label={t("bot.runDurationExact")}
              value={run.duration_ms != null ? `${run.duration_ms} ms` : "—"}
            />
            <DetailRow label={t("bot.runReadImported")} value={`${run.read_count} / ${run.imported}`} />
            <DetailRow label={t("bot.runRegistered")} value={stamp(run.created_at)} />
            <DetailRow label={t("bot.runId")} value={run.id.slice(0, 8)} />
          </dl>
        )}
      </div>
    </div>
  );
}

// Selo do estado de ativação: ativo (verde), expirado (âmbar) ou por ativar.
// activation ausente (conta sem token guardado) = por ativar.
function ActivationBadge({ activation }: { activation: BotAccountActivation | undefined }) {
  const { t, formatDate } = useI18n();
  if (activation?.active) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <ShieldCheck size={14} />
        {t("bot.act.active")}
        {activation.expiresAt && (
          <span className="text-zinc-400 dark:text-zinc-500 font-normal font-mono">
            · {t("bot.act.expires")} {formatDate(activation.expiresAt)}
          </span>
        )}
      </span>
    );
  }
  if (activation?.expired) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
        <AlertTriangle size={14} />
        {t("bot.act.expired")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
      <KeyRound size={14} />
      {t("bot.act.inactive")}
    </span>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="mt-2 space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
      {items.map((line, i) => (
        <li key={i} className="flex gap-2">
          <span className="shrink-0 font-mono text-emerald-600 dark:text-emerald-400">{i + 1}.</span>
          <span>{line}</span>
        </li>
      ))}
    </ol>
  );
}

// O cartão de ativação de UMA conta Betclic. mode decide a modalidade: desktop
// capta da extensão (com colagem manual como recurso); mobile cola sempre à mão.
// A ativação fica ancorada a esta conta (account.id) - é o que permite ao bot
// etiquetar as apostas importadas na bookie_account certa.
function ActivationCard({
  mode,
  account,
  activation,
  showSteps,
  hidden,
  onToggleHidden,
  onChanged,
}: {
  mode: BotMode;
  account: BookieAccount;
  activation: BotAccountActivation | undefined;
  showSteps: boolean;
  hidden: boolean;
  onToggleHidden: (accountId: string) => void;
  onChanged: () => void;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [paste, setPaste] = useState("");

  const send = useCallback(
    async (token: string, source: BotActivationSource) => {
      setBusy(true);
      setMsg(null);
      try {
        await activateBot(token, source, account.id);
        setPaste("");
        setMsg({ ok: true, text: t("bot.act.saved") });
        onChanged();
      } catch (e) {
        setMsg({ ok: false, text: messageOf(e, t, "bot.act.errGeneric") });
      } finally {
        setBusy(false);
      }
    },
    [t, onChanged, account.id],
  );

  const capture = useCallback(async () => {
    setBusy(true);
    setMsg(null);
    const got = await requestBetclicToken();
    if (!got?.token) {
      setMsg({ ok: false, text: t("bot.act.errNoToken") });
      setBusy(false);
      return;
    }
    await send(got.token, "extension");
  }, [send, t]);

  const remove = useCallback(async () => {
    setBusy(true);
    setMsg(null);
    try {
      await deactivateBot(account.id);
      setMsg({ ok: true, text: t("bot.act.deactivated") });
      onChanged();
    } catch (e) {
      setMsg({ ok: false, text: messageOf(e, t, "bot.act.errGeneric") });
    } finally {
      setBusy(false);
    }
  }, [t, onChanged, account.id]);

  const steps =
    mode === "desktop"
      ? [t("bot.act.stepDesktop1"), t("bot.act.stepDesktop2"), t("bot.act.stepDesktop3")]
      : [t("bot.act.stepMobile1"), t("bot.act.stepMobile2"), t("bot.act.stepMobile3")];

  return (
    <div className={`${CARD} px-4 py-4 space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-display truncate">
            {account.label}
          </h2>
          {account.username && (
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono truncate">@{account.username}</p>
          )}
          <div className="mt-1">
            <ActivationBadge activation={activation} />
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onToggleHidden(account.id)}
            className={ICON_BUTTON}
            title={hidden ? t("bot.act.unhide") : t("bot.act.hide")}
            aria-label={hidden ? t("bot.act.unhide") : t("bot.act.hide")}
          >
            {hidden ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          {activation?.active && (
            <button type="button" onClick={() => void remove()} className={GHOST_BUTTON} disabled={busy}>
              <Trash2 size={14} />
              {t("bot.act.deactivate")}
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("bot.act.subtitle")}</p>

      {mode === "desktop" && (
        <button type="button" onClick={() => void capture()} className={PRIMARY_BUTTON} disabled={busy}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <DownloadCloud size={15} />}
          {t("bot.act.captureBtn")}
        </button>
      )}

      {/* Colagem manual: única via no mobile; recurso no desktop. */}
      <div className="space-y-2">
        {mode === "desktop" && (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {t("bot.act.orPaste")}
          </p>
        )}
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder={t("bot.act.pastePlaceholder")}
          rows={3}
          spellCheck={false}
          className="w-full rounded-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-700 dark:text-zinc-300 resize-y focus:outline-none focus:border-emerald-500/50"
        />
        <button
          type="button"
          onClick={() => void send(paste.trim(), "manual")}
          className={PRIMARY_BUTTON}
          disabled={busy || paste.trim().length === 0}
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
          {t("bot.act.submit")}
        </button>
      </div>

      {msg && (
        <p className={`text-xs ${msg.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
          {msg.text}
        </p>
      )}

      {showSteps && (
        <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {t("bot.act.howTitle")}
          </p>
          <Steps items={steps} />
        </div>
      )}
    </div>
  );
}

// É uma conta da Betclic? (o bot só faz Betclic; o id da casa é "betclic".)
function isBetclic(account: BookieAccount): boolean {
  return account.bookmaker.trim().toLowerCase() === "betclic";
}

// Quantas passagens mostrar antes do «Ver mais».
const INITIAL_RUNS = 5;

export default function BotPanel({ mode = "desktop" }: { mode?: BotMode }) {
  const { t, formatDate } = useI18n();
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [accounts, setAccounts] = useState<BookieAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(() => loadHiddenAccounts());
  const [showHidden, setShowHidden] = useState(false);
  const [showAllRuns, setShowAllRuns] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [st, accs] = await Promise.all([fetchBotStatus(), fetchAccounts()]);
      setStatus(st);
      setAccounts(accs);
    } catch {
      setError(t("bot.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  // Esconder/repor um cartão de conta: só apresentação, persistido por-visor.
  const toggleHidden = useCallback((accountId: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) next.delete(accountId);
      else next.add(accountId);
      saveHiddenAccounts(next);
      return next;
    });
  }, []);

  // Uma ativação por conta, indexada por accountId para casar com cada cartão.
  const activationByAccount = new Map<string, BotAccountActivation>(
    (status?.activations ?? []).map((a) => [a.accountId, a]),
  );
  const betclicAccounts = accounts.filter(isBetclic);
  const visibleAccounts = betclicAccounts.filter((a) => !hidden.has(a.id));
  const hiddenAccounts = betclicAccounts.filter((a) => hidden.has(a.id));

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
          {!status.configured ? (
            <div className={`${CARD} px-4 py-4`}>
              <p className="text-xs text-amber-600 dark:text-amber-400">{t("bot.act.serverOff")}</p>
            </div>
          ) : betclicAccounts.length === 0 ? (
            <div className={`${CARD} px-4 py-6 text-sm text-zinc-500 dark:text-zinc-400 text-center`}>
              {t("bot.act.noAccounts")}
            </div>
          ) : (
            <div className="space-y-3">
              {visibleAccounts.map((account, i) => (
                <ActivationCard
                  key={account.id}
                  mode={mode}
                  account={account}
                  activation={activationByAccount.get(account.id)}
                  showSteps={i === 0}
                  hidden={false}
                  onToggleHidden={toggleHidden}
                  onChanged={() => void load()}
                />
              ))}

              {visibleAccounts.length === 0 && (
                <div className={`${CARD} px-4 py-6 text-sm text-zinc-500 dark:text-zinc-400 text-center`}>
                  {t("bot.act.allHidden")}
                </div>
              )}

              {hiddenAccounts.length > 0 && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowHidden((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                    aria-expanded={showHidden}
                  >
                    {showHidden ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {t("bot.act.hiddenSection", { n: hiddenAccounts.length })}
                  </button>
                  {showHidden &&
                    hiddenAccounts.map((account) => (
                      <ActivationCard
                        key={account.id}
                        mode={mode}
                        account={account}
                        activation={activationByAccount.get(account.id)}
                        showSteps={false}
                        hidden={true}
                        onToggleHidden={toggleHidden}
                        onChanged={() => void load()}
                      />
                    ))}
                </div>
              )}
            </div>
          )}

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
                {(showAllRuns ? status.runs : status.runs.slice(0, INITIAL_RUNS)).map((run) => (
                  <RunRow key={run.id} run={run} />
                ))}
                {status.runs.length > INITIAL_RUNS && (
                  <button
                    type="button"
                    onClick={() => setShowAllRuns((v) => !v)}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                    aria-expanded={showAllRuns}
                  >
                    {showAllRuns ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {showAllRuns
                      ? t("bot.showLess")
                      : t("bot.showMore", { n: status.runs.length - INITIAL_RUNS })}
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
