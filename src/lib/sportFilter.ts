// src/lib/sportFilter.ts
// O filtro de desporto, igual nos quatro ecrãs que o têm (painel e histórico,
// desktop e mobile). Cada um tinha a sua cópia, e divergiam: uma aparava os
// espaços e outra não.
//
// Compara sempre pelo normalizador (lib/sport.ts). As apostas já chegam
// normalizadas do mapBetFromApi, mas o valor do filtro pode vir de um URL
// antigo - um "?sport=FUTEBOL" colado de antes disto continua a dar Futebol.

import { normalizeSport } from "../../lib/sport";
import type { Bet } from "../types";

/** Valor do filtro para as apostas sem desporto, como o "NONE" das contas. */
export const NO_SPORT = "NONE";

/** Os desportos das apostas, um por desporto e por ordem alfabética. */
export function listSports(bets: Bet[]): string[] {
  const vistos = new Set<string>();
  for (const bet of bets) {
    for (const selection of bet.selections || []) {
      const sport = normalizeSport(selection.sport);
      if (sport) vistos.add(sport);
    }
  }
  return [...vistos].sort((a, b) => a.localeCompare(b, "pt"));
}

/** Uma aposta com uma perna sem desporto. É o que o "Sem desporto" mostra. */
function lacksSport(bet: Bet): boolean {
  const selections = bet.selections || [];
  return selections.length === 0 || selections.some((selection) => !normalizeSport(selection.sport));
}

/** Se vale a pena oferecer o "Sem desporto": só quando há apostas nessa situação. */
export function hasBetsWithoutSport(bets: Bet[]): boolean {
  return bets.some(lacksSport);
}

/** "ALL", NO_SPORT, ou um desporto - basta uma perna dele para a aposta entrar. */
export function matchesSportFilter(bet: Bet, filter: string): boolean {
  if (filter === "ALL") return true;
  if (filter === NO_SPORT) return lacksSport(bet);
  const alvo = normalizeSport(filter);
  return (bet.selections || []).some((selection) => normalizeSport(selection.sport) === alvo);
}
