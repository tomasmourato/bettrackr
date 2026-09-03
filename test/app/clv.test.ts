import { describe, expect, test } from "bun:test";
import {
  betClv,
  calculateClv,
  combineClosingOdds,
  isClvEligible,
  isPromoBet,
  kickoffOf,
  needsClosingOdd,
  betClvNoVig,
} from "../../src/lib/clv";
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

describe("combineClosingOdds", () => {
  const leg = (closingOdd?: number) => ({ closingOdd });

  test("produto das pernas, com duas casas", () => {
    // 2.10 x 1.80 = 3.78
    expect(combineClosingOdds([leg(2.1), leg(1.8)])).toBe(3.78);
  });

  test("uma simples é a própria odd", () => {
    expect(combineClosingOdds([leg(2.5)])).toBe(2.5);
  });

  test("faltando uma perna não há combinada", () => {
    // Meia múltipla não dá meia linha de fecho: dava um número que parecia
    // bom e não era.
    expect(combineClosingOdds([leg(2.1), leg(undefined)])).toBeNull();
    expect(combineClosingOdds([])).toBeNull();
    expect(combineClosingOdds(undefined)).toBeNull();
  });

  test("odds impossíveis contam como ausentes", () => {
    expect(combineClosingOdds([leg(2.1), leg(1)])).toBeNull();
    expect(combineClosingOdds([leg(2.1), leg(0)])).toBeNull();
  });

  // ----------------------------------------------------------
  // Pernas anuladas
  //
  // Quando um jogo não se realiza, a casa devolve àquela perna o valor 1 e
  // volta a liquidar o boletim com as restantes - a odd da aposta desce.
  // A linha de fecho tem de descer com ela, senão comparam-se coisas
  // diferentes.
  // ----------------------------------------------------------
  const anulada = (closingOdd?: number) => ({ closingOdd, result: "ANULADA" });

  test("a perna anulada sai do produto", () => {
    // Caso real de 31/08/2026: Coquimbo Unido @1.43 (fecho 1.33) anulado,
    // Saprissa @1.21 (fecho 1.16) ganho. A Betclic pagou a 1.21.
    expect(combineClosingOdds([anulada(1.33), leg(1.16)])).toBe(1.16);
  });

  test("o CLV deixa de ser um número inventado", () => {
    // A odd que a casa pagou, contra a linha de fecho das pernas que contaram.
    const fecho = combineClosingOdds([anulada(1.33), leg(1.16)])!;
    expect(Number((((1.21 / fecho) - 1) * 100).toFixed(1))).toBe(4.3);
    // Com a perna anulada lá dentro, a combinada era 1.33 x 1.16 arredondado
    // às duas casas com que fica gravada - 1.54 - e o painel mostrava -21.4%,
    // que era o preço de uma perna dividido pela linha de duas.
    const errado = Number((1.33 * 1.16).toFixed(2));
    expect(errado).toBe(1.54);
    expect(Number((((1.21 / errado) - 1) * 100).toFixed(1))).toBe(-21.4);
  });

  test("uma perna anulada SEM odd de fecho não trava a combinada", () => {
    // O jogo não se realizou, por isso não há linha de fecho nenhuma para ler.
    // Antes isto deixava a múltipla eternamente "incompleta".
    expect(combineClosingOdds([anulada(undefined), leg(1.16)])).toBe(1.16);
  });

  test("todas anuladas não dá combinada", () => {
    expect(combineClosingOdds([anulada(1.33), anulada(1.16)])).toBeNull();
  });

  test("as pernas que contam continuam a ter de estar completas", () => {
    expect(combineClosingOdds([anulada(1.33), leg(2.1), leg(undefined)])).toBeNull();
  });
});

describe("kickoffOf e needsClosingOdd com o apito", () => {
  test("numa múltipla vale o jogo que começa por último", () => {
    const b = bet({
      selections: [
        { id: "a", event: "A", market: "m", choice: "c", odd: 2, startsAt: "2026-02-10 18:00" },
        { id: "b", event: "B", market: "m", choice: "c", odd: 2, startsAt: "2026-02-11 21:00" },
      ],
    });
    expect(kickoffOf(b)).toBe("2026-02-11 21:00");
  });

  test("o apito manda sobre a data do boletim", () => {
    // Na Betclic o dateTime é o momento da aposta: sem esta regra, uma aposta
    // feita hoje para sábado aparecia hoje em "por preencher".
    const futuro = bet({
      dateTime: "2026-02-01 10:00",
      selections: [
        { id: "a", event: "A", market: "m", choice: "c", odd: 2, startsAt: "2026-04-01 20:00" },
      ],
    });
    expect(needsClosingOdd(futuro, NOW)).toBe(false);

    const passado = bet({
      dateTime: "2026-02-01 10:00",
      selections: [
        { id: "a", event: "A", market: "m", choice: "c", odd: 2, startsAt: "2026-02-02 20:00" },
      ],
    });
    expect(needsClosingOdd(passado, NOW)).toBe(true);
  });

  test("sem apito nas pernas cai na data do boletim", () => {
    expect(kickoffOf(bet())).toBeUndefined();
    expect(needsClosingOdd(bet({ dateTime: "2026-02-01 12:00" }), NOW)).toBe(true);
  });
});

describe("apostas promocionais (boost/turbo/missão)", () => {
  const promoLeg = (market: string, odd = 2.4) => ({
    id: "p",
    event: "Benfica - Porto",
    market,
    choice: "Benfica",
    odd,
  });

  test("reconhece os mercados promocionais da Betclic", () => {
    // "Boost (10€ máx.)" é o segundo mercado mais usado da conta real.
    expect(isPromoBet(bet({ selections: [promoLeg("Boost (10€ máx.)")] }))).toBe(true);
    expect(isPromoBet(bet({ selections: [promoLeg("Odds Turbo")] }))).toBe(true);
    expect(isPromoBet(bet({ selections: [promoLeg("Missão da semana")] }))).toBe(true);
    expect(isPromoBet(bet({ selections: [promoLeg("Super Odd")] }))).toBe(true);
  });

  test("um mercado normal não é promocional", () => {
    expect(isPromoBet(bet({ selections: [promoLeg("Vencedor do jogo")] }))).toBe(false);
    // "Dicas da Casa" é uma sugestão a preço normal, não um preço turbinado.
    expect(isPromoBet(bet({ selections: [promoLeg("Dicas da Casa")] }))).toBe(false);
    expect(isPromoBet(bet({ selections: [] }))).toBe(false);
  });

  test("basta uma perna turbinada para o boletim contar como promocional", () => {
    const misto = bet({
      selections: [promoLeg("Vencedor do jogo"), promoLeg("Boost (10€ máx.)")],
    });
    expect(isPromoBet(misto)).toBe(true);
  });

  test("fica fora das médias e aparece na sua linha", () => {
    const r = calculateClv(
      [
        bet({ odd: 2.1, closingOdd: 2, stake: 10 }), // normal: +5%, +0.50
        bet({
          odd: 3,
          closingOdd: 2,
          stake: 10,
          selections: [promoLeg("Boost (10€ máx.)", 3)],
        }), // promocional: +50%, +5.00
      ],
      NOW,
    );

    expect(r.trackedBets).toBe(2);
    expect(r.ratedBets).toBe(1);
    // Sem a separação, a média seria +27.5% - um número construído sobre uma
    // odd que a casa turbinou de propósito.
    expect(r.avgClvPct).toBe(5);
    expect(r.beatCloseRate).toBe(100);
    expect(r.moneyClv).toBe(0.5);
    expect(r.clvStake).toBe(10);

    expect(r.promoBets).toBe(1);
    expect(r.promoAvgClvPct).toBe(50);
    expect(r.promoMoneyClv).toBe(5);
  });

  test("continua a contar para a cobertura", () => {
    // A cobertura é sobre dados preenchidos: uma promocional com linha de
    // fecho está preenchida na mesma.
    const r = calculateClv(
      [bet({ odd: 3, closingOdd: 2, selections: [promoLeg("Boost (10€ máx.)", 3)] })],
      NOW,
    );
    expect(r.coveragePct).toBe(100);
    expect(r.hasData).toBe(true);
    expect(r.avgClvPct).toBe(0); // não há nenhuma medível
  });

  test("fora do gráfico e do agrupamento por casa", () => {
    const r = calculateClv(
      [bet({ odd: 3, closingOdd: 2, selections: [promoLeg("Boost (10€ máx.)", 3)] })],
      NOW,
    );
    expect(r.series).toHaveLength(0);
    expect(r.byBookmaker).toHaveLength(0);
  });
});

describe("a marca de boost da própria Betclic", () => {
  test("isBoosted manda, mesmo com o mercado a parecer normal", () => {
    // A Betclic marca boosts que o rótulo do mercado não denuncia; sem a flag
    // a expressão regular deixava-os passar para dentro das médias.
    const b = bet({
      selections: [
        { id: "s", event: "A", market: "Vencedor do jogo", choice: "c", odd: 3, isBoosted: true },
      ],
    });
    expect(isPromoBet(b)).toBe(true);
  });

  test("sem a flag, o texto do mercado ainda serve de rede", () => {
    // As apostas à mão e as importadas de CSV não trazem is_boosted_odd.
    const b = bet({
      selections: [{ id: "s", event: "A", market: "Boost (10€ máx.)", choice: "c", odd: 3 }],
    });
    expect(isPromoBet(b)).toBe(true);
  });

  test("isBoosted falso não torna promocional", () => {
    const b = bet({
      selections: [
        { id: "s", event: "A", market: "Vencedor do jogo", choice: "c", odd: 3, isBoosted: false },
      ],
    });
    expect(isPromoBet(b)).toBe(false);
  });
});

// ------------------------------------------------------------
// CLV sem a margem da casa
//
// A odd de fecho crua traz a margem lá dentro, e isso INFLACIONA o CLV - não o
// encolhe, como se tinha assumido. Estes testes fixam a medida honesta e o
// facto de ela andar à parte: só uma parte das pernas tem mercado completo, e
// misturar as duas numa média só daria um número sem significado.
// ------------------------------------------------------------

describe("betClvNoVig", () => {
  test("mede contra a linha sem margem, não contra a crua", () => {
    // Números reais de um 1X2 da Betclic: fecho cru 1.23, margem 9.8%,
    // fecho justo 1.351. Quem apanhou 1.30 pagou acima do preço justo.
    const b = bet({ odd: 1.3, closingOdd: 1.23, closingOddNoVig: 1.351, stake: 10 });
    expect(betClv(b)!.clvPct).toBe(5.69); // o que a margem fazia parecer
    expect(betClvNoVig(b)!.clvPct).toBe(-3.77); // o que na verdade foi
  });

  test("sem odd justa não há medida - e não se inventa", () => {
    expect(betClvNoVig(bet({ odd: 2.1, closingOdd: 2 }))).toBeNull();
  });

  test("uma freebet vale 0 em dinheiro, aqui como no cru", () => {
    const b = bet({ odd: 2.2, closingOddNoVig: 2, stake: 10, isFreebet: true });
    expect(betClvNoVig(b)!.moneyClv).toBe(0);
    expect(betClvNoVig(b)!.clvPct).toBe(10);
  });
});

describe("calculateClv com odds sem margem", () => {
  test("a média sem margem só conta quem tem odd justa", () => {
    const s = calculateClv([
      bet({ odd: 2.2, closingOdd: 2, closingOddNoVig: 2.1, stake: 10 }),
      bet({ odd: 2.2, closingOdd: 2, stake: 10 }), // sem mercado completo
    ]);
    expect(s.ratedBets).toBe(2); // as duas contam para o CLV cru
    expect(s.noVigBets).toBe(1); // só uma para o CLV sem margem
    // 2.2 / 2.1 - 1 = +4.76%
    expect(s.noVigAvgClvPct).toBe(4.76);
  });

  test("o CLV sem margem é sempre MENOR do que o cru", () => {
    const s = calculateClv([
      bet({ odd: 2.2, closingOdd: 2, closingOddNoVig: 2.1, stake: 10 }),
    ]);
    expect(s.avgClvPct).toBe(10);
    expect(s.noVigAvgClvPct).toBe(4.76);
    expect(s.noVigAvgClvPct).toBeLessThan(s.avgClvPct);
  });

  test("a margem média fica guardada, para se poder auditar", () => {
    const s = calculateClv([
      bet({
        odd: 2.2,
        closingOdd: 2,
        closingOddNoVig: 2.1,
        selections: [
          { id: "a", event: "e", market: "m", choice: "c", odd: 2.2, closingOddMargin: 9.8 },
        ],
      }),
    ]);
    expect(s.noVigAvgMarginPct).toBe(9.8);
  });

  test("sem nenhuma odd justa a secção fica a zeros e a UI esconde-a", () => {
    const s = calculateClv([bet({ odd: 2.2, closingOdd: 2 })]);
    expect(s.noVigBets).toBe(0);
    expect(s.noVigAvgClvPct).toBe(0);
  });
});
