import { describe, expect, test } from "bun:test";
import { buildClvProfile, marketFamily, AMOSTRA_MINIMA } from "../../lib/clvProfile";
import { calculateClv } from "../../src/lib/clv";
import { clvForPick } from "../../routes/insightsRoutes";
import type { Bet } from "../../src/types";

// O retrato do CLV que vai como contexto para a IA. O que aqui se protege é a
// EQUIVALÊNCIA com o painel: são dois leitores da mesma coisa, e no dia em que
// divergirem a app diz um número ao utilizador e outro ao modelo - sem ninguém
// dar por isso, porque nenhum dos dois está errado sozinho.

function bet(over: Partial<Bet> = {}): Bet {
  return {
    id: Math.random().toString(36).slice(2),
    type: "SIMPLES",
    status: "GANHA",
    stake: 10,
    odd: 2,
    closingOdd: 1.9,
    bookmaker: "Betclic",
    dateTime: "2026-08-29 20:00",
    selections: [{ event: "A - B", market: "Resultado Final", choice: "A", odd: 2, sport: "Futebol" }],
    ...over,
  } as Bet;
}

/** N apostas iguais, para chegar à amostra mínima sem repetir código. */
const varias = (n: number, over: Partial<Bet> = {}) => Array.from({ length: n }, () => bet(over));

describe("marketFamily", () => {
  test("as linhas de Acima/Abaixo caem todas na mesma família", () => {
    // Sem isto cada linha é um mercado só seu e nenhuma chega à amostra.
    for (const nome of ["Mais de 2.5", "Menos de 3,5", "Total de golos - acima/abaixo", "Over 1.5"]) {
      expect(marketFamily(nome)).toBe("Acima/Abaixo");
    }
  });

  test("as famílias que se sabem nomear", () => {
    expect(marketFamily("As duas equipas marcam")).toBe("Ambas marcam");
    expect(marketFamily("Handicap Asiático")).toBe("Handicap");
    expect(marketFamily("Resultado correcto")).toBe("Resultado exato");
    expect(marketFamily("Resultado duplo")).toBe("Dupla hipótese");
    expect(marketFamily("Um dos jogadores marca")).toBe("Marcadores");
  });

  test("um mercado desconhecido fica com o nome que tinha", () => {
    // Melhor uma etiqueta feia do que juntar mercados que não têm que ver.
    expect(marketFamily("Cantos asiáticos 9.5")).toBe("Cantos asiáticos 9.5");
  });

  test("vazio é vazio, e não uma família chamada nada", () => {
    expect(marketFamily(undefined)).toBe("");
    expect(marketFamily("  ")).toBe("");
  });
});

describe("buildClvProfile", () => {
  test("sem amostra não há retrato - null, e não zeros", () => {
    // Zeros no prompt seriam lidos pelo modelo como "esta pessoa é média".
    expect(buildClvProfile(varias(AMOSTRA_MINIMA - 1))).toBeNull();
    expect(buildClvProfile([])).toBeNull();
  });

  test("as médias são as MESMAS que o painel mostra", () => {
    const bets = [
      ...varias(4, { odd: 2, closingOdd: 1.8 }),
      ...varias(3, { odd: 1.5, closingOdd: 1.6, stake: 25 }),
      ...varias(2, { odd: 3, closingOdd: 3, stake: 5 }),
    ];

    const painel = calculateClv(bets);
    const retrato = buildClvProfile(bets)!;

    expect(retrato.bets).toBe(painel.ratedBets);
    expect(retrato.avgClvPct).toBe(painel.avgClvPct);
    expect(retrato.beatCloseRate).toBe(painel.beatCloseRate);
    expect(retrato.weightedClvPct!).toBeCloseTo(painel.weightedClvPct!, 1);
  });

  test("as promocionais ficam de fora, como no painel", () => {
    const normais = varias(6, { odd: 2, closingOdd: 1.8 });
    const turbinadas = varias(6, {
      odd: 3,
      closingOdd: 1.8,
      selections: [{ event: "A - B", market: "Boost (10€ máx.)", choice: "A", odd: 3, isBoosted: true }],
    } as Partial<Bet>);

    const so = buildClvProfile(normais)!;
    const com = buildClvProfile([...normais, ...turbinadas])!;

    expect(com.bets).toBe(so.bets);
    expect(com.avgClvPct).toBe(so.avgClvPct);
  });

  test("uma aposta sem odd de fecho não entra", () => {
    const bets = [...varias(5), ...varias(3, { closingOdd: undefined })];
    expect(buildClvProfile(bets)!.bets).toBe(5);
  });

  test("as ignoradas e as anuladas não entram", () => {
    const bets = [...varias(5), ...varias(4, { isIgnored: true }), ...varias(4, { status: "ANULADA" })];
    expect(buildClvProfile(bets)!.bets).toBe(5);
  });

  test("uma família só aparece com amostra que chegue", () => {
    const bets = [
      ...varias(AMOSTRA_MINIMA, {
        selections: [{ event: "A - B", market: "Mais de 2.5", choice: "Mais", odd: 2, sport: "Futebol" }],
      } as Partial<Bet>),
      // Duas de handicap não chegam para se dizer nada sobre handicaps.
      ...varias(2, {
        selections: [{ event: "C - D", market: "Handicap Asiático", choice: "C", odd: 2, sport: "Futebol" }],
      } as Partial<Bet>),
    ];

    const retrato = buildClvProfile(bets)!;
    expect(retrato.byMarketFamily.map((l) => l.label)).toEqual(["Acima/Abaixo"]);
  });

  test("as linhas por mercado somam pelo boletim, não pela perna", () => {
    // Numa múltipla com dois mercados o boletim conta uma vez em cada família -
    // é o CLV do boletim que se mede, e não há CLV por perna.
    const multipla = varias(AMOSTRA_MINIMA, {
      type: "MULTIPLA",
      odd: 4,
      closingOdd: 3.6,
      selections: [
        { event: "A - B", market: "Mais de 2.5", choice: "Mais", odd: 2, sport: "Futebol" },
        { event: "C - D", market: "As duas equipas marcam", choice: "Sim", odd: 2, sport: "Futebol" },
      ],
    } as Partial<Bet>);

    const retrato = buildClvProfile(multipla)!;
    expect(retrato.bets).toBe(AMOSTRA_MINIMA);
    expect(retrato.byMarketFamily.map((l) => l.label).sort()).toEqual(["Acima/Abaixo", "Ambas marcam"]);
    for (const linha of retrato.byMarketFamily) expect(linha.bets).toBe(AMOSTRA_MINIMA);
  });

  test("o CLV é positivo quando se apanhou melhor preço do que o fecho", () => {
    const retrato = buildClvProfile(varias(5, { odd: 2, closingOdd: 1.8 }))!;
    // 2 / 1.8 - 1 = +11.11%
    expect(retrato.avgClvPct).toBeCloseTo(11.11, 1);
    expect(retrato.beatCloseRate).toBe(100);
  });

  test("as freebets contam na percentagem mas não no peso", () => {
    const bets = varias(5, { isFreebet: true, odd: 2, closingOdd: 1.8 });
    const retrato = buildClvProfile(bets)!;
    expect(retrato.bets).toBe(5);
    // Sem dinheiro real não há volume sobre o qual ponderar.
    expect(retrato.weightedClvPct).toBeNull();
  });
});

// ------------------------------------------------------------
// A anotação das dicas do dia
//
// A lista é UMA por (dia, idioma), partilhada por toda a gente; só a anotação
// é de cada um. O que aqui se fixa é a ordem de preferência - o mercado diz
// mais do que o desporto - e o silêncio quando não há histórico.
// ------------------------------------------------------------
describe("clvForPick", () => {
  const perfil = {
    bets: 30,
    avgClvPct: 1.5,
    beatCloseRate: 55,
    weightedClvPct: 1.2,
    byMarketFamily: [{ label: "Acima/Abaixo", bets: 12, avgClvPct: 3.4, beatCloseRate: 66 }],
    bySport: [{ label: "Futebol", bets: 30, avgClvPct: 1.5, beatCloseRate: 55 }],
    byBookmaker: [{ label: "Betclic", bets: 30, avgClvPct: 1.5, beatCloseRate: 55 }],
  };

  const pick = (over: Record<string, unknown> = {}) =>
    ({
      sport: "Futebol",
      competition: "Liga",
      match: "A - B",
      kickoffLisbon: "20:00",
      market: "Mais de 2.5",
      selection: "Mais",
      approxOdd: 1.9,
      confidence: 3,
      rationale: "",
      ...over,
    }) as any;

  test("o mercado ganha ao desporto quando há histórico nos dois", () => {
    const r = clvForPick(pick(), perfil)!;
    expect(r.scope).toBe("market");
    expect(r.avgClvPct).toBe(3.4);
    expect(r.bets).toBe(12);
  });

  test("sem histórico no mercado, o desporto ainda diz alguma coisa", () => {
    const r = clvForPick(pick({ market: "Cantos asiáticos" }), perfil)!;
    expect(r.scope).toBe("sport");
    expect(r.avgClvPct).toBe(1.5);
  });

  test("sem histórico nenhum não se inventa uma linha", () => {
    expect(clvForPick(pick({ market: "Cantos", sport: "Ténis" }), perfil)).toBeNull();
  });

  test("sem retrato não há anotação", () => {
    expect(clvForPick(pick(), null)).toBeNull();
  });
});
