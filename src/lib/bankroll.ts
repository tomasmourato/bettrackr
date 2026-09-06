// src/lib/bankroll.ts
// Matemática da banca. Módulo puro (sem React) para poder ser testado como o
// resto das contas de dinheiro, em test/app.
//
// O saldo NÃO é guardado em lado nenhum: é derivado dos movimentos (dinheiro
// real a entrar e a sair das casas) mais o lucro líquido das apostas já
// liquidadas, que a app já tem. Assim uma aposta nunca precisa de ser lançada
// à mão e o saldo não pode divergir do histórico.
//
// Duas decisões que valem a pena estar escritas:
//
//  * As freebets não têm caso especial. O netProfit já as trata bem - uma
//    freebet perdida dá 0 porque não se arriscou dinheiro real, e uma ganha dá
//    o que a casa pagou. Somar netProfit é exatamente o que se quer; descontar
//    a stake de uma freebet seria contar dinheiro que nunca saiu do bolso.
//
//  * As apostas ignoradas ficam de fora, como ficam de todas as outras
//    estatísticas. O dinheiro moveu-se mesmo, por isso é uma escolha com
//    custo, mas marcar uma aposta como ignorada quer dizer "não quero isto nas
//    minhas contas" e dividir esse significado entre a banca e o resto era
//    pior. O movimento AJUSTE existe para reconciliar esses casos.

import { Bet, BankrollMovement, BankrollPoint, BankrollSummary } from "../types";
import { safeNum } from "../utils";

/**
 * "YYYY-MM-DD HH:mm" -> epoch ms. O replace do espaço por "T" é o mesmo
 * remendo que o Dashboard já usa: sem ele o Safari não parseia a data.
 * Datas inválidas caem para 0 e ficam no início, de forma determinística.
 */
function toTimestamp(value: string | undefined): number {
  if (!value) return 0;
  const parsed = new Date(value.replace(" ", "T")).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Parte da data ("YYYY-MM-DD") de um "YYYY-MM-DD HH:mm". */
function dayOf(value: string | undefined): string {
  return value ? value.split(" ")[0] : "";
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

interface Event {
  at: string;
  ts: number;
  delta: number;
  source: "MOVEMENT" | "BET";
}

/** Uma aposta conta para a banca quando já está liquidada e não foi ignorada. */
function countsTowardsBalance(bet: Bet): boolean {
  return !bet.isIgnored && bet.status !== "POR_LIQUIDAR";
}

/**
 * Dinheiro real ainda preso numa aposta por liquidar. As freebets não contam
 * (a stake não é dinheiro do utilizador) nem as ignoradas.
 */
function countsTowardsExposure(bet: Bet): boolean {
  return !bet.isIgnored && bet.status === "POR_LIQUIDAR" && !bet.isFreebet;
}

export function calculateBankroll(
  movements: BankrollMovement[],
  bets: Bet[],
): BankrollSummary {
  let deposited = 0;
  let withdrawn = 0;
  let adjustments = 0;
  let betsProfit = 0;
  let exposure = 0;

  const events: Event[] = [];

  for (const movement of movements) {
    const amount = safeNum(movement.amount);
    if (movement.kind === "DEPOSITO") deposited += amount;
    else if (movement.kind === "LEVANTAMENTO") withdrawn += Math.abs(amount);
    else adjustments += amount;

    events.push({
      at: dayOf(movement.occurredAt),
      ts: toTimestamp(movement.occurredAt),
      delta: amount,
      source: "MOVEMENT",
    });
  }

  for (const bet of bets) {
    if (countsTowardsExposure(bet)) exposure += safeNum(bet.stake);
    if (!countsTowardsBalance(bet)) continue;

    const profit = safeNum(bet.netProfit);
    betsProfit += profit;
    events.push({
      at: dayOf(bet.dateTime),
      ts: toTimestamp(bet.dateTime),
      delta: profit,
      source: "BET",
    });
  }

  const balance = deposited - withdrawn + adjustments + betsProfit;

  // Uma passagem única sobre os eventos por ordem cronológica constrói a série
  // e mede a maior queda pico-a-vale ao mesmo tempo.
  events.sort((a, b) => a.ts - b.ts);

  const series: BankrollPoint[] = [];
  let running = 0;
  let peak = 0;
  let maxDrawdown = 0;
  let peakAtMaxDrawdown = 0;

  for (const event of events) {
    running += event.delta;
    if (running > peak) peak = running;

    const drawdown = peak - running;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      peakAtMaxDrawdown = peak;
    }

    series.push({
      at: event.at,
      balance: round2(running),
      delta: round2(event.delta),
      source: event.source,
    });
  }

  return {
    balance: round2(balance),
    deposited: round2(deposited),
    withdrawn: round2(withdrawn),
    adjustments: round2(adjustments),
    betsProfit: round2(betsProfit),
    exposure: round2(exposure),
    available: round2(balance - exposure),
    // Sem depósitos não há capital sobre o qual medir retorno.
    roi: deposited > 0 ? round2((betsProfit / deposited) * 100) : null,
    maxDrawdown: round2(maxDrawdown),
    maxDrawdownPct:
      peakAtMaxDrawdown > 0 ? round2((maxDrawdown / peakAtMaxDrawdown) * 100) : null,
    hasData: movements.length > 0,
    series,
  };
}
