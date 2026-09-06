import { describe, expect, test } from "bun:test";
import { combineFormOdds, mergeSelection, type FormSelectionRow } from "../../src/lib/betFormSelections";
import { parseDecimal } from "../../src/utils";
import type { Selection } from "../../src/types";

// O formulário edita cinco campos por perna. A perna gravada tem muito mais, e
// enquanto se listou campo a campo o que havia a preservar, cada campo novo
// era esquecido - abrir e gravar uma aposta importada apagava o `sourceRef`, o
// `startsAtUtc` e a marca de anulada.

// Uma perna como a extensão a grava, com tudo o que o ecrã não mostra.
const importada: Selection = {
  id: "sel-antigo",
  event: "Coquimbo Unido - Huachipato",
  market: "Resultado (Tempo Regulamentar)",
  choice: "Coquimbo Unido",
  odd: 1.43,
  closingOdd: 1.33,
  closingOddNoVig: 1.44,
  closingOddMargin: 8.2,
  startsAt: "2026-08-31 01:00",
  startsAtUtc: "2026-08-31T00:00:00.000Z",
  isBoosted: false,
  sport: "Futebol",
  betType: "SIMPLES",
  result: "ANULADA",
  sourceRef: { matchId: "m-1", marketId: "k-1", selectionId: "s-1" },
};

const linha = (over: Partial<FormSelectionRow> = {}): FormSelectionRow => ({
  event: importada.event,
  market: importada.market,
  choice: importada.choice,
  odd: "1.43",
  closingOdd: "1.33",
  startsAt: importada.startsAt,
  result: importada.result,
  original: importada,
  ...over,
});

describe("mergeSelection", () => {
  test("gravar sem tocar em nada preserva a perna toda", () => {
    // O bug: isto devolvia sete campos e deitava fora os outros seis.
    const perna = mergeSelection(linha(), "sel-novo", 1.43, 1.33);
    expect(perna.sourceRef).toEqual(importada.sourceRef);
    expect(perna.startsAtUtc).toBe("2026-08-31T00:00:00.000Z");
    expect(perna.result).toBe("ANULADA");
    expect(perna.isBoosted).toBe(false);
    expect(perna.sport).toBe("Futebol");
    expect(perna.betType).toBe("SIMPLES");
    expect(perna.closingOddNoVig).toBe(1.44);
    expect(perna.closingOddMargin).toBe(8.2);
  });

  test("sem sourceRef o agente nunca mais lê aquela perna", () => {
    // É a consequência que dói: a odd de fecho deixava de poder ser capturada.
    expect(mergeSelection(linha(), "x", 1.43, 1.33).sourceRef?.selectionId).toBe("s-1");
  });

  test("o que o formulário edita manda", () => {
    const perna = mergeSelection(
      linha({ event: "  Outro jogo  ", choice: " Empate ", market: " 1X2 " }),
      "sel-novo",
      2.5,
      1.9,
    );
    expect(perna.id).toBe("sel-novo");
    expect(perna.event).toBe("Outro jogo");
    expect(perna.choice).toBe("Empate");
    expect(perna.market).toBe("1X2");
    expect(perna.odd).toBe(2.5);
    expect(perna.closingOdd).toBe(1.9);
  });

  test("apagar a odd de fecho apaga-a mesmo", () => {
    // É assim que o site consegue LIMPAR uma odd de fecho. Herdá-la da
    // original tornava-a impossível de tirar.
    const perna = mergeSelection(linha({ closingOdd: "" }), "x", 1.43, null);
    expect(perna.closingOdd).toBeUndefined();
  });

  test("mudada a odd de fecho, a justa e a margem vão atrás", () => {
    // Pertencem à odd crua de onde saíram. Uma justa de 1.44 ao lado de uma
    // crua de 1.90 é uma margem que não é de lado nenhum.
    const perna = mergeSelection(linha({ closingOdd: "1.90" }), "x", 1.43, 1.9);
    expect(perna.closingOdd).toBe(1.9);
    expect(perna.closingOddNoVig).toBeUndefined();
    expect(perna.closingOddMargin).toBeUndefined();
  });

  test("apagada a odd de fecho, a justa e a margem também", () => {
    const perna = mergeSelection(linha({ closingOdd: "" }), "x", 1.43, null);
    expect(perna.closingOddNoVig).toBeUndefined();
    expect(perna.closingOddMargin).toBeUndefined();
  });

  test("uma perna nova, sem original, continua a nascer bem", () => {
    const nova: FormSelectionRow = {
      event: "Benfica - Porto", market: "1X2", choice: "Benfica",
      odd: "2.10", closingOdd: "",
    };
    const perna = mergeSelection(nova, "sel-1", 2.1, null);
    expect(perna).toEqual({
      id: "sel-1", event: "Benfica - Porto", market: "1X2",
      choice: "Benfica", odd: 2.1,
    });
  });
});

describe("combineFormOdds", () => {
  const perna = (odd: string, result?: FormSelectionRow["result"]): FormSelectionRow =>
    ({ event: "e", market: "m", choice: "c", odd, closingOdd: "", result });

  test("produto das pernas", () => {
    expect(combineFormOdds([perna("1.43"), perna("1.21")], parseDecimal)).toBe(1.73);
  });

  test("a perna anulada não entra - e era isto que corrompia a aposta", () => {
    // Caso real: a Betclic anulou o Coquimbo e pagou a dupla a 1.21. Gravar
    // pelo formulário devolvia-lhe 1.73, uma odd que ninguém pagou.
    expect(combineFormOdds([perna("1.43", "ANULADA"), perna("1.21")], parseDecimal)).toBe(1.21);
  });

  test("as outras marcas de resultado contam na mesma", () => {
    expect(combineFormOdds([perna("1.43", "GANHA"), perna("1.21", "PERDIDA")], parseDecimal)).toBe(1.73);
  });

  test("sem pernas válidas vale 1.00", () => {
    expect(combineFormOdds([perna("1.43", "ANULADA")], parseDecimal)).toBe(1.0);
    expect(combineFormOdds([], parseDecimal)).toBe(1.0);
  });
});
