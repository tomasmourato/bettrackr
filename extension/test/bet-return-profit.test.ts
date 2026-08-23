import { describe, expect, test } from "bun:test";
import { calculateBetReturnAndProfit } from "../../src/utils";

// A matematica de dinheiro da app inteira passa por aqui: formulario manual,
// importacao por screenshot, CSV/JSON e a extensao (que espelha esta funcao
// em extension/src/mapper.js). Ate agora nao tinha testes nenhuns.

const calc = calculateBetReturnAndProfit;

describe("cash bets", () => {
  test("settles wins, losses and voids", () => {
    expect(calc(10, 2, "GANHA", false)).toEqual({
      potentialReturn: 20, finalReturn: 20, netProfit: 10,
    });
    expect(calc(10, 2, "PERDIDA", false)).toEqual({
      potentialReturn: 20, finalReturn: 0, netProfit: -10,
    });
    expect(calc(10, 2, "ANULADA", false)).toEqual({
      potentialReturn: 20, finalReturn: 10, netProfit: 0,
    });
  });

  test("splits asian handicap half results", () => {
    // metade ganha a odd 3 + metade devolvida = 15 + 5
    expect(calc(10, 3, "MEIO_GANHA", false)).toEqual({
      potentialReturn: 30, finalReturn: 20, netProfit: 10,
    });
    expect(calc(10, 3, "MEIO_PERDIDA", false)).toEqual({
      potentialReturn: 30, finalReturn: 5, netProfit: -5,
    });
  });

  test("leaves pending bets with no realised money", () => {
    expect(calc(10, 2, "POR_LIQUIDAR", false)).toEqual({
      potentialReturn: 20, finalReturn: 0, netProfit: 0,
    });
  });

  test("takes the cashout value instead of deriving it from the odd", () => {
    expect(calc(10, 2, "CASHOUT", false, 7)).toEqual({
      potentialReturn: 20, finalReturn: 7, netProfit: -3,
    });
  });

  test("treats a risk free bet as real money", () => {
    expect(calc(10, 2, "PERDIDA", false, undefined, undefined, true)).toEqual({
      potentialReturn: 20, finalReturn: 0, netProfit: -10,
    });
  });
});

describe("SR freebets (stake returned)", () => {
  test("pays the full odd and risks no cash", () => {
    expect(calc(10, 2, "GANHA", true, undefined, "SR")).toEqual({
      potentialReturn: 20, finalReturn: 20, netProfit: 20,
    });
    expect(calc(10, 2, "PERDIDA", true, undefined, "SR")).toEqual({
      potentialReturn: 20, finalReturn: 0, netProfit: 0,
    });
  });

  test("returns the pushed half in cash on a half result", () => {
    expect(calc(10, 3, "MEIO_GANHA", true, undefined, "SR")).toEqual({
      potentialReturn: 30, finalReturn: 20, netProfit: 20,
    });
    expect(calc(10, 3, "MEIO_PERDIDA", true, undefined, "SR")).toEqual({
      potentialReturn: 30, finalReturn: 5, netProfit: 5,
    });
  });

  test("defaults to SR when the type is unknown, preserving old rows", () => {
    expect(calc(10, 2, "GANHA", true)).toEqual(
      calc(10, 2, "GANHA", true, undefined, "SR"),
    );
    expect(calc(10, 3, "MEIO_GANHA", true)).toEqual(
      calc(10, 3, "MEIO_GANHA", true, undefined, "SR"),
    );
  });
});

describe("SNR freebets (stake not returned)", () => {
  test("pays only the profit on a win", () => {
    expect(calc(10, 2, "GANHA", true, undefined, "SNR")).toEqual({
      potentialReturn: 10, finalReturn: 10, netProfit: 10,
    });
  });

  test("caps the potential return at the profit, not stake x odd", () => {
    expect(calc(10, 3, "POR_LIQUIDAR", true, undefined, "SNR").potentialReturn).toBe(20);
  });

  test("never returns the promotional stake on a half result", () => {
    // metade vencedora rende (10/2) * (3-1) = 10; a metade devolvida nao volta
    expect(calc(10, 3, "MEIO_GANHA", true, undefined, "SNR")).toEqual({
      potentialReturn: 20, finalReturn: 10, netProfit: 10,
    });
    // meia perdida: nada vence e a stake promocional nao volta
    expect(calc(10, 3, "MEIO_PERDIDA", true, undefined, "SNR")).toEqual({
      potentialReturn: 20, finalReturn: 0, netProfit: 0,
    });
  });

  test("stays below the SR variant on every settled outcome", () => {
    for (const status of ["GANHA", "MEIO_GANHA", "MEIO_PERDIDA"] as const) {
      const snr = calc(10, 3, status, true, undefined, "SNR").netProfit;
      const sr = calc(10, 3, status, true, undefined, "SR").netProfit;
      expect(snr).toBeLessThan(sr);
    }
  });
});
