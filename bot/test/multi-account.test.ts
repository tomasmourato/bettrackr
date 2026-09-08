import { describe, expect, test } from "bun:test";
import { withAccountId, parseActivations } from "../src/bettrackr";

// Multi-conta: cada conta Betclic importa para a sua bookie_account. O bot
// etiqueta as apostas com o accountId e le uma ativacao por conta do servidor.

describe("withAccountId", () => {
  test("etiqueta a aposta com o accountId, sem mutar o original", () => {
    const bet = { stake: 10, odd: 2, metadata: { importKey: "betclic:1" } };
    const out = withAccountId(bet, "acc-1");
    expect(out.accountId).toBe("acc-1");
    expect((bet as any).accountId).toBeUndefined(); // original intacto
  });

  test("sem accountId, devolve a aposta tal como veio (sem conta)", () => {
    const bet = { stake: 10 };
    expect(withAccountId(bet, null)).toBe(bet);
    expect(withAccountId(bet, undefined)).toBe(bet);
    expect(withAccountId(bet, "")).toBe(bet);
  });
});

describe("parseActivations", () => {
  test("le uma ativacao por conta", () => {
    const out = parseActivations({
      activations: [
        { accountId: "a1", token: "eyJ.a.a", expiresAt: "2026-01-01" },
        { accountId: "a2", token: "eyJ.b.b" },
      ],
    });
    expect(out).toEqual([
      { accountId: "a1", token: "eyJ.a.a" },
      { accountId: "a2", token: "eyJ.b.b" },
    ]);
  });

  test("ignora entradas sem accountId ou sem token", () => {
    const out = parseActivations({
      activations: [
        { accountId: "a1", token: "t1" },
        { accountId: "", token: "t2" }, // sem conta
        { accountId: "a3", token: "" }, // sem token
        { token: "t4" }, // sem conta
        { accountId: "a5" }, // sem token
      ],
    });
    expect(out).toEqual([{ accountId: "a1", token: "t1" }]);
  });

  test("corpo vazio ou mal formado -> lista vazia", () => {
    expect(parseActivations({})).toEqual([]);
    expect(parseActivations({ activations: null })).toEqual([]);
    expect(parseActivations(null)).toEqual([]);
    expect(parseActivations({ activations: "nope" })).toEqual([]);
  });
});
