import React, { useMemo, useState } from "react";
import { Puzzle, Download, RefreshCw, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useBetclicExtension } from "../hooks/useBetclicExtension";
import { BookieAccount } from "../types";
import { isNativeApp } from "../lib/apiBase";
import { bookmakerLabel } from "../lib/bookmakers";
import { useI18n, type TFn } from "../lib/i18n";

// Casas suportadas pela extensão; a chave (minúsculas) é a usada pelo service
// worker da extensão para identificar cada fonte. O rótulo vem do registo
// central (bookmakerLabel).
const EXTENSION_BOOKIE_KEYS = ["betclic", "betano", "solverde"];
const EXTENSION_BOOKIES = EXTENSION_BOOKIE_KEYS.map((key) => ({ key, label: bookmakerLabel(key) }));

// Última conta escolhida por casa, para não ter de escolher sempre.
const ACCOUNT_CHOICE_KEY = "gestordebets_import_accounts";

function loadAccountChoices(): Record<string, string> {
  try {
    const raw = localStorage.getItem(ACCOUNT_CHOICE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

// Quando (se) a extensão for publicada na Chrome Web Store, mete aqui o link e
// o botão de instalação passa a apontar para lá.
const WEBSTORE_URL: string | null = null;

// Zip só da extensão, gerado no build e servido pelo próprio app
// (scripts/zip-extension.mjs -> dist/bettrackr-extension.zip). O utilizador
// descarrega apenas a extensão, não o projeto todo.
const EXTENSION_DOWNLOAD_URL: string | null = "/bettrackr-extension.zip";

function importSummary(t: TFn, result: {
  imported?: number;
  updated?: number;
  skipped?: number;
  unsupported?: number;
  sourceResults?: Record<string, { ok: boolean; imported?: number; updated?: number; skipped?: number; unsupported?: number; error?: string }>;
}) {
  const parts = (item: { imported?: number; updated?: number; skipped?: number; unsupported?: number }) =>
    [
      t("ext.summary.imported", { n: item.imported || 0 }),
      item.updated ? t("ext.summary.updated", { n: item.updated }) : "",
      item.skipped ? t("ext.summary.skipped", { n: item.skipped }) : "",
      item.unsupported ? t("ext.summary.unsupported", { n: item.unsupported }) : "",
    ].filter(Boolean).join(" · ");

  const sources = Object.entries(result.sourceResults || {});
  if (sources.length === 0) return `${parts(result)}.`;
  return sources.map(([source, item]) => {
    const label = bookmakerLabel(source);
    if (!item.ok) return `${label}: ${item.error || t("ext.unavailable")}`;
    return `${label}: ${parts(item)}`;
  }).join(" · ");
}

// Passos de instalação manual — reutilizados no estado "não instalada" e no
// bloco "reinstalar", para que as instruções estejam SEMPRE acessíveis no app.
function InstallSteps() {
  const { t } = useI18n();
  if (WEBSTORE_URL) {
    return (
      <a
        href={WEBSTORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2.5 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
      >
        <Download size={14} /> {t("ext.webstore")}
      </a>
    );
  }

  return (
    <div className="space-y-3">
      {EXTENSION_DOWNLOAD_URL && (
        <a
          href={EXTENSION_DOWNLOAD_URL}
          download="bettrackr-extension.zip"
          className="px-3.5 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
        >
          <Download size={14} /> {t("ext.download")}
        </a>
      )}
      <ol className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1.5 list-decimal list-inside">
        <li>{t("ext.step1")}</li>
        <li>{t("ext.step2")}</li>
        <li>{t("ext.step3")}</li>
        <li>{t("ext.step4")}</li>
        <li>{t("ext.step5")}</li>
      </ol>
      <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
        {t("ext.securityNote")}
      </p>
    </div>
  );
}

interface BetclicImportProps {
  accounts?: BookieAccount[];
  // Casas ativas escolhidas nas definições; só estas aparecem/importam. Ausente
  // (ainda a carregar) = mostra todas as suportadas.
  enabledBookmakers?: string[];
}

export default function BetclicImport({ accounts = [], enabledBookmakers }: BetclicImportProps) {
  const { t } = useI18n();
  const { installed, version, importing, progress, result, runImport, recheck } = useBetclicExtension();

  // Na app nativa (Android) não existem extensões de browser — o cartão
  // inteiro seria só instruções impossíveis de seguir. A importação por
  // extensão continua disponível na versão web/desktop.
  if (isNativeApp()) return null;

  const [accountChoices, setAccountChoices] = useState<Record<string, string>>(loadAccountChoices);

  // Só as casas ativas (ou todas, enquanto a seleção não chega).
  const bookies = useMemo(
    () => (enabledBookmakers ? EXTENSION_BOOKIES.filter((b) => enabledBookmakers.includes(b.key)) : EXTENSION_BOOKIES),
    [enabledBookmakers]
  );

  // Contas disponíveis por casa da extensão (label da casa -> lista).
  const accountsByBookie = useMemo(() => {
    const map = new Map<string, BookieAccount[]>();
    for (const { key, label } of bookies) {
      map.set(key, accounts.filter((account) => account.bookmaker === label));
    }
    return map;
  }, [accounts, bookies]);

  const hasAccountChoices = bookies.some(({ key }) => (accountsByBookie.get(key) || []).length > 0);

  const chooseAccount = (bookie: string, accountId: string) => {
    setAccountChoices((prev) => {
      const next = { ...prev, [bookie]: accountId };
      if (!accountId) delete next[bookie];
      try { localStorage.setItem(ACCOUNT_CHOICE_KEY, JSON.stringify(next)); } catch { /* storage cheio/indisponível */ }
      return next;
    });
  };

  const handleImport = () => {
    // Só envia escolhas válidas (conta ainda existente e da casa certa).
    const accountIds: Record<string, string> = {};
    for (const { key } of bookies) {
      const chosen = accountChoices[key];
      if (chosen && (accountsByBookie.get(key) || []).some((account) => account.id === chosen)) {
        accountIds[key] = chosen;
      }
    }
    runImport(accountIds);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-sm p-5 border border-zinc-200 dark:border-zinc-800 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display flex items-center gap-2">
          <Puzzle size={18} className="text-emerald-600 dark:text-emerald-400" /> {t("ext.title")}
        </h4>
        {installed === true && (
          <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider border border-emerald-200 dark:border-emerald-900">
            {t("ext.active")}{version ? ` · v${version}` : ""}
          </span>
        )}
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        {t("ext.desc")}
      </p>

      {/* A verificar */}
      {installed === null && (
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <RefreshCw size={14} className="animate-spin" /> {t("ext.searching")}
        </div>
      )}

      {/* Instalada -> botão de importar */}
      {installed === true && (
        <div className="space-y-3">
          {/* Escolha da conta de destino por casa (só se existirem contas) */}
          {hasAccountChoices && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {bookies.map(({ key, label }) => {
                const options = accountsByBookie.get(key) || [];
                if (options.length === 0) return null;
                const selected = accountChoices[key] && options.some((account) => account.id === accountChoices[key])
                  ? accountChoices[key]
                  : "";
                return (
                  <label key={key} className="block">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
                      {t("ext.account", { bookmaker: label })}
                    </span>
                    <select
                      value={selected}
                      onChange={(e) => chooseAccount(key, e.target.value)}
                      className="w-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-sm px-2.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="">{t("filters.noAccount")}</option>
                      {options.map((account) => (
                        <option key={account.id} value={account.id}>{account.label}</option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={importing}
            className="px-4 py-2.5 rounded-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {importing ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
            {importing ? t("ext.importing") : t("ext.importAll")}
          </button>

          {importing && progress && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 animate-pulse">{progress}</p>
          )}

          {result && result.ok && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 rounded-sm border border-emerald-200 dark:border-emerald-900 flex items-center gap-2 text-xs font-medium">
              <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                {(Object.keys(result.sourceResults || {}).length > 0 ||
                  (result.imported || 0) > 0 || (result.updated || 0) > 0 || (result.unsupported || 0) > 0)
                  ? importSummary(t, result)
                  : result.skipped
                    ? t("ext.nothingNewSkipped", { n: result.skipped })
                    : t("ext.nothingNew")}
              </span>
            </div>
          )}

          {result && !result.ok && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 rounded-sm border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-xs font-medium">
              <AlertCircle size={14} className="text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{result.error || t("ext.importFailed")}</span>
            </div>
          )}

          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            {t("ext.beforeImport")}
          </p>

          {/* Instruções continuam acessíveis mesmo com a extensão instalada. */}
          <details className="pt-1">
            <summary className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 cursor-pointer">
              {t("ext.reinstall")}
            </summary>
            <div className="mt-3">
              <InstallSteps />
            </div>
          </details>
        </div>
      )}

      {/* Não instalada -> instruções em destaque */}
      {installed === false && (
        <div className="space-y-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 rounded-sm border border-amber-200 dark:border-amber-900 text-xs font-medium">
            {t("ext.notDetected")}
          </div>

          <InstallSteps />

          <button
            onClick={recheck}
            className="px-3.5 py-2 rounded-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowRight size={13} /> {t("ext.recheck")}
          </button>
        </div>
      )}
    </div>
  );
}
