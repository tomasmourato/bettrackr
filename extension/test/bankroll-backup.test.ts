import { describe, expect, test } from "bun:test";
import { importBetsFromFile } from "../../src/lib/dataTransfer";
import type { BankrollMovement, Bet } from "../../src/types";

// O backup JSON passou a levar a banca (versão "1.1"). Estes testes fixam o
// contrato do restauro: o que é aceite, o que é deitado fora e o que acontece
// aos backups antigos, que não a trazem.

// O Bun não traz FileReader (é API de browser) e é por lá que o import lê o
// ficheiro. Shim mínimo com o que o dataTransfer usa: readAsText + onload.
if (typeof (globalThis as any).FileReader === "undefined") {
  (globalThis as any).FileReader = class {
    onload: ((event: { target: { result: string } }) => void) | null = null;
    readAsText(file: File) {
      void file.text().then((text) => this.onload?.({ target: { result: text } }));
    }
  };
}

function backupFile(payload: unknown): File {
  return new File([JSON.stringify(payload)], "backup.json", { type: "application/json" });
}

/** Corre o import e devolve o que cada callback recebeu. */
async function runImport(file: File) {
  let importedBets: Bet[] = [];
  let importedMovements: BankrollMovement[] | null = null;

  const message = await importBetsFromFile(
    file,
    [],
    (bets) => {
      importedBets = bets;
    },
    (movements) => {
      importedMovements = movements;
    },
  );

  return { message, importedBets, importedMovements };
}

const umaAposta = [{ id: "b1", stake: 10, odd: 2, selections: [] }];

describe("restauro da banca a partir do backup", () => {
  test("um backup 1.1 devolve os movimentos ao lado das apostas", async () => {
    const { importedMovements, message } = await runImport(
      backupFile({
        version: "1.1",
        bets: umaAposta,
        bankrollMovements: [
          { id: "antigo-1", kind: "DEPOSITO", amount: 100, occurredAt: "2026-01-01 10:00", note: "primeiro" },
          { id: "antigo-2", kind: "LEVANTAMENTO", amount: -40, occurredAt: "2026-02-01 09:30" },
        ],
      }),
    );

    expect(importedMovements).toHaveLength(2);
    expect(message).toContain("banca");

    // O sinal do ficheiro é preservado: é ele que o servidor volta a aplicar.
    expect(importedMovements![0].kind).toBe("DEPOSITO");
    expect(importedMovements![0].amount).toBe(100);
    expect(importedMovements![1].amount).toBe(-40);
    expect(importedMovements![0].note).toBe("primeiro");
  });

  test("o id do ficheiro não é reutilizado - o servidor gera o seu", async () => {
    const { importedMovements } = await runImport(
      backupFile({
        version: "1.1",
        bets: umaAposta,
        bankrollMovements: [{ id: "antigo-1", kind: "DEPOSITO", amount: 50, occurredAt: "2026-01-01 10:00" }],
      }),
    );

    expect(importedMovements![0].id).not.toBe("antigo-1");
  });

  test("o accountId de outra instalação não passa - a banca é global", async () => {
    const { importedMovements } = await runImport(
      backupFile({
        version: "1.1",
        bets: umaAposta,
        bankrollMovements: [
          { kind: "DEPOSITO", amount: 50, occurredAt: "2026-01-01 10:00", accountId: "conta-de-outra-app" },
        ],
      }),
    );

    expect(importedMovements![0].accountId).toBeUndefined();
  });

  test("movimentos irrecuperáveis são ignorados sem estragar o resto", async () => {
    const { importedMovements } = await runImport(
      backupFile({
        version: "1.1",
        bets: umaAposta,
        bankrollMovements: [
          { kind: "INVENTADO", amount: 10, occurredAt: "2026-01-01 10:00" }, // tipo desconhecido
          { kind: "DEPOSITO", amount: 0, occurredAt: "2026-01-01 10:00" },   // valor nulo
          { kind: "DEPOSITO", amount: "abc", occurredAt: "2026-01-01 10:00" }, // valor ilegível
          { kind: "DEPOSITO", amount: 10 },                                   // sem data
          null,
          { kind: "AJUSTE", amount: -5, occurredAt: "2026-03-01 08:00" },      // bom
        ],
      }),
    );

    expect(importedMovements).toHaveLength(1);
    expect(importedMovements![0].kind).toBe("AJUSTE");
    expect(importedMovements![0].amount).toBe(-5);
  });

  test("um backup 1.0 continua a importar, apenas sem banca", async () => {
    const { importedBets, importedMovements, message } = await runImport(
      backupFile({ version: "1.0", bets: umaAposta }),
    );

    expect(importedBets).toHaveLength(1);
    expect(importedMovements).toBeNull();
    expect(message).not.toContain("banca");
  });
});
