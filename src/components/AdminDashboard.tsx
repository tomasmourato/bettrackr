// src/components/AdminDashboard.tsx
// Painel de gestão (desktop): números do negócio, lista de contas com
// pesquisa e filtros, e as ações sobre cada conta. O equivalente mobile vive
// em src/mobile/screens/MobileAdmin.tsx e usa o mesmo useAdminPanel().

import { useState } from "react";
import {
  Gift,
  Hourglass,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  X,
} from "lucide-react";

import { useAdminPanel } from "../hooks/useAdminPanel";
import type { AdminUser } from "../lib/adminApi";
import { ACCESS_KEY, accessTone, auditLine, FILTERS, isProtected } from "../lib/adminDisplay";
import { formatPrice, useI18n } from "../lib/i18n";

const TONE: Record<"ok" | "warn" | "off", string> = {
  ok: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  warn: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  off: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

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

interface AdminDashboardProps {
  /** Relê a subscrição do próprio utilizador depois de uma alteração. */
  onAccessChanged: () => void;
}

export default function AdminDashboard({ onAccessChanged }: AdminDashboardProps) {
  const { t, lang, formatNumber, formatDate } = useI18n();
  const panel = useAdminPanel(onAccessChanged);
  const [granting, setGranting] = useState<AdminUser | null>(null);
  const [trialing, setTrialing] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [revoking, setRevoking] = useState<AdminUser | null>(null);

  const { overview } = panel;
  const firstOnPage = panel.total === 0 ? 0 : (panel.page - 1) * panel.pageSize + 1;
  const lastOnPage = Math.min(panel.page * panel.pageSize, panel.total);

  return (
    <div className="space-y-5" id="admin-tab">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">
            {t("admin.title")}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{t("admin.subtitle")}</p>
        </div>
        <button onClick={() => void panel.reload()} disabled={panel.loading} className={`${GHOST_BUTTON} text-xs`}>
          <RefreshCw size={13} className={panel.loading ? "animate-spin" : ""} /> {t("admin.retry")}
        </button>
      </div>

      {panel.error && (
        <div className="p-3 rounded-sm border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center justify-between gap-2">
          <span>{panel.error}</span>
          <button onClick={panel.clearError} className="p-1 cursor-pointer" aria-label={t("admin.action.close")}>
            <X size={13} />
          </button>
        </div>
      )}

      {/* Números do topo */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
          <Metric label={t("admin.metric.users")} value={formatNumber(overview.users)} />
          <Metric label={t("admin.metric.entitled")} value={formatNumber(overview.entitled)} />
          <Metric label={t("admin.metric.paying")} value={formatNumber(overview.paying)} />
          <Metric label={t("admin.metric.trial")} value={formatNumber(overview.on_trial)} />
          <Metric label={t("admin.metric.granted")} value={formatNumber(overview.granted)} />
          <Metric label={t("admin.metric.mrr")} value={formatPrice(lang, overview.mrr_cents, overview.currency)} />
          <Metric label={t("admin.metric.newUsers")} value={formatNumber(overview.new_users_30d)} />
          <Metric label={t("admin.metric.pastDue")} value={formatNumber(overview.past_due)} />
          <Metric label={t("admin.metric.admins")} value={formatNumber(overview.admins)} />
          <Metric label={t("admin.metric.bets")} value={formatNumber(overview.bets)} />
        </div>
      )}

      {/* Utilizadores */}
      <div className={`${CARD} p-5 space-y-4`}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">
            {t("admin.users.title")}
          </h4>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={panel.search}
              onChange={(e) => panel.setSearch(e.target.value)}
              placeholder={t("admin.users.searchPlaceholder")}
              className="h-8 pl-8 pr-3 w-64 max-w-full rounded-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(({ value, key }) => (
            <button
              key={value}
              onClick={() => panel.setFilter(value)}
              className={`px-2.5 py-1 rounded-sm text-[11px] font-semibold transition-colors cursor-pointer border ${
                panel.filter === value
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-emerald-500/40"
              }`}
            >
              {t(key)}
            </button>
          ))}
        </div>

        {panel.loading && panel.users.length === 0 ? (
          <p className="py-10 text-center text-xs text-zinc-400 dark:text-zinc-500 font-mono flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" /> {t("admin.loading")}
          </p>
        ) : panel.users.length === 0 ? (
          <p className="py-10 text-center text-xs text-zinc-400 dark:text-zinc-500">{t("admin.users.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {panel.users.map((user) => {
                  const busy = panel.busyUserId === user.id;
                  return (
                    <tr key={user.id} className="align-top">
                      <td className="py-3 pr-3 min-w-[12rem]">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {user.username ?? "—"}
                        </p>
                        <p className="text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">
                          {t("admin.users.joined", { date: formatDate(user.createdAt) })} ·{" "}
                          {t("admin.users.betsCount", { count: user.betsCount })}
                        </p>
                      </td>
                      <td className="py-3 pr-3 whitespace-nowrap">
                        {/* Um administrador já aparece como "Administrador" no
                            crachá de acesso — repetir o papel ao lado só punha
                            a mesma palavra duas vezes. O fundador é a exceção:
                            aí o papel diz algo que o acesso não diz. */}
                        <span
                          className={`px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider font-mono ${TONE[accessTone(user)]}`}
                        >
                          {isProtected(user) ? t("admin.role.founder") : t(ACCESS_KEY[user.accessSource])}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button
                            onClick={() => setGranting(user)}
                            disabled={busy}
                            className={`${GHOST_BUTTON} text-[11px]`}
                          >
                            <Gift size={12} /> {t("admin.action.grant")}
                          </button>
                          {user.subscription && user.subscription.status !== "canceled" && (
                            <button
                              onClick={() => setRevoking(user)}
                              disabled={busy}
                              className={`${GHOST_BUTTON} text-[11px]`}
                            >
                              {t("admin.action.revoke")}
                            </button>
                          )}
                          <button
                            onClick={() => setTrialing(user)}
                            disabled={busy}
                            className={`${GHOST_BUTTON} text-[11px]`}
                          >
                            <Hourglass size={12} /> {t("admin.action.trial")}
                          </button>
                          {/* Num fundador estes dois botões não existem: o
                              servidor recusa-os na mesma (409), mas mostrá-los
                              só convidava ao erro. */}
                          {!isProtected(user) && (
                            <>
                              <button
                                onClick={() => void (user.role === "admin" ? panel.demote(user) : panel.promote(user))}
                                disabled={busy}
                                className={`${GHOST_BUTTON} text-[11px]`}
                              >
                                {user.role === "admin" ? <ShieldOff size={12} /> : <ShieldCheck size={12} />}
                                {user.role === "admin" ? t("admin.action.demote") : t("admin.action.promote")}
                              </button>
                              <button
                                onClick={() => setDeleting(user)}
                                disabled={busy}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Trash2 size={12} /> {t("admin.action.delete")}
                              </button>
                            </>
                          )}
                          {busy && <Loader2 size={13} className="animate-spin text-zinc-400 self-center" />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className="font-mono">
            {t("admin.users.showing", { shown: `${firstOnPage}–${lastOnPage}`, total: panel.total })}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => panel.setPage(panel.page - 1)}
              disabled={panel.page <= 1}
              className={GHOST_BUTTON}
            >
              {t("admin.users.previous")}
            </button>
            <button
              onClick={() => panel.setPage(panel.page + 1)}
              disabled={lastOnPage >= panel.total}
              className={GHOST_BUTTON}
            >
              {t("admin.users.next")}
            </button>
          </div>
        </div>
      </div>

      {/* Registo de alterações */}
      <div className={`${CARD} p-5`}>
        <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display mb-3">
          {t("admin.audit.title")}
        </h4>
        {panel.audit.length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">{t("admin.audit.empty")}</p>
        ) : (
          <ul className="space-y-2 text-xs">
            {panel.audit.map((entry) => (
              <li key={entry.id} className="flex items-baseline justify-between gap-3">
                <span className="text-zinc-600 dark:text-zinc-300">{auditLine(entry, t)}</span>
                <span className="shrink-0 text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                  {formatDate(entry.createdAt, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {granting && (
        <GrantDialog
          user={granting}
          onClose={() => setGranting(null)}
          onSubmit={async (months, note) => {
            const ok = await panel.grant(granting, months, note);
            if (ok) setGranting(null);
          }}
        />
      )}
      {trialing && (
        <TrialDialog
          user={trialing}
          onClose={() => setTrialing(null)}
          onSubmit={async (days) => {
            const ok = await panel.setTrial(trialing, days);
            if (ok) setTrialing(null);
          }}
        />
      )}
      {revoking && (
        <RevokeDialog
          user={revoking}
          onClose={() => setRevoking(null)}
          onConfirm={async () => {
            const ok = await panel.revoke(revoking);
            if (ok) setRevoking(null);
          }}
        />
      )}
      {deleting && (
        <DeleteDialog
          user={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            const ok = await panel.remove(deleting);
            if (ok) setDeleting(null);
          }}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Diálogos
// ------------------------------------------------------------
const INPUT =
  "w-full h-9 px-3 rounded-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs outline-none focus:border-emerald-500";
const PRIMARY =
  "px-3 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-60";
const DANGER =
  "px-3 py-2 rounded-sm bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-60";

function Dialog({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4">
      <div className={`${CARD} w-full max-w-sm p-5 space-y-4`}>
        <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-display">{title}</h5>
        {children}
      </div>
    </div>
  );
}

function GrantDialog({
  user,
  onClose,
  onSubmit,
}: {
  user: AdminUser;
  onClose: () => void;
  onSubmit: (months: number, note?: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const [months, setMonths] = useState("1");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <Dialog title={t("admin.grant.title", { user: user.username ?? user.email })}>
      <label className="block space-y-1">
        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">{t("admin.grant.months")}</span>
        <input type="number" min={0} max={60} value={months} onChange={(e) => setMonths(e.target.value)} className={INPUT} />
        <span className="block text-[10px] text-zinc-400 dark:text-zinc-500">{t("admin.grant.forever")}</span>
      </label>
      <label className="block space-y-1">
        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">{t("admin.grant.note")}</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("admin.grant.notePlaceholder")}
          className={INPUT}
        />
      </label>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className={`${GHOST_BUTTON} text-xs`}>
          {t("admin.cancel")}
        </button>
        <button
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await onSubmit(Number(months) || 0, note.trim() || undefined);
            setSaving(false);
          }}
          className={PRIMARY}
        >
          {saving ? t("admin.saving") : t("admin.grant.submit")}
        </button>
      </div>
    </Dialog>
  );
}

function TrialDialog({
  user,
  onClose,
  onSubmit,
}: {
  user: AdminUser;
  onClose: () => void;
  onSubmit: (days: number) => Promise<void>;
}) {
  const { t } = useI18n();
  const [days, setDays] = useState("14");
  const [saving, setSaving] = useState(false);

  return (
    <Dialog title={t("admin.trial.title", { user: user.username ?? user.email })}>
      <label className="block space-y-1">
        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">{t("admin.trial.days")}</span>
        <input type="number" min={0} max={3650} value={days} onChange={(e) => setDays(e.target.value)} className={INPUT} />
        <span className="block text-[10px] text-zinc-400 dark:text-zinc-500">{t("admin.trial.hint")}</span>
      </label>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className={`${GHOST_BUTTON} text-xs`}>
          {t("admin.cancel")}
        </button>
        <button
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await onSubmit(Number(days) || 0);
            setSaving(false);
          }}
          className={PRIMARY}
        >
          {saving ? t("admin.saving") : t("admin.trial.submit")}
        </button>
      </div>
    </Dialog>
  );
}

function DeleteDialog({
  user,
  onClose,
  onConfirm,
}: {
  user: AdminUser;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);

  return (
    <Dialog title={t("admin.delete.title", { user: user.username ?? user.email })}>
      <p className="text-xs text-zinc-600 dark:text-zinc-300">{t("admin.delete.body")}</p>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className={`${GHOST_BUTTON} text-xs`}>
          {t("admin.cancel")}
        </button>
        <button
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await onConfirm();
            setSaving(false);
          }}
          className={DANGER}
        >
          {saving ? t("admin.saving") : t("admin.delete.confirm")}
        </button>
      </div>
    </Dialog>
  );
}

function RevokeDialog({
  user,
  onClose,
  onConfirm,
}: {
  user: AdminUser;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const paid = user.subscription?.source === "stripe";

  return (
    <Dialog title={t("admin.revoke.title", { user: user.username ?? user.email })}>
      {/* Numa subscrição paga isto mexe no Stripe, por isso o aviso é outro. */}
      <p className="text-xs text-zinc-600 dark:text-zinc-300">
        {paid ? t("admin.revoke.bodyPaid") : t("admin.revoke.bodyManual")}
      </p>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className={`${GHOST_BUTTON} text-xs`}>
          {t("admin.cancel")}
        </button>
        <button
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await onConfirm();
            setSaving(false);
          }}
          className={DANGER}
        >
          {saving ? t("admin.saving") : t("admin.action.revoke")}
        </button>
      </div>
    </Dialog>
  );
}
