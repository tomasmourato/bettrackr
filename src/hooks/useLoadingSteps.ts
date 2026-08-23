// src/hooks/useLoadingSteps.ts
// Passos de progresso para as esperas longas da IA (avaliação de apostas e
// dicas do dia). O servidor não faz streaming - a chamada ao Gemini é um
// pedido único - por isso o progresso é TEMPORAL (estimado a partir dos tempos
// típicos), não real. Serve para o utilizador perceber o que está a acontecer
// e que a app não bloqueou. Partilhado entre o AIInsights (desktop) e o
// MobileInsights para os dois mostrarem exatamente o mesmo texto.

import { useEffect, useState } from "react";
import type { TKey } from "../lib/i18n";

export interface LoadingStep {
  /** Segundos decorridos a partir dos quais este passo passa a ser o atual. */
  after: number;
  /** Chave de traducao; quem mostra o passo e que chama t(). */
  key: TKey;
}

/** Passos da avaliação de uma aposta (varia com a existência de print). */
export const evalStepsFor = (hasImage: boolean): LoadingStep[] => [
  { after: 0, key: hasImage ? "ai.step.readImage" : "ai.step.readText" },
  { after: 4, key: "ai.step.identify" },
  { after: 9, key: "ai.step.form" },
  { after: 15, key: "ai.step.injuries" },
  { after: 22, key: "ai.step.odds" },
  { after: 30, key: "ai.step.probability" },
  { after: 38, key: "ai.step.ev" },
  { after: 46, key: "ai.step.finishing" },
];

/** Passos da geração das dicas diárias. */
export const PICKS_STEPS: LoadingStep[] = [
  { after: 0, key: "ai.picks.prepare" },
  { after: 4, key: "ai.picks.games" },
  { after: 10, key: "ai.picks.odds" },
  { after: 18, key: "ai.picks.form" },
  { after: 27, key: "ai.picks.select" },
  { after: 36, key: "ai.picks.write" },
  { after: 45, key: "ai.picks.finishing" },
];

/**
 * Devolve o passo atual e os segundos decorridos enquanto `active` for true.
 * Reinicia sempre que a espera recomeça.
 */
export function useLoadingSteps(active: boolean, steps: LoadingStep[]) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const startedAt = Date.now();
    setElapsed(0);
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [active]);

  let index = 0;
  for (let i = 0; i < steps.length; i++) {
    if (elapsed >= steps[i].after) index = i;
  }

  return { index, elapsed, key: steps[index]?.key };
}
