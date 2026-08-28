// src/mobile/components/ClosingOddsSheet.tsx
// A caixa de entrada do CLV em mobile: página-folha que lista as apostas cujo
// evento já começou e ainda não têm odd de fecho, uma por cartão, com um campo
// numérico para escrever a odd.
//
// Equivalente mobile do ClosingOddsModal do desktop. A lógica de quem entra na
// lista e de como o CLV se calcula é a mesma (src/lib/clv.ts); só o JSX é que
// é próprio de cada shell, como já acontece com a banca.

import { useMemo, useState } from "react";
import { Bet } from "../../types";
import { safeNum } from "../../utils";
import { needsClosingOdd } from "../../lib/clv";
import { useI18n } from "../../lib/i18n";
import { MobileCard, SheetPage } from "../ui";

interface ClosingOddsSheetProps {
  open: boolean;
  bets: Bet[];
  onClose: () => void;
  onSetClosingOdd: (id: string, closingOdd: number | null) => Promise<void>;
}

const inputClasses =
  "w-24 h-11 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-base font-mono text-zinc-800 dark:text-zinc-100 outline-none focus:border-emerald-500";

/** Resumo curto da aposta, para se reconhecer o cartão sem abrir nada. */
function describe(bet: Bet): string {
  const first = bet.selections?.[0];
  if (!first) return bet.bookmaker || "-";
  const extra = bet.selections.length > 1 ? ` (+${bet.selections.length - 1})` : "";
  return [first.event?.trim(), first.choice?.trim()].filter(Boolean).join(" - ") + extra;
}

export default function ClosingOddsSheet({
  open,
  bets,
  onClose,
  onSetClosingOdd,
}: ClosingOddsSheetProps) {
  const { t } = useI18n();

  // A lista só é recalculada quando a folha abre: se reagisse a cada gravação,
  // o cartão saltava para fora mal se escrevesse o número e perdia-se o
  // feedback do CLV acabado de calcular.
  const pending = useMemo(() => {
    if (!open) return [];
    return bets
      .filter((bet) => needsClosingOdd(bet))
      .sort((a, b) => b.dateTime.localeCompare(a.dateTime));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

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

  const remaining = pending.filter((bet) => saved[bet.id] === undefined).length;

  return (
    <SheetPage open={open} onClose={onClose} title={t("clv.fill.title")}>
      <div className="space-y-3">
        <p className="px-1 text-xs text-zinc-500 dark:text-zinc-400">{t("clv.fill.desc")}</p>

        {pending.length === 0 ? (
          <p className="px-1 text-xs italic text-zinc-400 dark:text-zinc-500">
            {t("clv.fill.empty")}
          </p>
        ) : (
          <>
            {pending.map((bet) => {
              const savedOdd = saved[bet.id];
              const odd = safeNum(bet.odd);
              // Calculado à mão a partir do valor acabado de gravar: a prop
              // `bets` só chega atualizada no render seguinte e a lista está
              // congelada de propósito.
              const clvPct = savedOdd ? (odd / savedOdd - 1) * 100 : null;

              return (
                <MobileCard
                  key={bet.id}
                  className={
                    savedOdd
                      ? "!border-emerald-200 dark:!border-emerald-900 !bg-emerald-50/60 dark:!bg-emerald-950/30"
                      : ""
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {describe(bet)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                        {bet.dateTime} · {bet.bookmaker}
                      </p>
                      <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                        {t("clv.fill.oddTaken")}{" "}
                        <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-200">
                          {odd.toFixed(2)}
                        </span>
                      </p>
                    </div>

                    {savedOdd ? (
                      <div className="shrink-0 text-right">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
                          {t("clv.fill.saved")}
                        </p>
                        <p
                          className={`font-mono text-sm font-bold tabular-nums ${
                            (clvPct ?? 0) >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {(clvPct ?? 0) >= 0 ? "+" : ""}
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
                            (event.target as HTMLInputElement).blur();
                          }
                        }}
                        placeholder={t("bets.form.closingOddPlaceholder")}
                        aria-label={t("clv.closingOddAria")}
                        className={inputClasses}
                      />
                    )}
                  </div>
                </MobileCard>
              );
            })}

            <p className="px-1 pt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
              {t("clv.fill.pending", { n: remaining })}
            </p>
          </>
        )}
      </div>
    </SheetPage>
  );
}
