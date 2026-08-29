import { describe, expect, test } from "bun:test";
import { buildBetsCSV, importBetsFromFile } from "../../src/lib/dataTransfer";
import type { Bet, BetStatus } from "../../src/types";

// O round-trip do CSV parte em silêncio com muita facilidade - já aconteceu
// com o NET_PROFIT. Estes testes fixam o que a coluna CLOSING_ODDS promete.

function bet(over: Partial<Bet> = {}): Bet {
  return {
    id: "b1",
    type: "SIMPLES",
    status: "GANHA" as BetStatus,
    selections: [
      { id: "s1", event: "Benfica vs Porto", market: "Vencedor", choice: "Benfica", odd: 2 },
    ],
    stake: 10,
    odd: 2,
    isFreebet: false,
    potentialReturn: 20,
    finalReturn: 20,
    netProfit: 10,
    bookmaker: "Betclic",
    dateTime: "2026-02-01 12:00",
    origin: "MANUAL",
    ...over,
  };
}

// O bun tem File mas não FileReader, e o importador é escrito à volta dele
// (é o que o <input type="file"> do browser dá). Um shim mínimo evita
// refatorar 240 linhas de parsing só para as conseguir testar.
class FileReaderShim {
  result: string | null = null;
  onload: ((event: { target: { result: string } }) => void) | null = null;
  readAsText(file: File) {
    file.text().then((text) => {
      this.result = text;
      this.onload?.({ target: { result: text } });
    });
  }
}
(globalThis as unknown as { FileReader: unknown }).FileReader = FileReaderShim;

/** Passa o CSV pelo importador a sério, como se viesse de um ficheiro. */
function reimport(csv: string): Promise<Bet[]> {
  return new Promise((resolve, reject) => {
    const file = new File([csv], "apostas.csv", { type: "text/csv" });
    importBetsFromFile(file, [], resolve).catch(reject);
  });
}

const header = (csv: string) => csv.split("\n")[0].split(";");
const cell = (csv: string, coluna: string) => {
  const index = header(csv).indexOf(coluna);
  return csv.split("\n")[1].split(";")[index];
};

describe("coluna CLOSING_ODDS", () => {
  test("uma simples exporta um número só", () => {
    const csv = buildBetsCSV([bet({ selections: [{ id: "s1", event: "A", market: "m", choice: "c", odd: 2, closingOdd: 1.85 }] })], []);
    expect(header(csv)).toContain("CLOSING_ODDS");
    expect(cell(csv, "CLOSING_ODDS")).toBe("1.850");
  });

  test("uma múltipla exporta as pernas juntas por ' + '", () => {
    // A mesma convenção do GAME, do BET e do SPORT.
    const csv = buildBetsCSV(
      [
        bet({
          type: "MULTIPLA",
          odd: 3.7,
          selections: [
            { id: "s1", event: "A vs B", market: "m", choice: "c1", odd: 2, closingOdd: 1.9 },
            { id: "s2", event: "C vs D", market: "m", choice: "c2", odd: 1.85, closingOdd: 1.8 },
          ],
        }),
      ],
      [],
    );
    expect(cell(csv, "CLOSING_ODDS")).toBe("1.900 + 1.800");
  });

  test("sem odd de fecho a célula fica vazia", () => {
    expect(cell(buildBetsCSV([bet()], []), "CLOSING_ODDS")).toBe("");
  });
});

describe("round-trip do CSV", () => {
  test("uma simples volta com a mesma odd de fecho", async () => {
    const original = bet({
      selections: [{ id: "s1", event: "Benfica vs Porto", market: "Vencedor", choice: "Benfica", odd: 2, closingOdd: 1.85 }],
    });
    const [voltou] = await reimport(buildBetsCSV([original], []));
    expect(voltou.selections[0].closingOdd).toBe(1.85);
    expect(voltou.closingOdd).toBe(1.85);
  });

  test("uma múltipla volta com as pernas certas e a combinada derivada", async () => {
    const original = bet({
      type: "MULTIPLA",
      odd: 3.7,
      selections: [
        { id: "s1", event: "A vs B", market: "Vencedor", choice: "c1", odd: 2, closingOdd: 1.9 },
        { id: "s2", event: "C vs D", market: "Vencedor", choice: "c2", odd: 1.85, closingOdd: 1.8 },
      ],
    });
    const [voltou] = await reimport(buildBetsCSV([original], []));
    expect(voltou.selections.map((s) => s.closingOdd)).toEqual([1.9, 1.8]);
    // 1.90 x 1.80 = 3.42, derivada e não lida do ficheiro.
    expect(voltou.closingOdd).toBe(3.42);
  });

  test("uma múltipla com uma perna sem fecho não ganha combinada", async () => {
    const csv = buildBetsCSV(
      [
        bet({
          type: "MULTIPLA",
          odd: 3.7,
          selections: [
            { id: "s1", event: "A vs B", market: "Vencedor", choice: "c1", odd: 2, closingOdd: 1.9 },
            { id: "s2", event: "C vs D", market: "Vencedor", choice: "c2", odd: 1.85 },
          ],
        }),
      ],
      [],
    );
    const [voltou] = await reimport(csv);
    expect(voltou.selections[0].closingOdd).toBe(1.9);
    expect(voltou.selections[1].closingOdd).toBeUndefined();
    expect(voltou.closingOdd).toBeUndefined();
  });

  test("um CSV antigo, sem a coluna, continua a importar", async () => {
    // A leitura é por NOME de coluna, por isso os ficheiros já exportados
    // antes desta funcionalidade não podem partir.
    const antigo =
      "DATE;TIME;GAME;BET;STAKE;ODDS;STATUS;RETURN;NET_PROFIT;SPORT;BOOKIE;BETTYPE\n" +
      '2026-02-01;12:00;"Benfica vs Porto";"Benfica";10.00;2.000;WON;20.00;10.00;FUTEBOL;Betclic;Simples\n';
    const [voltou] = await reimport(antigo);
    expect(voltou.stake).toBe(10);
    expect(voltou.odd).toBe(2);
    expect(voltou.closingOdd).toBeUndefined();
  });
});
