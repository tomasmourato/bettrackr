// src/components/ClosingOddsModal.tsx
// A caixa de entrada do CLV: lista as apostas cujo evento já começou e que
// ainda não têm odd de fecho, com um campo por PERNA.
//
// Existe porque o CLV vive ou morre no atrito de registar a linha de fecho.
// Obrigar a abrir o formulário de cada aposta para escrever um número era
// garantir que ninguém o faria duas vezes. Aqui grava-se com Enter (ou ao sair
// do campo) e a perna fica logo com o seu CLV ao lado.
//
// É por perna e não por boletim porque numa múltipla ninguém sabe a odd de
// fecho combinada - só as dos jogos. O servidor faz o produto
// (combineClosingOdds, src/lib/clv.ts) e só grava a combinada quando todas as
// pernas estiverem preenchidas.

import React, { useMemo, useState } from "react";
import { Crosshair, X } from "lucide-react";
import { Bet } from "../types";
import { parseDecimal, safeNum } from "../utils";
import { needsClosingOdd } from "../lib/clv";
import type { ClosingOddInput } from "../lib/betsApi";
import { useI18n } from "../lib/i18n";

interface ClosingOddsModalProps {
  bets: Bet[];
  onClose: () => void;
  onSetClosingOdd: (id: string, input: ClosingOddInput) => Promise<void>;
}

const inputClasses =
  "w-24 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-sm px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-600";

/** Chave de rascunho: uma perna é a aposta mais o seu índice. */
const legKey = (betId: string, index: number) => `${betId}:${index}`;

/** Resumo curto de uma perna, para se reconhecer sem abrir nada. */
function describeLeg(bet: Bet, index: number): string {
  const selection = bet.selections?.[index];
  if (!selection) return bet.bookmaker || "-";
  return [selection.event?.trim(), selection.choice?.trim()].filter(Boolean).join(" - ");
}

export default function ClosingOddsModal({
  bets,
  onClose,
  onSetClosingOdd,
}: ClosingOddsModalProps) {
  const { t } = useI18n();

  // A lista é congelada na montagem: se recalculasse a cada gravação, a linha
  // saltava para fora mal se escrevesse o número e perdia-se o feedback do
  // CLV que acabou de ser calculado. As já gravadas ficam marcadas.
  const [pending] = useState<Bet[]>(() =>
    bets
      .filter((bet) => needsClosingOdd(bet))
      .sort((a, b) => b.dateTime.localeCompare(a.dateTime)),
  );

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, number>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const totalLegs = useMemo(
    () => pending.reduce((sum, bet) => sum + (bet.selections?.length || 0), 0),
    [pending],
  );
  const remaining = totalLegs - Object.keys(saved).length;

  const commit = async (bet: Bet, index: number) => {
    const key = legKey(bet.id, index);
    const parsed = parseDecimal(drafts[key] ?? "");
    if (parsed === null || parsed <= 1) return;

    setSavingKey(key);
    await onSetClosingOdd(bet.id, {
      legs: [{ index, closingOdd: parsed }],
      source: "manual",
    });
    setSavingKey(null);
    setSaved((prev) => ({ ...prev, [key]: parsed }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-zinc-950/70 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="closing-odds-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex h-[96vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-md border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:h-auto sm:max-h-[85vh] sm:rounded-md">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div className="min-w-0">
            <h2
              id="closing-odds-title"
              className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 font-display"
            >
              <Crosshair size={18} className="text-emerald-600 dark:text-emerald-400" />
              {t("clv.fill.title")}
            </h2>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{t("clv.fill.desc")}</p>
          </div>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label={t("clv.fill.close")}
            className="cursor-pointer rounded-sm p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {pending.length === 0 ? (
            <p className="text-xs italic text-zinc-400 dark:text-zinc-500">{t("clv.fill.empty")}</p>
          ) : (
            <ul className="space-y-2">
              {pending.map((bet) => {
                const legs = bet.selections || [];
                const isMultiple = legs.length > 1;
                const savedLegs = legs.filter(
                  (_, index) => saved[legKey(bet.id, index)] !== undefined,
                ).length;

                return (
                  <li
                    key={bet.id}
                    className={`rounded-sm border p-2.5 transition-colors ${
                      legs.length > 0 && savedLegs === legs.length
                        ? "border-emerald-100 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30"
                        : "border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        {bet.dateTime} · {bet.bookmaker}
                      </p>
                      {isMultiple && (
                        <p className="shrink-0 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
                          {t("clv.fill.legProgress", { done: savedLegs, total: legs.length })}
                        </p>
                      )}
                    </div>

                    <div className="mt-1.5 space-y-1.5">
                      {legs.map((selection, index) => {
                        const key = legKey(bet.id, index);
                        const savedOdd = saved[key];
                        const odd = safeNum(selection.odd);
                        // Calculado à mão a partir do valor acabado de gravar:
                        // a prop `bets` só chega atualizada no render seguinte
                        // e a lista está congelada de propósito.
                        const clvPct = savedOdd ? (odd / savedOdd - 1) * 100 : null;

                        return (
                          <div key={key} className="flex items-center gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                                {describeLeg(bet, index)}
                              </p>
                            </div>

                            <div className="shrink-0 text-right">
                              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                                {t("clv.fill.oddTaken")}
                              </p>
                              <p className="font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                                {odd.toFixed(2)}
                              </p>
                            </div>

                            {savedOdd ? (
                              <div className="w-28 shrink-0 text-right">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                                  {t("clv.fill.saved")}
                                </p>
                                <p
                                  className={`font-mono text-xs font-bold ${
                                    (clvPct ?? 0) >= 0
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-rose-600 dark:text-rose-400"
                                  }`}
                                >
                                  {savedOdd.toFixed(2)} · {(clvPct ?? 0) >= 0 ? "+" : ""}
                                  {(clvPct ?? 0).toFixed(1)}%
                                </p>
                              </div>
                            ) : (
                              <input
                                type="text"
                                inputMode="decimal"
                                disabled={savingKey === key}
                                value={drafts[key] ?? ""}
                                onChange={(event) =>
                                  setDrafts((prev) => ({ ...prev, [key]: event.target.value }))
                                }
                                onBlur={() => commit(bet, index)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    commit(bet, index);
                                  }
                                }}
                                placeholder={t("bets.form.closingOddPlaceholder")}
                                aria-label={t("clv.closingOddAria")}
                                className={inputClasses}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
            {t("clv.fill.pendingLegs", { n: remaining })}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-sm bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            {t("clv.fill.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
