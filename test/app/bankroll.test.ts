import { describe, expect, test } from "bun:test";
import { calculateBankroll } from "../../src/lib/bankroll";
import type { Bet, BankrollMovement, BankrollMovementKind, BetStatus } from "../../src/types";

// O saldo da banca é derivado: movimentos + lucro das apostas liquidadas.
// Estes testes fixam as regras que decidem o que entra nessa conta.

function mov(
  kind: BankrollMovementKind,
  amount: number,
  occurredAt = "2026-01-01 10:00",
): BankrollMovement {
  return { id: `${kind}-${amount}-${occurredAt}`, kind, amount, occurredAt };
}

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

describe("movements", () => {
  test("sums deposits, withdrawals and adjustments with the right signs", () => {
    const r = calculateBankroll(
      [mov("DEPOSITO", 500), mov("LEVANTAMENTO", -200), mov("AJUSTE", 25)],
      [],
    );
    expect(r.deposited).toBe(500);
    expect(r.withdrawn).toBe(200);
    expect(r.adjustments).toBe(25);
    expect(r.balance).toBe(325);
  });

  test("lets an adjustment go negative", () => {
    const r = calculateBankroll([mov("DEPOSITO", 100), mov("AJUSTE", -40)], []);
    expect(r.balance).toBe(60);
  });
});

describe("settled bets move the balance by their net profit", () => {
  test("a win adds and a loss subtracts", () => {
    const win = calculateBankroll([mov("DEPOSITO", 100)], [bet({ netProfit: 10 })]);
    expect(win.balance).toBe(110);
    expect(win.betsProfit).toBe(10);

    const loss = calculateBankroll(
      [mov("DEPOSITO", 100)],
      [bet({ status: "PERDIDA", finalReturn: 0, netProfit: -10 })],
    );
    expect(loss.balance).toBe(90);
  });

  test("a lost freebet leaves the balance untouched", () => {
    // A regra em que assenta o modelo derivado: a stake de uma freebet nunca
    // foi dinheiro do utilizador, e o netProfit ja traduz isso como 0.
    const r = calculateBankroll(
      [mov("DEPOSITO", 100)],
      [bet({ isFreebet: true, status: "PERDIDA", finalReturn: 0, netProfit: 0 })],
    );
    expect(r.balance).toBe(100);
    expect(r.betsProfit).toBe(0);
  });

  test("a won freebet adds only what the bookmaker paid", () => {
    const r = calculateBankroll(
      [mov("DEPOSITO", 100)],
      [bet({ isFreebet: true, freebetType: "SNR", finalReturn: 10, netProfit: 10 })],
    );
    expect(r.balance).toBe(110);
  });

  test("ignores bets marked as ignored", () => {
    const r = calculateBankroll(
      [mov("DEPOSITO", 100)],
      [bet({ isIgnored: true, netProfit: 50 })],
    );
    expect(r.balance).toBe(100);
    expect(r.betsProfit).toBe(0);
  });
});

describe("exposure", () => {
  test("pending cash bets lock money without moving the balance", () => {
    const r = calculateBankroll(
      [mov("DEPOSITO", 100)],
      [bet({ status: "POR_LIQUIDAR", stake: 30, finalReturn: 0, netProfit: 0 })],
    );
    expect(r.balance).toBe(100);
    expect(r.exposure).toBe(30);
    expect(r.available).toBe(70);
  });

  test("pending freebets and ignored bets lock nothing", () => {
    const r = calculateBankroll(
      [mov("DEPOSITO", 100)],
      [
        bet({ status: "POR_LIQUIDAR", isFreebet: true, stake: 30, netProfit: 0 }),
        bet({ status: "POR_LIQUIDAR", isIgnored: true, stake: 40, netProfit: 0 }),
      ],
    );
    expect(r.exposure).toBe(0);
    expect(r.available).toBe(100);
  });
});

describe("roi on the bankroll", () => {
  test("is profit over capital deposited, not over turnover", () => {
    // 4 apostas de 100 com 20 de lucro total: yield seria 5%, o ROI da banca e 20%.
    const bets = [
      bet({ stake: 100, netProfit: 30, finalReturn: 130 }),
      bet({ stake: 100, status: "PERDIDA", netProfit: -10, finalReturn: 90 }),
    ];
    const r = calculateBankroll([mov("DEPOSITO", 100)], bets);
    expect(r.betsProfit).toBe(20);
    expect(r.roi).toBe(20);
  });

  test("is null when nothing was deposited", () => {
    expect(calculateBankroll([], []).roi).toBeNull();
    expect(calculateBankroll([mov("AJUSTE", 50)], []).roi).toBeNull();
  });
});

describe("max drawdown", () => {
  test("measures the largest peak to trough fall", () => {
    // 0 -> 100 -> 160 -> 60 : pico 160, vale 60, queda 100 (62.5%)
    const r = calculateBankroll(
      [mov("DEPOSITO", 100, "2026-01-01 10:00")],
      [
        bet({ dateTime: "2026-01-02 10:00", netProfit: 60 }),
        bet({ dateTime: "2026-01-03 10:00", status: "PERDIDA", netProfit: -100 }),
      ],
    );
    expect(r.balance).toBe(60);
    expect(r.maxDrawdown).toBe(100);
    expect(r.maxDrawdownPct).toBe(62.5);
  });

  test("is zero when the balance only ever climbs", () => {
    const r = calculateBankroll(
      [mov("DEPOSITO", 100, "2026-01-01 10:00")],
      [bet({ dateTime: "2026-01-02 10:00", netProfit: 40 })],
    );
    expect(r.maxDrawdown).toBe(0);
    expect(r.maxDrawdownPct).toBeNull();
  });
});

describe("balance series", () => {
  test("merges movements and bets chronologically whatever the input order", () => {
    const r = calculateBankroll(
      [mov("DEPOSITO", 100, "2026-03-01 09:00"), mov("DEPOSITO", 50, "2026-01-01 09:00")],
      [bet({ dateTime: "2026-02-01 09:00", netProfit: 25 })],
    );
    expect(r.series.map((p) => p.at)).toEqual(["2026-01-01", "2026-02-01", "2026-03-01"]);
    expect(r.series.map((p) => p.balance)).toEqual([50, 75, 175]);
    expect(r.series.map((p) => p.source)).toEqual(["MOVEMENT", "BET", "MOVEMENT"]);
  });
});

describe("empty state", () => {
  test("reports no data and never produces NaN", () => {
    const r = calculateBankroll([], []);
    expect(r.hasData).toBe(false);
    expect(r.balance).toBe(0);
    expect(r.available).toBe(0);
    expect(r.exposure).toBe(0);
    expect(r.maxDrawdown).toBe(0);
    expect(r.roi).toBeNull();
    expect(r.maxDrawdownPct).toBeNull();
    expect(r.series).toEqual([]);
    for (const value of [r.balance, r.deposited, r.withdrawn, r.betsProfit, r.available]) {
      expect(Number.isNaN(value)).toBe(false);
    }
  });

  test("flags hasData once there is a movement", () => {
    expect(calculateBankroll([mov("DEPOSITO", 10)], []).hasData).toBe(true);
  });
});
