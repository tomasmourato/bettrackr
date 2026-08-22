// src/mobile/screens/MobileSettings.tsx
// Definições mobile em estilo "definições Android": listas agrupadas por
// secção (preferências, contas, dados, sobre, auditoria). Reutiliza a mesma
// lógica do desktop — dataTransfer.ts para CSV/backup e os handlers do
// ShellProps para o resto. Ações destrutivas confirmam em bottom sheet.

import { useEffect, useRef, useState } from "react";
import {
  Download,
  Upload,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  History,
  Wallet,
  Plus,
  Pencil,
  X,
  Info,
  Building2,
  Check,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { Preferences, AuditLog, Bet, BookieAccount, ThemeMode, Language } from "../../types";
import { AVAILABLE_BOOKMAKERS } from "../../utils";
import { exportBetsCSV, exportBackupJSON, importBetsFromFile } from "../../lib/dataTransfer";
import { getBundleVersion, initLiveUpdate } from "../../lib/liveUpdate";
import { isNativeApp } from "../../lib/apiBase";
import { fetchSettings, updateEnabledBookmakers, SUPPORTED_BOOKMAKERS } from "../../lib/settingsApi";
import { bookmakerLabel } from "../../lib/bookmakers";
import { useI18n } from "../../lib/i18n";
import { useChangePassword } from "../../hooks/useChangePassword";
import type { BillingStatus } from "../../lib/billingApi";
import { MobileSubscriptionCard } from "../components/MobileSubscription";
import {
  SectionHeader,
  ListGroup,
  ListItem,
  MobileCard,
  BottomSheet,
  Pressable,
  ChipGroup,
  useToast,
} from "../ui";

interface MobileSettingsProps {
  preferences: Preferences;
  auditLogs: AuditLog[];
  bets: Bet[];
  currency: string;
  onUpdatePreferences: (prefs: Preferences) => void;
  onClearData: () => void | Promise<void>;
  onResetDemoData: () => void | Promise<void>;
  onImportCSV: (bets: Bet[]) => void;
  accounts: BookieAccount[];
  accountsError: string | null;
  clearAccountsError: () => void;
  onAddAccount: (bookmaker: string, label: string, username?: string | null) => Promise<BookieAccount | null>;
  onRenameAccount: (id: string, label: string, username?: string | null) => Promise<BookieAccount | null>;
  onDeleteAccount: (id: string) => Promise<boolean>;
  // Subscrição (gerida no App para ser partilhada com os ecrãs pagos)
  subscription: BillingStatus | null;
  subscriptionLoading: boolean;
  refreshSubscription: () => Promise<void>;
  // Mudar a password fala com a API: uma sessão morta tem de subir ao App.
  onSessionExpired: () => void;
}

const inputClasses =
  "w-full h-11 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-base text-zinc-800 dark:text-zinc-100 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-emerald-500";

export default function MobileSettings({
  preferences,
  auditLogs,
  bets,
  currency,
  onUpdatePreferences,
  onClearData,
  onResetDemoData,
  onImportCSV,
  accounts,
  accountsError,
  clearAccountsError,
  onAddAccount,
  onRenameAccount,
  onDeleteAccount,
  subscription,
  subscriptionLoading,
  refreshSubscription,
  onSessionExpired,
}: MobileSettingsProps) {
  const { t } = useI18n();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preferências locais (moeda/casa/stake gravam com "Guardar", como no desktop).
  const [localCurrency, setLocalCurrency] = useState(preferences.currency);
  const [localBookmaker, setLocalBookmaker] = useState(preferences.defaultBookmaker);
  const [localStake, setLocalStake] = useState(preferences.defaultStake.toString());

  // Sheets
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Mesmas regras do cartão do desktop — o hook é o mesmo.
  const password = useChangePassword(onSessionExpired);

  const closePassword = () => {
    setPasswordOpen(false);
    setPasswordVisible(false);
    password.reset();
  };

  // Gestão de contas (dentro da sheet).
  const [newAccountBookmaker, setNewAccountBookmaker] = useState(AVAILABLE_BOOKMAKERS[0] || "Betano");
  const [newAccountLabel, setNewAccountLabel] = useState("");
  const [newAccountUsername, setNewAccountUsername] = useState("");
  const [renamingAccount, setRenamingAccount] = useState<BookieAccount | null>(null);
  const [renameLabel, setRenameLabel] = useState("");
  const [renameUsername, setRenameUsername] = useState("");

  // Casas de apostas ativas (partilhadas com a extensão via /api/settings) —
  // paridade com o EnabledBookmakersCard do desktop.
  const [supportedBookmakers, setSupportedBookmakers] = useState<string[]>([...SUPPORTED_BOOKMAKERS]);
  const [enabledBookmakers, setEnabledBookmakers] = useState<string[]>([]);
  const [bookmakersLoading, setBookmakersLoading] = useState(true);
  const [bookmakersSaving, setBookmakersSaving] = useState(false);

  // Sobre / live update.
  const [bundleVersion, setBundleVersion] = useState<string | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  useEffect(() => {
    void getBundleVersion().then(setBundleVersion);
  }, []);

  // Casas ativas: fallback local aparece já; substitui pela lista do servidor.
  useEffect(() => {
    let alive = true;
    fetchSettings()
      .then((s) => {
        if (!alive) return;
        if (s.supportedBookmakers.length > 0) setSupportedBookmakers(s.supportedBookmakers);
        setEnabledBookmakers(s.enabledBookmakers);
      })
      .catch((err) => {
        if (alive) toast.show(err?.message || t("settings.bookmakers.loadError"), "error");
      })
      .finally(() => {
        if (alive) setBookmakersLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleBookmaker = async (key: string, next: boolean) => {
    const previous = enabledBookmakers;
    const updated = next ? [...enabledBookmakers, key] : enabledBookmakers.filter((k) => k !== key);
    setEnabledBookmakers(updated); // otimista
    setBookmakersSaving(true);
    try {
      const saved = await updateEnabledBookmakers(updated);
      setEnabledBookmakers(saved.enabledBookmakers);
    } catch (err) {
      setEnabledBookmakers(previous); // reverte
      toast.show((err as Error)?.message || t("settings.bookmakers.saveError"), "error");
    } finally {
      setBookmakersSaving(false);
    }
  };

  useEffect(() => {
    if (accountsError) {
      toast.show(accountsError, "error");
      clearAccountsError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountsError]);

  const savePreferences = () => {
    const stakeNum = parseFloat(localStake);
    if (isNaN(stakeNum) || stakeNum < 0) {
      toast.show(t("settings.errors.invalidStake"), "error");
      return;
    }
    onUpdatePreferences({
      ...preferences,
      currency: localCurrency,
      defaultBookmaker: localBookmaker,
      defaultStake: stakeNum,
    });
    toast.show(t("settings.saved"), "success");
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importBetsFromFile(file, accounts, onImportCSV)
      .then((message) => toast.show(message, "success"))
      .catch((err: Error) => toast.show(err.message, "error"));
    e.target.value = "";
  };

  const handleAddAccount = async () => {
    const label = newAccountLabel.trim();
    if (!label) {
      toast.show(t("settings.accounts.nameRequired"), "error");
      return;
    }
    const created = await onAddAccount(newAccountBookmaker, label, newAccountUsername.trim() || null);
    if (created) {
      setNewAccountLabel("");
      setNewAccountUsername("");
      toast.show(t("settings.accounts.added"), "success");
    }
  };

  const handleRename = async () => {
    if (!renamingAccount) return;
    const label = renameLabel.trim();
    if (!label) return;
    const updated = await onRenameAccount(renamingAccount.id, label, renameUsername.trim() || null);
    if (updated) {
      setRenamingAccount(null);
      toast.show(t("settings.accounts.updated"), "success");
    }
  };

  const checkUpdate = async () => {
    setCheckingUpdate(true);
    try {
      await initLiveUpdate();
      toast.show(t("settings.about.checkDone"), "info");
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <div className="space-y-1 pb-4">
      {/* Subscrição — decide o acesso à IA e à extensão */}
      <SectionHeader>{t("billing.title")}</SectionHeader>
      <MobileSubscriptionCard
        status={subscription}
        loading={subscriptionLoading}
        onRefresh={refreshSubscription}
      />

      {/* Preferências gerais */}
      <SectionHeader>{t("settings.general.title")}</SectionHeader>
      <MobileCard className="space-y-4">
        <ChipGroup
          label={t("settings.currency.label")}
          options={[
            { value: "€", label: t("settings.currency.eur") },
            { value: "$", label: t("settings.currency.usd") },
            { value: "£", label: t("settings.currency.gbp") },
            { value: "R$", label: t("settings.currency.brl") },
          ]}
          value={localCurrency}
          onChange={setLocalCurrency}
        />
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
            {t("settings.defaultBookmaker.label")}
          </span>
          <input
            type="text"
            value={localBookmaker}
            onChange={(e) => setLocalBookmaker(e.target.value)}
            className={`mt-1 ${inputClasses}`}
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
            {t("settings.defaultStake.label", { currency })}
          </span>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            value={localStake}
            onChange={(e) => setLocalStake(e.target.value)}
            className={`mt-1 ${inputClasses}`}
          />
        </label>
        <Pressable
          as="button"
          onClick={savePreferences}
          className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold text-center"
        >
          {t("settings.save")}
        </Pressable>
      </MobileCard>

      {/* Aparência (aplica de imediato, como no desktop) */}
      <SectionHeader>{t("settings.appearance.title")}</SectionHeader>
      <MobileCard className="space-y-4">
        <ChipGroup
          label={t("settings.theme.label")}
          options={[
            { value: "light", label: t("theme.light") },
            { value: "dark", label: t("theme.dark") },
            { value: "system", label: t("theme.system") },
          ]}
          value={preferences.theme}
          onChange={(v) => onUpdatePreferences({ ...preferences, theme: v as ThemeMode })}
        />
        <ChipGroup
          label={t("settings.language.title")}
          options={[
            { value: "pt", label: t("lang.pt") },
            { value: "en", label: t("lang.en") },
          ]}
          value={preferences.language}
          onChange={(v) => onUpdatePreferences({ ...preferences, language: v as Language })}
        />
      </MobileCard>

      {/* Casas de apostas ativas (partilhadas com a extensão) */}
      <SectionHeader>{t("settings.bookmakers.title")}</SectionHeader>
      <MobileCard className="space-y-3">
        <div className="flex items-start gap-2">
          <Building2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("settings.bookmakers.desc")}
          </p>
        </div>
        {bookmakersLoading ? (
          <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 py-2">
            <RefreshCw size={14} className="animate-spin" /> {t("common.loading")}
          </div>
        ) : (
          <div className="space-y-2">
            {supportedBookmakers.map((key) => {
              const checked = enabledBookmakers.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => void toggleBookmaker(key, !checked)}
                  disabled={bookmakersSaving}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors disabled:opacity-60 ${
                    checked
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900"
                      : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-5 h-5 rounded-md border shrink-0 ${
                      checked
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600"
                    }`}
                  >
                    {checked && <Check size={13} strokeWidth={3} />}
                  </span>
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{bookmakerLabel(key)}</span>
                </button>
              );
            })}
          </div>
        )}
        {!bookmakersLoading && enabledBookmakers.length === 0 && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            {t("settings.bookmakers.none")}
          </p>
        )}
      </MobileCard>

      {/* Contas + auditoria */}
      <SectionHeader>{t("settings.management.title")}</SectionHeader>
      <ListGroup>
        <ListItem
          icon={KeyRound}
          title={t("settings.password.title")}
          subtitle={t("settings.password.hint")}
          chevron
          onClick={() => setPasswordOpen(true)}
        />
        <ListItem
          icon={Wallet}
          title={t("settings.accounts.title")}
          subtitle={t("settings.accounts.count", { n: accounts.length })}
          chevron
          onClick={() => setAccountsOpen(true)}
        />
        <ListItem
          icon={History}
          title={t("settings.audit.title")}
          subtitle={t("settings.audit.count", { n: auditLogs.length })}
          chevron
          onClick={() => setLogsOpen(true)}
        />
      </ListGroup>

      {/* Dados */}
      <SectionHeader>{t("settings.data.title")}</SectionHeader>
      <ListGroup>
        <ListItem
          icon={FileSpreadsheet}
          title={t("settings.export.csv.title")}
          subtitle={bets.length === 0 ? t("settings.export.empty") : t("settings.export.csv.desc")}
          onClick={() => {
            if (bets.length === 0) return toast.show(t("settings.export.emptyToast"), "info");
            void exportBetsCSV(bets, accounts);
          }}
        />
        <ListItem
          icon={Download}
          title={t("settings.export.backup.title")}
          subtitle={t("settings.export.backup.desc")}
          onClick={() => {
            if (bets.length === 0) return toast.show(t("settings.export.emptyToast"), "info");
            void exportBackupJSON(bets, preferences);
          }}
        />
        <ListItem icon={Upload} title={t("settings.import.title")} subtitle={t("settings.import.desc")} onClick={() => fileInputRef.current?.click()} />
      </ListGroup>
      <input ref={fileInputRef} type="file" accept=".csv,.json,text/csv,application/json" onChange={handleImportFile} className="hidden" />

      {/* Zona perigosa */}
      <SectionHeader>{t("settings.danger.title")}</SectionHeader>
      <ListGroup>
        <ListItem icon={RefreshCw} title={t("settings.demo.title")} subtitle={t("settings.demo.desc")} onClick={() => setConfirmReset(true)} />
        <ListItem icon={Trash2} title={t("settings.clear.title")} subtitle={t("settings.clear.desc")} destructive onClick={() => setConfirmClear(true)} />
      </ListGroup>

      {/* Sobre */}
      <SectionHeader>{t("settings.about.title")}</SectionHeader>
      <ListGroup>
        <ListItem
          icon={Info}
          title={t("settings.about.version")}
          trailing={bundleVersion ?? (isNativeApp() ? "…" : "web")}
        />
        {isNativeApp() && (
          <ListItem
            icon={RefreshCw}
            title={checkingUpdate ? t("settings.about.checking") : t("settings.about.checkUpdate")}
            subtitle={t("settings.about.checkUpdateDesc")}
            onClick={checkingUpdate ? undefined : () => void checkUpdate()}
          />
        )}
      </ListGroup>

      {/* Sheet: mudar a palavra-passe */}
      <BottomSheet open={passwordOpen} onClose={closePassword} title={t("settings.password.title")}>
        <div className="space-y-3 pb-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("settings.password.desc")}</p>

          {password.error && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{password.error}</p>
          )}

          <div className="space-y-2">
            <input
              className={inputClasses}
              type={passwordVisible ? "text" : "password"}
              autoComplete="current-password"
              placeholder={t("settings.password.current")}
              aria-label={t("settings.password.current")}
              value={password.current}
              onChange={(e) => password.setCurrent(e.target.value)}
            />
            <input
              className={inputClasses}
              type={passwordVisible ? "text" : "password"}
              autoComplete="new-password"
              placeholder={t("settings.password.new")}
              aria-label={t("settings.password.new")}
              value={password.next}
              onChange={(e) => password.setNext(e.target.value)}
            />
            <input
              className={inputClasses}
              type={passwordVisible ? "text" : "password"}
              autoComplete="new-password"
              placeholder={t("settings.password.confirm")}
              aria-label={t("settings.password.confirm")}
              value={password.confirm}
              onChange={(e) => password.setConfirm(e.target.value)}
            />
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{t("settings.password.hint")}</p>
          </div>

          <Pressable
            as="button"
            onClick={() => setPasswordVisible((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400"
          >
            {passwordVisible ? <EyeOff size={14} /> : <Eye size={14} />}
            {passwordVisible ? t("settings.password.hide") : t("settings.password.show")}
          </Pressable>

          <Pressable
            as="button"
            disabled={!password.canSubmit}
            onClick={async () => {
              const ok = await password.submit();
              if (ok) {
                toast.show(t("settings.password.done"), "success");
                closePassword();
              }
            }}
            className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold text-center disabled:opacity-50"
          >
            {password.saving ? t("settings.password.saving") : t("settings.password.submit")}
          </Pressable>

          {/* Dito de propósito: os tokens são JWT sem estado, por isso mudar a
              password aqui não fecha as sessões noutros dispositivos. */}
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{t("settings.password.otherDevices")}</p>
        </div>
      </BottomSheet>

      {/* Sheet: contas por casa */}
      <BottomSheet open={accountsOpen} onClose={() => setAccountsOpen(false)} title={t("settings.accounts.title")}>
        <div className="space-y-4 pb-2">
          {accounts.length > 0 ? (
            <ListGroup>
              {accounts.map((a) => (
                <ListItem
                  key={a.id}
                  title={a.label}
                  subtitle={a.username ? `${a.bookmaker} · @${a.username}` : a.bookmaker}
                  trailing={
                    <span className="flex items-center gap-1">
                      <Pressable
                        as="button"
                        onClick={() => {
                          setRenamingAccount(a);
                          setRenameLabel(a.label);
                          setRenameUsername(a.username ?? "");
                        }}
                        aria-label={t("settings.accounts.renameAria", { label: a.label })}
                        className="p-2 text-zinc-400"
                      >
                        <Pencil size={14} />
                      </Pressable>
                      <Pressable
                        as="button"
                        onClick={async () => {
                          const ok = await onDeleteAccount(a.id);
                          if (ok) toast.show(t("settings.accounts.deleted"), "success");
                        }}
                        aria-label={t("settings.accounts.deleteAria", { label: a.label })}
                        className="p-2 text-rose-500"
                      >
                        <Trash2 size={14} />
                      </Pressable>
                    </span>
                  }
                />
              ))}
            </ListGroup>
          ) : (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-4">
              {t("settings.accounts.empty")}
            </p>
          )}

          {renamingAccount ? (
            <MobileCard className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  {t("settings.accounts.renameTitle", { label: renamingAccount.label })}
                </p>
                <Pressable as="button" onClick={() => setRenamingAccount(null)} aria-label={t("common.cancel")} className="p-1 text-zinc-400">
                  <X size={14} />
                </Pressable>
              </div>
              <input
                type="text"
                value={renameLabel}
                onChange={(e) => setRenameLabel(e.target.value)}
                placeholder={t("settings.accounts.namePlaceholder")}
                className={inputClasses}
              />
              <input
                type="text"
                value={renameUsername}
                onChange={(e) => setRenameUsername(e.target.value)}
                placeholder={t("settings.accounts.usernamePlaceholder")}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className={inputClasses}
              />
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                {t("settings.accounts.usernameHint")}
              </p>
              <Pressable as="button" onClick={handleRename} className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold text-center">
                {t("common.save")}
              </Pressable>
            </MobileCard>
          ) : (
            <MobileCard className="space-y-2">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{t("settings.accounts.new")}</p>
              <select
                value={newAccountBookmaker}
                onChange={(e) => setNewAccountBookmaker(e.target.value)}
                className={inputClasses}
              >
                {AVAILABLE_BOOKMAKERS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newAccountLabel}
                onChange={(e) => setNewAccountLabel(e.target.value)}
                placeholder={t("settings.accounts.labelPlaceholder")}
                className={inputClasses}
              />
              <input
                type="text"
                value={newAccountUsername}
                onChange={(e) => setNewAccountUsername(e.target.value)}
                placeholder={t("settings.accounts.usernamePlaceholder")}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className={inputClasses}
              />
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                {t("settings.accounts.usernameHint")}
              </p>
              <Pressable
                as="button"
                onClick={() => void handleAddAccount()}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
              >
                <Plus size={14} /> {t("settings.accounts.add")}
              </Pressable>
            </MobileCard>
          )}
        </div>
      </BottomSheet>

      {/* Sheet: registo de alterações */}
      <BottomSheet open={logsOpen} onClose={() => setLogsOpen(false)} title={t("settings.audit.title")}>
        <div className="pb-2">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-6">
              {t("settings.audit.empty")}
            </p>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="rounded-lg bg-zinc-100 dark:bg-zinc-800/60 px-3 py-2">
                  <p className="text-[10px] font-bold font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {log.action}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">{log.details}</p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">{log.timestamp}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Confirmações destrutivas */}
      <BottomSheet open={confirmReset} onClose={() => setConfirmReset(false)} title={t("settings.demo.confirmTitle")}>
        <div className="space-y-3 pb-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {t("settings.demo.confirmDesc")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Pressable as="button" onClick={() => setConfirmReset(false)} className="py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-200 text-center">
              {t("common.cancel")}
            </Pressable>
            <Pressable
              as="button"
              onClick={async () => {
                setConfirmReset(false);
                await onResetDemoData();
                toast.show(t("settings.demo.done"), "success");
              }}
              className="py-3 rounded-xl bg-amber-600 text-white text-sm font-semibold text-center"
            >
              {t("settings.demo.confirm")}
            </Pressable>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={confirmClear} onClose={() => setConfirmClear(false)} title={t("settings.clear.confirmTitle")}>
        <div className="space-y-3 pb-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {t("settings.clear.confirmDesc")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Pressable as="button" onClick={() => setConfirmClear(false)} className="py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-200 text-center">
              {t("common.cancel")}
            </Pressable>
            <Pressable
              as="button"
              onClick={async () => {
                setConfirmClear(false);
                await onClearData();
                toast.show(t("settings.clear.done"), "success");
              }}
              className="py-3 rounded-xl bg-rose-600 text-white text-sm font-semibold text-center"
            >
              {t("settings.clear.confirm")}
            </Pressable>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
