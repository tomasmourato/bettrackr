// src/components/ClosingOddsModal.tsx
// A caixa de entrada do CLV: lista as apostas cujo evento já começou e que
// ainda não têm odd de fecho, uma por linha, com um campo para escrever a odd.
//
// Existe porque o CLV vive ou morre no atrito de registar a linha de fecho.
// Obrigar a abrir o formulário de cada aposta para escrever um número era
// garantir que ninguém o faria duas vezes. Aqui grava-se com Enter (ou ao sair
// do campo) e a linha desaparece com o CLV já calculado ao lado.
//
// A gravação passa pelo PATCH /api/bets/:id/closing-odd, que só escreve uma
// coluna - o PUT obrigaria a mandar a aposta inteira de volta.

import React, { useMemo, useState } from "react";
import { Crosshair, X } from "lucide-react";
import { Bet } from "../types";
import { safeNum } from "../utils";
import { needsClosingOdd } from "../lib/clv";
import { useI18n } from "../lib/i18n";

interface ClosingOddsModalProps {
  bets: Bet[];
  onClose: () => void;
  onSetClosingOdd: (id: string, closingOdd: number | null) => Promise<void>;
}

const inputClasses =
  "w-24 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-sm px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-600";

/** Resumo curto da aposta, para se reconhecer a linha sem abrir nada. */
function describe(bet: Bet): string {
  const first = bet.selections?.[0];
  if (!first) return bet.bookmaker || "-";
  const event = first.event?.trim();
  const choice = first.choice?.trim();
  const extra = bet.selections.length > 1 ? ` (+${bet.selections.length - 1})` : "";
  return [event, choice].filter(Boolean).join(" - ") + extra;
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
  const [savingId, setSavingId] = useState<string | null>(null);

  const remaining = useMemo(
    () => pending.filter((bet) => saved[bet.id] === undefined).length,
    [pending, saved],
  );

  const commit = async (bet: Bet) => {
    const raw = (drafts[bet.id] ?? "").trim();
    if (raw === "") return;
    const parsed = parseFloat(raw.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 1) return;

    setSavingId(bet.id);
    await onSetClosingOdd(bet.id, Number(parsed.toFixed(3)));
    setSavingId(null);
    setSaved((prev) => ({ ...prev, [bet.id]: parsed }));
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
            <ul className="space-y-1.5">
              {pending.map((bet) => {
                const savedOdd = saved[bet.id];
                const odd = safeNum(bet.odd);
                // O CLV desta linha é calculado à mão a partir do valor que
                // acabou de ser gravado: a prop `bets` só chega atualizada no
                // render seguinte e a lista está congelada de propósito.
                const clvPct = savedOdd ? (odd / savedOdd - 1) * 100 : null;

                return (
                  <li
                    key={bet.id}
                    className={`flex items-center gap-3 rounded-sm border p-2.5 transition-colors ${
                      savedOdd
                        ? "border-emerald-100 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30"
                        : "border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                        {describe(bet)}
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        {bet.dateTime} · {bet.bookmaker}
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
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="1.01"
                        disabled={savingId === bet.id}
                        value={drafts[bet.id] ?? ""}
                        onChange={(event) =>
                          setDrafts((prev) => ({ ...prev, [bet.id]: event.target.value }))
                        }
                        onBlur={() => commit(bet)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            commit(bet);
                          }
                        }}
                        placeholder={t("bets.form.closingOddPlaceholder")}
                        aria-label={t("clv.closingOddAria")}
                        className={inputClasses}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
            {t("clv.fill.pending", { n: remaining })}
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
