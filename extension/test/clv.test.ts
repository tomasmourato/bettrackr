import { describe, expect, test } from "bun:test";
import { betClv, calculateClv, isClvEligible, needsClosingOdd } from "../../src/lib/clv";
import type { Bet, BetStatus } from "../../src/types";

// O CLV é a única estatística da app que não espera pela liquidação: mede o
// preço apanhado contra a linha de fecho. Estes testes fixam as regras que
// decidem o que entra na conta e como.

// "Agora" fixo para os testes: as apostas de 2026-02-* já começaram, as de
// 2026-04-* ainda não.
const NOW = new Date("2026-03-01T00:00:00Z");

function bet(over: Partial<Bet> = {}): Bet {
  return {
    id: Math.random().toString(36).slice(2),
    type: "SIMPLES",
    status: "GANHA" as BetStatus,
    selections: [],
    stake: 10,
    odd: 2,
    isFreebet: false,
    potentialReturn: 20,
    finalReturn: 20,
    netProfit: 10,
    bookmaker: "Betano",
    dateTime: "2026-02-01 12:00",
    origin: "MANUAL",
    ...over,
  };
}

describe("betClv", () => {
  test("odd melhor do que o fecho dá CLV positivo em % e em dinheiro", () => {
    // 2.10 / 2.00 - 1 = +5%; 10 de stake -> +0.50
    const clv = betClv(bet({ odd: 2.1, closingOdd: 2, stake: 10 }))!;
    expect(clv.clvPct).toBe(5);
    expect(clv.moneyClv).toBe(0.5);
    expect(clv.beatClose).toBe(true);
  });

  test("odd pior do que o fecho dá CLV negativo", () => {
    // 1.90 / 2.00 - 1 = -5%
    const clv = betClv(bet({ odd: 1.9, closingOdd: 2, stake: 20 }))!;
    expect(clv.clvPct).toBe(-5);
    expect(clv.moneyClv).toBe(-1);
    expect(clv.beatClose).toBe(false);
  });

  test("odd igual à de fecho é zero e não conta como ter batido a linha", () => {
    const clv = betClv(bet({ odd: 2, closingOdd: 2 }))!;
    expect(clv.clvPct).toBe(0);
    expect(clv.moneyClv).toBe(0);
    expect(clv.beatClose).toBe(false);
  });

  test("sem odd de fecho não há nada a medir", () => {
    expect(betClv(bet({ closingOdd: undefined }))).toBeNull();
  });

  test("odds impossíveis (<= 1) são tratadas como ausentes", () => {
    expect(betClv(bet({ odd: 2, closingOdd: 1 }))).toBeNull();
    expect(betClv(bet({ odd: 2, closingOdd: 0 }))).toBeNull();
    expect(betClv(bet({ odd: 1, closingOdd: 2 }))).toBeNull();
  });

  test("a freebet tem percentagem mas nunca CLV em dinheiro", () => {
    const clv = betClv(bet({ odd: 2.4, closingOdd: 2, stake: 10, isFreebet: true }))!;
    expect(clv.clvPct).toBe(20);
    expect(clv.moneyClv).toBe(0);
  });

  test("a aposta sem risco é dinheiro real e conta em dinheiro", () => {
    const clv = betClv(bet({ odd: 2.2, closingOdd: 2, stake: 50, isRiskFree: true }))!;
    expect(clv.clvPct).toBe(10);
    expect(clv.moneyClv).toBe(5);
  });

  test("ignoradas e anuladas ficam de fora", () => {
    expect(betClv(bet({ odd: 2.1, closingOdd: 2, isIgnored: true }))).toBeNull();
    expect(betClv(bet({ odd: 2.1, closingOdd: 2, status: "ANULADA" }))).toBeNull();
    expect(isClvEligible(bet({ isIgnored: true }))).toBe(false);
    expect(isClvEligible(bet({ status: "ANULADA" }))).toBe(false);
    expect(isClvEligible(bet({ status: "POR_LIQUIDAR" }))).toBe(true);
  });

  test("uma aposta por liquidar com odd de fecho conta", () => {
    // É a diferença que justifica a feature: o CLV sabe-se antes do resultado.
    const clv = betClv(bet({ status: "POR_LIQUIDAR", odd: 3, closingOdd: 2.5, stake: 10 }))!;
    expect(clv.clvPct).toBe(20);
    expect(clv.moneyClv).toBe(2);
  });
});

describe("needsClosingOdd", () => {
  test("só depois de o evento começar", () => {
    expect(needsClosingOdd(bet({ dateTime: "2026-02-01 12:00" }), NOW)).toBe(true);
    expect(needsClosingOdd(bet({ dateTime: "2026-04-01 12:00" }), NOW)).toBe(false);
  });

  test("com odd de fecho já registada não precisa de nada", () => {
    expect(needsClosingOdd(bet({ closingOdd: 2 }), NOW)).toBe(false);
  });

  test("ignoradas e anuladas nunca aparecem na caixa de entrada", () => {
    expect(needsClosingOdd(bet({ isIgnored: true }), NOW)).toBe(false);
    expect(needsClosingOdd(bet({ status: "ANULADA" }), NOW)).toBe(false);
  });

  test("sem data válida não se sabe se já começou", () => {
    expect(needsClosingOdd(bet({ dateTime: "" }), NOW)).toBe(false);
  });
});

describe("calculateClv", () => {
  test("sem apostas seguidas não há dados", () => {
    const r = calculateClv([bet({ closingOdd: undefined })], NOW);
    expect(r.hasData).toBe(false);
    expect(r.trackedBets).toBe(0);
    expect(r.eligibleBets).toBe(1);
    expect(r.avgClvPct).toBe(0);
    expect(r.weightedClvPct).toBeNull();
  });

  test("médias, taxa de bater a linha e dinheiro", () => {
    const r = calculateClv(
      [
        bet({ odd: 2.1, closingOdd: 2, stake: 10 }), // +5%, +0.50
        bet({ odd: 1.9, closingOdd: 2, stake: 10 }), // -5%, -0.50
        bet({ odd: 2.2, closingOdd: 2, stake: 20 }), // +10%, +2.00
      ],
      NOW,
    );
    expect(r.trackedBets).toBe(3);
    expect(r.beatCloseRate).toBe(66.67);
    expect(r.avgClvPct).toBe(3.33);
    expect(r.moneyClv).toBe(2);
    expect(r.clvStake).toBe(40);
    expect(r.weightedClvPct).toBe(5);
  });

  test("a freebet entra na média e na taxa mas não no volume nem no dinheiro", () => {
    const r = calculateClv(
      [
        bet({ odd: 2.1, closingOdd: 2, stake: 10 }), // +5%, +0.50, real
        bet({ odd: 2.4, closingOdd: 2, stake: 10, isFreebet: true }), // +20%, 0
      ],
      NOW,
    );
    expect(r.trackedBets).toBe(2);
    expect(r.beatCloseRate).toBe(100);
    expect(r.avgClvPct).toBe(12.5);
    expect(r.moneyClv).toBe(0.5);
    expect(r.clvStake).toBe(10);
    expect(r.weightedClvPct).toBe(5);
  });

  test("cobertura e apostas por preencher", () => {
    const r = calculateClv(
      [
        bet({ odd: 2.1, closingOdd: 2 }),
        bet({ closingOdd: undefined, dateTime: "2026-02-01 12:00" }), // já começou
        bet({ closingOdd: undefined, dateTime: "2026-04-01 12:00" }), // ainda não
        bet({ closingOdd: 2, isIgnored: true }), // fora de tudo
      ],
      NOW,
    );
    expect(r.eligibleBets).toBe(3);
    expect(r.trackedBets).toBe(1);
    expect(r.pendingFill).toBe(1);
    expect(r.coveragePct).toBe(33.33);
  });

  test("a série é cronológica e acumulada", () => {
    const r = calculateClv(
      [
        bet({ odd: 2.2, closingOdd: 2, stake: 10, dateTime: "2026-02-10 12:00" }), // +1.00
        bet({ odd: 1.8, closingOdd: 2, stake: 10, dateTime: "2026-02-05 12:00" }), // -1.00
      ],
      NOW,
    );
    expect(r.series.map((p) => p.at)).toEqual(["2026-02-05", "2026-02-10"]);
    expect(r.series.map((p) => p.cumulative)).toEqual([-1, 0]);
  });

  test("agrupa por casa, com mais apostas primeiro", () => {
    const r = calculateClv(
      [
        bet({ bookmaker: "Betano", odd: 2.1, closingOdd: 2, stake: 10 }),
        bet({ bookmaker: "Betano", odd: 2.3, closingOdd: 2, stake: 10 }),
        bet({ bookmaker: "Betclic", odd: 1.9, closingOdd: 2, stake: 10 }),
      ],
      NOW,
    );
    expect(r.byBookmaker.map((b) => b.bookmaker)).toEqual(["Betano", "Betclic"]);
    expect(r.byBookmaker[0].bets).toBe(2);
    expect(r.byBookmaker[0].avgClvPct).toBe(10); // (5 + 15) / 2
    expect(r.byBookmaker[1].avgClvPct).toBe(-5);
  });
});
