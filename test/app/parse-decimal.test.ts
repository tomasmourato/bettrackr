import { describe, expect, test } from "bun:test";
import { parseDecimal } from "../../src/utils";

// Os campos de decimais da app são type="text" porque type="number" rejeita a
// vírgula. Estes testes fixam o contrato de quem os lê.

describe("parseDecimal", () => {
  test("aceita vírgula e ponto", () => {
    expect(parseDecimal("1,85")).toBe(1.85);
    expect(parseDecimal("1.85")).toBe(1.85);
  });

  test("ignora espaços à volta", () => {
    expect(parseDecimal(" 1,85 ")).toBe(1.85);
  });

  test("inteiros e negativos", () => {
    expect(parseDecimal("10")).toBe(10);
    expect(parseDecimal("-2,5")).toBe(-2.5);
  });

  test("vazio é null, não zero", () => {
    // Number("") é 0: sem o caso explícito, um campo em branco gravava 0.
    expect(parseDecimal("")).toBeNull();
    expect(parseDecimal("   ")).toBeNull();
    expect(parseDecimal(null)).toBeNull();
    expect(parseDecimal(undefined)).toBeNull();
  });

  test("lixo é null", () => {
    expect(parseDecimal("abc")).toBeNull();
    expect(parseDecimal("1,8,5")).toBeNull();
    expect(parseDecimal("--1")).toBeNull();
  });
});
