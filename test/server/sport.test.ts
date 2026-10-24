import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { chave, normalizeSport, SPORT_ALIASES } from "../../lib/sport";

// O filtro de desporto chegou a mostrar Futebol, FUTEBOL e FOOTBALL lado a
// lado - um por fonte. Estes testes fixam que o mesmo desporto dá um só nome,
// venha de onde vier, e que a cópia da tabela na migração 027 não diverge.

describe("normalizeSport", () => {
  test("os duplicados que estavam no filtro dão um só", () => {
    expect(["Futebol", "FUTEBOL", "FOOTBALL", "Football", "futebol "].map(normalizeSport)).toEqual(
      Array(5).fill("Futebol"),
    );
    expect(["Ténis", "TÉNIS", "TENIS", "Tennis"].map(normalizeSport)).toEqual(Array(4).fill("Ténis"));
    expect(["BASQUETEBOL", "BASKETBALL", "Basquetebol"].map(normalizeSport)).toEqual(
      Array(3).fill("Basquetebol"),
    );
  });

  test("as outras formas que estavam em produção (24/10/2026)", () => {
    expect(normalizeSport("soccer")).toBe("Futebol");
    expect(normalizeSport("basketball")).toBe("Basquetebol");
    expect(normalizeSport("tennis")).toBe("Ténis");
    expect(normalizeSport("FUTSAL")).toBe("Futsal");
    expect(normalizeSport("Artes Marciais")).toBe("Artes marciais");
    expect(normalizeSport("motorsport")).toBe("Automobilismo");
  });

  test("os códigos da Solverde", () => {
    expect(normalizeSport("FOOT")).toBe("Futebol");
    expect(normalizeSport("BASK")).toBe("Basquetebol");
  });

  test("sem desporto é undefined, e não um nome inventado", () => {
    for (const vazio of [null, undefined, "", "   ", "undefined", "null", 7, "123"]) {
      expect(normalizeSport(vazio)).toBeUndefined();
    }
  });

  test("um desporto desconhecido fica, só com a caixa arrumada", () => {
    expect(normalizeSport("CURLING")).toBe("Curling");
    expect(normalizeSport("curling")).toBe("Curling");
    expect(normalizeSport("  Corrida   de   cavalos ")).toBe("Corrida de cavalos");
    // Uma sigla curta continua sigla.
    expect(normalizeSport("wwe")).toBe("WWE");
  });

  test("é idempotente: normalizar o que já está normalizado não muda nada", () => {
    for (const [nome] of SPORT_ALIASES) expect(normalizeSport(nome)).toBe(nome);
    expect(normalizeSport(normalizeSport("CURLING"))).toBe("Curling");
  });
});

describe("a tabela da migração 027", () => {
  const sql = readFileSync(new URL("../../db/migrations/027_desporto_e_competicao.sql", import.meta.url), "utf8");
  // Só o bloco dos nomes, para não apanhar outros VALUES do ficheiro.
  const bloco = sql.slice(sql.indexOf("nomes(k, nome) AS (VALUES"), sql.indexOf("SELECT CASE"));
  const doSql = new Map([...bloco.matchAll(/\('([^']+)', '([^']+)'\)/g)].map((m) => [m[1], m[2]]));

  test("tem exatamente as formas do lib/sport.ts, com o mesmo nome", () => {
    const doTs = new Map<string, string>();
    for (const [nome, formas] of SPORT_ALIASES) for (const forma of formas) doTs.set(forma, nome);
    expect(Object.fromEntries(doSql)).toEqual(Object.fromEntries(doTs));
  });

  test("cada nome é também uma das suas formas", () => {
    // O normalizeSport aceita o próprio nome ("Hóquei no gelo"); a cópia SQL só
    // conhece as formas, por isso o nome tem de estar entre elas.
    for (const [nome, formas] of SPORT_ALIASES) expect(formas).toContain(chave(nome));
  });
});
