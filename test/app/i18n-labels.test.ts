import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

// Os testes de UI verificam que os componentes chamam t("chave"). Isso sozinho
// nao garante que a chave existe nem o que aparece ao utilizador, por isso as
// etiquetas visiveis ficam fixadas aqui. Antes da migracao para i18n estas
// verificacoes viviam nos proprios testes de UI, em texto literal.

function readCatalog(file: string): string {
  return readFileSync(new URL(`../../src/lib/i18n/${file}`, import.meta.url), "utf8");
}

const EXPECTED_PT: Record<string, string> = {
  "bets.selectMultiple": "Selecionar várias",
  "bets.cancelSelection": "Cancelar seleção",
  "bets.cancelDeleteAria": "Cancelar eliminação",
  "bets.restore": "Repor",
  "bets.ignore": "Ignorar",
  "status.unknown": "Desconhecido",
};

describe("i18n labels used by the selection rail", () => {
  it("keeps the Portuguese labels the UI tests rely on", () => {
    const pt = readCatalog("pt.ts");
    for (const [key, label] of Object.entries(EXPECTED_PT)) {
      assert.ok(
        pt.includes(`"${key}": "${label}"`),
        `pt.ts should map ${key} to "${label}"`,
      );
    }
  });

  it("defines every one of those keys in English too", () => {
    const en = readCatalog("en.ts");
    for (const key of Object.keys(EXPECTED_PT)) {
      assert.ok(en.includes(`"${key}":`), `en.ts is missing ${key}`);
    }
  });
});
