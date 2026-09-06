// src/components/ClvLock.tsx
// O que aparece no lugar do CLV quando a conta não tem subscrição.
//
// O bloqueio a sério é do servidor: para estas contas o `/api/bets` nem devolve
// a odd de fecho (lib/clvVisibility.ts). Isto aqui não esconde nada - o valor
// já não veio - serve só para o lugar não ficar vazio sem explicação, e para
// quem quiser a funcionalidade saber onde a ir buscar.

import { Lock } from "lucide-react";

import { useI18n } from "../lib/i18n";

interface ClvLockProps {
  /** Leva à subscrição. Sem isto o cadeado informa mas não resolve. */
  onSubscribe?: () => void;
}

/**
 * O cadeado pequeno, para o lugar de um valor numa lista.
 *
 * Ocupa o mesmo espaço que a percentagem ocuparia, para a linha não dançar
 * entre uma aposta com CLV e outra sem.
 */
export function ClvLockInline({ onSubscribe }: ClvLockProps) {
  const { t } = useI18n();
  const conteudo = (
    <>
      <Lock size={9} strokeWidth={2.5} />
      <span>CLV</span>
    </>
  );
  const classes =
    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold " +
    "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400";

  if (!onSubscribe) {
    return (
      <span className={classes} title={t("clv.locked.short")}>
        {conteudo}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={(e) => {
        // A linha inteira costuma abrir o detalhe da aposta; o cadeado leva a
        // outro sítio e não pode arrastar esse clique atrás de si.
        e.stopPropagation();
        onSubscribe();
      }}
      className={`${classes} hover:bg-emerald-600/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors`}
      title={t("clv.locked.short")}
      aria-label={t("clv.locked.short")}
    >
      {conteudo}
    </button>
  );
}

/**
 * O painel, para o lugar de uma secção inteira (a análise de CLV do painel).
 *
 * Diz o que a funcionalidade faz em vez de só dizer que está fechada: uma
 * fechadura sem explicação não vende nada a ninguém.
 */
export function ClvLockPanel({ onSubscribe }: ClvLockProps) {
  const { t } = useI18n();
  return (
    <div className="rounded-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 text-xs">
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-8 h-8 rounded-sm bg-emerald-600/10 border border-emerald-500/30 flex items-center justify-center">
          <Lock size={14} className="text-emerald-600 dark:text-emerald-400" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {t("clv.locked.title")}
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
            {t("clv.locked.desc")}
          </p>
          {onSubscribe && (
            <button
              type="button"
              onClick={onSubscribe}
              className="mt-3 px-3 py-1.5 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
            >
              {t("clv.locked.cta")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
