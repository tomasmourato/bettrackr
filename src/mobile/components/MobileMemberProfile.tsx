// src/mobile/components/MobileMemberProfile.tsx
// O conteúdo do perfil de outro utilizador no mobile: estatísticas (o
// MobileDashboard com as apostas dele) e a lista read-only das recentes.
//
// Só o conteúdo — a SheetPage à volta fica de fora de propósito, porque o
// cabeçalho e o rodapé mudam consoante quem abre: o social tem "remover
// amigo", o painel de gestão não tem ação nenhuma.
//
// Equivalente mobile do MemberProfile.tsx. São dois porque os dois ecrãs se
// desenham de maneira diferente; a regra de quem pode ver não vive em nenhum
// deles, vive em quem os abre (e, a sério, no requireFounder do servidor).

import { lazy, Suspense, useMemo } from "react";
import { Loader2 } from "lucide-react";

import { Bet } from "../../types";
import { safeNum } from "../../utils";
import { useI18n, type TKey } from "../../lib/i18n";
import { SectionHeader, MobileCard } from "../ui";

const MobileDashboard = lazy(() => import("../screens/MobileDashboard"));

function statusMeta(status: Bet["status"]): { key: TKey; className: string } {
  switch (status) {
    case "GANHA":
      return { key: "status.won", className: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900" };
    case "MEIO_GANHA":
      return { key: "status.halfWon", className: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900" };
    case "PERDIDA":
      return { key: "status.lost", className: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900" };
    case "MEIO_PERDIDA":
      return { key: "status.halfLost", className: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900" };
    case "ANULADA":
      return { key: "status.void", className: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700" };
    case "CASHOUT":
      return { key: "status.cashout", className: "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-900" };
    default:
      return { key: "status.unsettled", className: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900" };
  }
}

interface MobileMemberProfileProps {
  username: string;
  bets: Bet[];
  currency: string;
  isDark: boolean;
  loading: boolean;
}

export default function MobileMemberProfile({
  username,
  bets,
  currency,
  isDark,
  loading,
}: MobileMemberProfileProps) {
  const { t, formatMoney, formatSignedMoney } = useI18n();
  const money = (n: number) => formatMoney(safeNum(n), currency);

  const recent = useMemo(
    () =>
      [...bets]
        .sort((a, b) => new Date(b.dateTime.replace(" ", "T")).getTime() - new Date(a.dateTime.replace(" ", "T")).getTime())
        .slice(0, 50),
    [bets],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-xs text-zinc-400 dark:text-zinc-500">
        <Loader2 size={16} className="animate-spin" /> {t("social.loadingStats", { username })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estatísticas read-only (sem drill-down). */}
      <Suspense fallback={<div className="py-8 text-center text-xs text-zinc-400">{t("common.loading")}</div>}>
        <MobileDashboard bets={bets} currency={currency} isDark={isDark} />
      </Suspense>

      <SectionHeader>{t("social.recentBetsMobile", { total: bets.length })}</SectionHeader>
      {recent.length === 0 ? (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-4">{t("social.noFriendBets")}</p>
      ) : (
        <MobileCard className="!p-0 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
          {recent.map((bet) => {
            const meta = statusMeta(bet.status);
            const event = bet.selections?.[0]?.event || t("bet.multiple");
            const extra = (bet.selections?.length || 0) > 1 ? ` +${bet.selections.length - 1}` : "";
            return (
              <div key={bet.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {event}
                      {extra && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{extra}</span>}
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">
                      {bet.dateTime?.slice(0, 16)} · {bet.bookmaker}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${meta.className}`}>
                    {t(meta.key)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                  <span>{t("bets.field.stake")} {money(safeNum(bet.stake))}</span>
                  <span>{t("bets.field.odd")} {safeNum(bet.odd).toFixed(2)}</span>
                  <span className={`ml-auto font-bold ${bet.status === "POR_LIQUIDAR" ? "" : safeNum(bet.netProfit) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {bet.status === "POR_LIQUIDAR" ? "—" : formatSignedMoney(safeNum(bet.netProfit), currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </MobileCard>
      )}
    </div>
  );
}
