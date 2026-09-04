import { describe, expect, test } from "bun:test";
import { UPDATE_BASES } from "../../src/lib/apiBase";

// A lista de domínios por onde a app procura uma atualização. É a rede que
// impede a app de ficar presa quando o domínio gravado no APK deixa de servir:
// sem canal de atualização não há como lhe chegar uma correção à distância.

describe("UPDATE_BASES", () => {
  test("o domínio atual vem primeiro", () => {
    // Em funcionamento normal só se faz um pedido; os outros são recurso.
    expect(UPDATE_BASES[0]).toBe("https://bettrackr.dev");
  });

  test("os domínios antigos continuam na lista", () => {
    // Cada APK tem o seu gravado dentro. Tirá-los daqui é tirar a saída de
    // emergência às instalações que ainda os usam.
    expect(UPDATE_BASES).toContain("https://betrackr.vercel.app");
    expect(UPDATE_BASES).toContain("https://gestordebets.vercel.app");
  });

  test("não há repetidos nem vazios", () => {
    expect(new Set(UPDATE_BASES).size).toBe(UPDATE_BASES.length);
    expect(UPDATE_BASES.every((b) => b.startsWith("https://"))).toBe(true);
  });

  test("nenhuma acaba em barra", () => {
    // Os caminhos são concatenados com "/app-version.json"; uma barra a mais
    // dava "//app-version.json".
    expect(UPDATE_BASES.every((b) => !b.endsWith("/"))).toBe(true);
  });
});
