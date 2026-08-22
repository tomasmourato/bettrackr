// src/mobile/screens/MobileAdmin.tsx
// Painel de gestão em mobile. Os mesmos dados e as mesmas ações do desktop
// (useAdminPanel), mas em cartões e bottom sheets: a tabela de contas do
// desktop não cabe num telemóvel, por isso cada conta abre a sua folha de
// ações em vez de mostrar seis botões numa linha.

import { useState } from "react";
import { Eye, Gift, Hourglass, Loader2, RefreshCw, Search, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";

import { useAdminPanel } from "../../hooks/useAdminPanel";
import { fetchMemberBets, type AdminUser } from "../../lib/adminApi";
import type { Bet } from "../../types";
import MobileMemberProfile from "../components/MobileMemberProfile";
import { ACCESS_KEY, accessTone, auditLine, FILTERS, isProtected } from "../../lib/adminDisplay";
import { formatPrice, useI18n } from "../../lib/i18n";
import { BottomSheet, FilterChips, ListGroup, ListItem, MobileCard, Pressable, SectionHeader, SheetPage } from "../ui";

const TONE: Record<"ok" | "warn" | "off", string> = {
  ok: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  warn: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  off: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

const INPUT =
  "w-full h-11 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-base text-zinc-800 dark:text-zinc-100 outline-none focus:border-emerald-500";
const PRIMARY =
  "w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60";
const DANGER =
  "w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-rose-600 text-white text-sm font-semibold disabled:opacity-60";

type Sheet = "actions" | "grant" | "trial" | "revoke" | "delete";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500 font-mono truncate">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-bold text-zinc-900 dark:text-zinc-100 font-display tabular-nums">{value}</p>
    </div>
  );
}

interface MobileAdminProps {
  /** Relê a subscrição do próprio utilizador depois de uma alteração. */
  onAccessChanged: () => void;
  /** Papel de quem está a ver — o perfil de membro é só para o fundador. */
  viewerRole: "user" | "admin" | "founder" | undefined;
  currency: string;
  isDark: boolean;
}

export default function MobileAdmin({ onAccessChanged, viewerRole, currency, isDark }: MobileAdminProps) {
  const { t, lang, formatNumber, formatDate } = useI18n();
  const panel = useAdminPanel(onAccessChanged);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [months, setMonths] = useState("1");
  const [note, setNote] = useState("");
  const [days, setDays] = useState("14");

  // Perfil de um membro. Só o fundador o abre; o servidor recusa aos outros na
  // mesma (requireFounder), isto é só para não mostrar uma opção que falha.
  const canSeeProfiles = viewerRole === "founder";
  const [profileOf, setProfileOf] = useState<AdminUser | null>(null);
  const [profileBets, setProfileBets] = useState<Bet[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);

  const [profileError, setProfileError] = useState<string | null>(null);

  const openProfile = async (user: AdminUser) => {
    // Fecha a folha de ações primeiro: a página do perfil vem por cima e duas
    // camadas abertas ao mesmo tempo deixam o botão de voltar ambíguo.
    setSheet(null);
    setProfileOf(user);
    setProfileBets([]);
    setProfileError(null);
    setProfileLoading(true);
    try {
      const { bets } = await fetchMemberBets(user.id);
      setProfileBets(bets);
    } catch (err: any) {
      setProfileError(err?.message || t("admin.profile.error"));
    } finally {
      setProfileLoading(false);
    }
  };

  const { overview } = panel;
  const busy = selected ? panel.busyUserId === selected.id : false;
  const lastOnPage = Math.min(panel.page * panel.pageSize, panel.total);

  const openActions = (user: AdminUser) => {
    setSelected(user);
    setMonths("1");
    setNote("");
    setDays("14");
    setSheet("actions");
  };

  // Uma ação bem sucedida fecha a folha; se falhar, a mensagem de erro fica
  // visível por baixo e o utilizador pode tentar outra vez.
  const close = (ok: boolean) => {
    if (ok) {
      setSheet(null);
      setSelected(null);
    }
  };

  return (
    <div className="space-y-1 pb-4">
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">
            {t("admin.title")}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("admin.subtitle")}</p>
        </div>
        <Pressable
          as="button"
          onClick={() => void panel.reload()}
          disabled={panel.loading}
          className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-400"
          aria-label={t("admin.retry")}
        >
          <RefreshCw size={16} className={panel.loading ? "animate-spin" : ""} />
        </Pressable>
      </div>

      {panel.error && (
        <div className="mt-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-medium">
          {panel.error}
        </div>
      )}

      {overview && (
        <>
          <SectionHeader>{t("admin.title")}</SectionHeader>
          <div className="grid grid-cols-2 gap-2">
            <Metric label={t("admin.metric.users")} value={formatNumber(overview.users)} />
            <Metric label={t("admin.metric.entitled")} value={formatNumber(overview.entitled)} />
            <Metric label={t("admin.metric.paying")} value={formatNumber(overview.paying)} />
            <Metric label={t("admin.metric.trial")} value={formatNumber(overview.on_trial)} />
            <Metric label={t("admin.metric.granted")} value={formatNumber(overview.granted)} />
            <Metric label={t("admin.metric.mrr")} value={formatPrice(lang, overview.mrr_cents, overview.currency)} />
          </div>
        </>
      )}

      <SectionHeader>{t("admin.users.title")}</SectionHeader>
      <MobileCard className="space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={panel.search}
            onChange={(e) => panel.setSearch(e.target.value)}
            placeholder={t("admin.users.searchPlaceholder")}
            className={`${INPUT} pl-9`}
          />
        </div>
        <FilterChips
          options={FILTERS.map((f) => ({ value: f.value, label: t(f.key) }))}
          value={panel.filter}
          onChange={(value) => panel.setFilter(value as typeof panel.filter)}
        />
      </MobileCard>

      {panel.loading && panel.users.length === 0 ? (
        <p className="py-10 text-center text-xs text-zinc-400 dark:text-zinc-500 font-mono flex items-center justify-center gap-2">
          <Loader2 size={14} className="animate-spin" /> {t("admin.loading")}
        </p>
      ) : panel.users.length === 0 ? (
        <p className="py-10 text-center text-xs text-zinc-400 dark:text-zinc-500">{t("admin.users.empty")}</p>
      ) : (
        <ListGroup className="mt-2">
          {panel.users.map((user) => (
            <ListItem
              key={user.id}
              title={user.username ?? user.email}
              subtitle={`${user.email} · ${t("admin.users.betsCount", { count: user.betsCount })}`}
              onClick={() => openActions(user)}
              trailing={
                <span
                  className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${TONE[accessTone(user)]}`}
                >
                  {isProtected(user) ? t("admin.role.founder") : t(ACCESS_KEY[user.accessSource])}
                </span>
              }
            />
          ))}
        </ListGroup>
      )}

      <div className="flex items-center justify-between gap-3 pt-3 text-[11px] text-zinc-500 dark:text-zinc-400">
        <span className="font-mono">
          {t("admin.users.showing", {
            shown: `${panel.total === 0 ? 0 : (panel.page - 1) * panel.pageSize + 1}–${lastOnPage}`,
            total: panel.total,
          })}
        </span>
        <div className="flex gap-2">
          <Pressable
            as="button"
            onClick={() => panel.setPage(panel.page - 1)}
            disabled={panel.page <= 1}
            className="px-3 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 font-semibold"
          >
            {t("admin.users.previous")}
          </Pressable>
          <Pressable
            as="button"
            onClick={() => panel.setPage(panel.page + 1)}
            disabled={lastOnPage >= panel.total}
            className="px-3 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 font-semibold"
          >
            {t("admin.users.next")}
          </Pressable>
        </div>
      </div>

      <SectionHeader>{t("admin.audit.title")}</SectionHeader>
      {panel.audit.length === 0 ? (
        <MobileCard>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">{t("admin.audit.empty")}</p>
        </MobileCard>
      ) : (
        <MobileCard className="space-y-2">
          {panel.audit.map((entry) => (
            <div key={entry.id} className="text-xs">
              <p className="text-zinc-600 dark:text-zinc-300">{auditLine(entry, t)}</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                {formatDate(entry.createdAt, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ))}
        </MobileCard>
      )}

      {/* Ações da conta escolhida */}
      <BottomSheet
        open={sheet === "actions" && selected !== null}
        onClose={() => setSheet(null)}
        title={selected?.username ?? selected?.email}
      >
        <ListGroup>
          {canSeeProfiles && selected && (
            <ListItem
              icon={Eye}
              title={t("admin.profile.open")}
              onClick={() => void openProfile(selected)}
              chevron
            />
          )}
          <ListItem icon={Gift} title={t("admin.action.grant")} onClick={() => setSheet("grant")} chevron />
          {selected?.subscription && selected.subscription.status !== "canceled" && (
            <ListItem title={t("admin.action.revoke")} onClick={() => setSheet("revoke")} chevron />
          )}
          <ListItem icon={Hourglass} title={t("admin.action.trial")} onClick={() => setSheet("trial")} chevron />
          {/* Num fundador estas duas não aparecem — o servidor recusa-as na
              mesma, mas mostrá-las só convidava ao erro. */}
          {selected && !isProtected(selected) && (
            <>
              <ListItem
                icon={selected.role === "admin" ? ShieldOff : ShieldCheck}
                title={selected.role === "admin" ? t("admin.action.demote") : t("admin.action.promote")}
                onClick={() => {
                  void (selected.role === "admin" ? panel.demote(selected) : panel.promote(selected)).then(close);
                }}
              />
              <ListItem icon={Trash2} title={t("admin.action.delete")} destructive onClick={() => setSheet("delete")} />
            </>
          )}
        </ListGroup>
        {busy && (
          <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500 font-mono flex items-center gap-2">
            <Loader2 size={13} className="animate-spin" /> {t("admin.saving")}
          </p>
        )}
      </BottomSheet>

      {/* Oferecer subscrição */}
      <BottomSheet
        open={sheet === "grant" && selected !== null}
        onClose={() => setSheet("actions")}
        title={selected ? t("admin.grant.title", { user: selected.username ?? selected.email }) : ""}
      >
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t("admin.grant.months")}</span>
            <input type="number" min={0} max={60} value={months} onChange={(e) => setMonths(e.target.value)} className={INPUT} />
            <span className="block text-[11px] text-zinc-400 dark:text-zinc-500">{t("admin.grant.forever")}</span>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t("admin.grant.note")}</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("admin.grant.notePlaceholder")}
              className={INPUT}
            />
          </label>
          <Pressable
            as="button"
            disabled={busy}
            onClick={() => {
              if (!selected) return;
              void panel.grant(selected, Number(months) || 0, note.trim() || undefined).then(close);
            }}
            className={PRIMARY}
          >
            {busy ? t("admin.saving") : t("admin.grant.submit")}
          </Pressable>
        </div>
      </BottomSheet>

      {/* Período experimental */}
      <BottomSheet
        open={sheet === "trial" && selected !== null}
        onClose={() => setSheet("actions")}
        title={selected ? t("admin.trial.title", { user: selected.username ?? selected.email }) : ""}
      >
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t("admin.trial.days")}</span>
            <input type="number" min={0} max={3650} value={days} onChange={(e) => setDays(e.target.value)} className={INPUT} />
            <span className="block text-[11px] text-zinc-400 dark:text-zinc-500">{t("admin.trial.hint")}</span>
          </label>
          <Pressable
            as="button"
            disabled={busy}
            onClick={() => {
              if (!selected) return;
              void panel.setTrial(selected, Number(days) || 0).then(close);
            }}
            className={PRIMARY}
          >
            {busy ? t("admin.saving") : t("admin.trial.submit")}
          </Pressable>
        </div>
      </BottomSheet>

      {/* Retirar a subscrição */}
      <BottomSheet
        open={sheet === "revoke" && selected !== null}
        onClose={() => setSheet("actions")}
        title={selected ? t("admin.revoke.title", { user: selected.username ?? selected.email }) : ""}
      >
        <div className="space-y-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {selected?.subscription?.source === "stripe"
              ? t("admin.revoke.bodyPaid")
              : t("admin.revoke.bodyManual")}
          </p>
          <Pressable
            as="button"
            disabled={busy}
            onClick={() => {
              if (!selected) return;
              void panel.revoke(selected).then(close);
            }}
            className={DANGER}
          >
            {busy ? t("admin.saving") : t("admin.action.revoke")}
          </Pressable>
        </div>
      </BottomSheet>

      {/* Apagar conta */}
      <BottomSheet
        open={sheet === "delete" && selected !== null}
        onClose={() => setSheet("actions")}
        title={selected ? t("admin.delete.title", { user: selected.username ?? selected.email }) : ""}
      >
        <div className="space-y-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{t("admin.delete.body")}</p>
          <Pressable
            as="button"
            disabled={busy}
            onClick={() => {
              if (!selected) return;
              void panel.remove(selected).then(close);
            }}
            className={DANGER}
          >
            {busy ? t("admin.saving") : t("admin.delete.confirm")}
          </Pressable>
        </div>
      </BottomSheet>
      {/* Perfil de um membro — a mesma vista que o social dá de um amigo. */}
      <SheetPage
        open={!!profileOf}
        onClose={() => setProfileOf(null)}
        title={profileOf ? profileOf.username ?? profileOf.email : ""}
      >
        {profileOf && (
          profileError ? (
            <p className="text-xs text-rose-600 dark:text-rose-400 text-center py-8">{profileError}</p>
          ) : (
            <MobileMemberProfile
              username={profileOf.username ?? profileOf.email}
              bets={profileBets}
              currency={currency}
              isDark={isDark}
              loading={profileLoading}
            />
          )
        )}
      </SheetPage>

    </div>
  );
}
