import { describe, expect, test } from "bun:test";
import { accessFromRow, hasBotAccess, isStaff } from "../../lib/entitlements";

// O cargo 'botuser': amigos que usam o bot + CLV automatico, sem gerir nada.
// Entitled pelo cargo (nao paga), mas NAO e staff (nao ve o painel de gestao).
describe("cargo botuser", () => {
  const botuserRow = { id: "u1", role: "botuser", trial_ends_at: null, stripe_customer_id: null, status: null };

  test("e entitled pelo cargo, com source 'role'", () => {
    const a = accessFromRow(botuserRow);
    expect(a.role).toBe("botuser");
    expect(a.entitled).toBe(true);
    expect(a.source).toBe("role");
  });

  test("NAO e staff (sem painel de gestao), mas TEM acesso ao bot", () => {
    expect(isStaff("botuser")).toBe(false);
    expect(hasBotAccess("botuser")).toBe(true);
  });

  test("staff tem acesso ao bot; um utilizador comum nao", () => {
    expect(hasBotAccess("admin")).toBe(true);
    expect(hasBotAccess("founder")).toBe(true);
    expect(hasBotAccess("user")).toBe(false);
  });

  test("um utilizador comum sem subscricao nao e entitled", () => {
    const a = accessFromRow({ id: "u2", role: "user", trial_ends_at: null, status: null });
    expect(a.entitled).toBe(false);
    expect(a.source).toBe("none");
  });

  test("um role desconhecido cai em 'user' (nao ganha acesso por engano)", () => {
    const a = accessFromRow({ id: "u3", role: "spam", trial_ends_at: null, status: null });
    expect(a.role).toBe("user");
    expect(a.entitled).toBe(false);
    expect(hasBotAccess("spam")).toBe(false);
  });
});
