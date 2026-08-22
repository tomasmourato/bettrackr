// src/components/MemberProfile.tsx
// O perfil de outro utilizador: estatísticas (o mesmo Dashboard, alimentado
// com as apostas dele) e a lista read-only das apostas recentes.
//
// Vive à parte porque tem dois donos — o separador social mostra-o de um
// amigo, o painel de gestão mostra-o de qualquer membro (só ao fundador). São
// dois caminhos e uma vista; duas cópias dela era pedir que uma envelhecesse
// sem a outra, como já aconteceu neste projeto com o portão do painel.
//
// Não sabe de amizades nem de papéis: recebe as apostas já carregadas e o
// texto do subtítulo. Quem o abre é que decide se pode.

import React, { useMemo } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Bet } from "../types";
import { safeNum } from "../utils";
import Dashboard from "./Dashboard";
import { useI18n, type TKey } from "../lib/i18n";

/** Etiqueta + cores para cada estado de aposta. */
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

interface MemberProfileProps {
  username: string;
  /** Etiqueta por baixo do nome: "Perfil de amigo", "Membro"… */
  subtitle: string;
  bets: Bet[];
  currency: string;
  isDark: boolean;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  /** Ação opcional no canto (no social, remover a amizade). */
  action?: React.ReactNode;
}

export default function MemberProfile({
  username,
  subtitle,
  bets,
  currency,
  isDark,
  loading,
  error,
  onBack,
  action,
}: MemberProfileProps) {
  const { t, formatMoney, formatSignedMoney } = useI18n();

  // Apostas recentes, ordenadas por data desc.
  const recent = useMemo(
    () =>
      [...bets]
        .sort((a, b) => new Date(b.dateTime.replace(" ", "T")).getTime() - new Date(a.dateTime.replace(" ", "T")).getTime())
        .slice(0, 50),
    [bets],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> {t("social.back")}
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm uppercase">
              {username.slice(0, 2)}
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-display leading-tight">
                {username}
              </h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-bold">{subtitle}</p>
            </div>
          </div>
        </div>
        {action}
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 rounded-sm border border-rose-200 dark:border-rose-900 text-xs font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-zinc-400 dark:text-zinc-500 text-xs gap-2">
          <Loader2 size={16} className="animate-spin" /> {t("social.loadingStats", { username })}
        </div>
      ) : (
        <>
          {/* Estatísticas — o mesmo Dashboard, com as apostas dele. */}
          <Dashboard bets={bets} currency={currency} isDark={isDark} />

          <div className="bg-white dark:bg-zinc-900 rounded-sm p-5 border border-zinc-200 dark:border-zinc-800">
            <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display mb-1">
              {t("social.friendBets", { username })}
            </h4>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
              {t("social.recentBets", { total: bets.length })}
            </p>

            {recent.length === 0 ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 py-6 text-center">
                {t("social.noFriendBets")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5">{t("bets.sort.date")}</th>
                      <th className="py-2.5">{t("social.table.event")}</th>
                      <th className="py-2.5">{t("bets.details.bookmaker")}</th>
                      <th className="py-2.5 text-right">{t("bets.field.stake")}</th>
                      <th className="py-2.5 text-right">{t("bets.field.odd")}</th>
                      <th className="py-2.5 text-center">{t("filters.status")}</th>
                      <th className="py-2.5 text-right">{t("bets.sort.profit")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {recent.map((bet) => {
                      const meta = statusMeta(bet.status);
                      const event = bet.selections?.[0]?.event || t("bet.multiple");
                      const extra = (bet.selections?.length || 0) > 1 ? ` +${bet.selections.length - 1}` : "";
                      return (
                        <tr key={bet.id} className="text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="py-2.5 font-mono text-[10px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap">{bet.dateTime}</td>
                          <td className="py-2.5 font-medium text-zinc-800 dark:text-zinc-100 max-w-[220px] truncate">
                            {event}<span className="text-zinc-400 dark:text-zinc-500 font-normal">{extra}</span>
                          </td>
                          <td className="py-2.5">{bet.bookmaker}</td>
                          <td className="py-2.5 text-right font-mono">
                            {formatMoney(safeNum(bet.stake), currency)}
                            {bet.isFreebet && <span className="ml-1 text-[8px] font-bold text-amber-600 dark:text-amber-400 uppercase">FB</span>}
                          </td>
                          <td className="py-2.5 text-right font-mono">@{safeNum(bet.odd).toFixed(2)}</td>
                          <td className="py-2.5 text-center">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase border ${meta.className}`}>{t(meta.key)}</span>
                          </td>
                          <td className={`py-2.5 text-right font-semibold font-mono ${safeNum(bet.netProfit) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                            {bet.status === "POR_LIQUIDAR" ? "—" : formatSignedMoney(safeNum(bet.netProfit), currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
