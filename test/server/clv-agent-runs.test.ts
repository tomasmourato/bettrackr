import { describe, expect, test } from "bun:test";
import { passagemDoAgente } from "../../routes/clvRoutes";

// O heartbeat do agente de CLV: o corpo vem de uma máquina em casa, por isso
// valida-se e apara-se antes de ir para a tabela das passagens (migração 026),
// que o painel do bot mostra ao staff.

const AGORA = Date.parse("2026-09-15T10:00:00Z");

describe("passagem do agente de CLV", () => {
  test("sem 'ok' boolean é recusada", () => {
    expect(typeof passagemDoAgente(undefined, AGORA)).toBe("string");
    expect(typeof passagemDoAgente({}, AGORA)).toBe("string");
    expect(typeof passagemDoAgente({ ok: "true" }, AGORA)).toBe("string");
  });

  test("startedAt inválido é recusado; sem ele vale agora", () => {
    expect(typeof passagemDoAgente({ ok: true, startedAt: "ontem" }, AGORA)).toBe("string");
    expect(passagemDoAgente({ ok: true }, AGORA)).toMatchObject({ startedAt: "2026-09-15T10:00:00.000Z" });
  });

  test("uma captura sem nada a ler guarda as candidatas e zeros", () => {
    expect(passagemDoAgente({ ok: true, kind: "capture", candidates: 12, matches: 0 }, AGORA)).toMatchObject({
      kind: "capture",
      ok: true,
      candidates: 12,
      matches: 0,
      read: 0,
      written: 0,
      failures: null,
      error: null,
    });
  });

  test("as falhas juntam-se numa linha; o erro só fica quando a passagem falhou", () => {
    expect(
      passagemDoAgente(
        { ok: false, failures: ["m1:http-403", "m2:http-403"], error: "nenhuma leitura conseguida" },
        AGORA,
      ),
    ).toMatchObject({ failures: "m1:http-403 | m2:http-403", error: "nenhuma leitura conseguida" });
    expect(passagemDoAgente({ ok: true, error: "ignorado" }, AGORA)).toMatchObject({ error: null });
  });

  test("contagens estranhas viram inteiros >= 0 e um tipo desconhecido é captura", () => {
    expect(
      passagemDoAgente({ ok: true, kind: "outro", matches: -3, read: "2.7", written: "x", durationMs: 1234.9 }, AGORA),
    ).toMatchObject({ kind: "capture", matches: 0, read: 2, written: 0, durationMs: 1234 });
  });

  test("a passagem diária chega sem candidatas", () => {
    expect(passagemDoAgente({ ok: true, kind: "daily", matches: 40, candidates: null }, AGORA)).toMatchObject({
      kind: "daily",
      candidates: null,
      matches: 40,
    });
  });

  test("texto comprido é aparado a 1000 caracteres", () => {
    const run = passagemDoAgente({ ok: false, error: "e".repeat(5000), failures: ["f".repeat(5000)] }, AGORA);
    if (typeof run === "string") throw new Error(run);
    expect(run.error?.length).toBe(1000);
    expect(run.failures?.length).toBe(1000);
  });
});
