import { describe, expect, test } from "bun:test";
import { precisaDeAtualizar } from "../src/sync";
import { temOddOriginal } from "../src/bettrackr";

// A reconciliacao decide, por aposta, entre nao fazer nada e reescrever a
// aposta no BetTrackr. Enganar-se para o lado do "nada" deixa o CLV errado
// para sempre; para o outro lado, faz PUTs a toa a cada passagem.

const mapeada = (over: Record<string, any> = {}) => ({
  status: "GANHA",
  selections: [{ odd: 2.98 }],
  ...over,
});

const turbinada = () => mapeada({ selections: [{ odd: 2.98, originalOdd: 2.32 }] });

describe("precisaDeAtualizar", () => {
  test("aposta que o BetTrackr nao conhece e nova", () => {
    expect(precisaDeAtualizar(undefined, mapeada())).toBe(true);
  });

  test("mudanca de estado continua a mandar", () => {
    const atual = { id: "1", status: "POR_LIQUIDAR", temOddOriginal: false };
    expect(precisaDeAtualizar(atual, mapeada({ status: "GANHA" }))).toBe(true);
  });

  test("nada mudou: nao se toca", () => {
    const atual = { id: "1", status: "GANHA", temOddOriginal: false };
    expect(precisaDeAtualizar(atual, mapeada())).toBe(false);
  });

  test("turbinada antiga, sem odd original gravada: recupera-se", () => {
    // Foi importada antes de o mapper saber ler o `initial_odds`; sem isto
    // ficava com o CLV medido pela odd turbinada para sempre.
    const atual = { id: "1", status: "GANHA", temOddOriginal: false };
    expect(precisaDeAtualizar(atual, turbinada())).toBe(true);
  });

  test("turbinada ja recuperada: nao volta a ser reescrita", () => {
    // O que impede a recuperacao de virar um PUT por passagem, para sempre.
    const atual = { id: "1", status: "GANHA", temOddOriginal: true };
    expect(precisaDeAtualizar(atual, turbinada())).toBe(false);
  });
});

describe("temOddOriginal", () => {
  test("basta uma perna", () => {
    expect(temOddOriginal({ selections: [{ odd: 2 }, { odd: 3, originalOdd: 2.5 }] })).toBe(true);
  });

  test("odd original impossivel nao conta", () => {
    expect(temOddOriginal({ selections: [{ odd: 2, originalOdd: 1 }] })).toBe(false);
    expect(temOddOriginal({ selections: [] })).toBe(false);
    expect(temOddOriginal({})).toBe(false);
  });
});
