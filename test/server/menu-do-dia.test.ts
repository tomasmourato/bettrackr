import { describe, expect, test } from "bun:test";
import { escolherMercados, type MercadoDoDia } from "../../routes/insightsRoutes";

// O corte da ementa que vai no prompt das dicas diárias. Passou a importar
// quando a captura deixou de dar 1 mercado por jogo e passou a dar ~23: sem
// teto por jogo, os 20 lugares iam quase todos para os jogos com mais linhas.

const mercado = (jogo: string, margem: number): MercadoDoDia => ({
  margem,
  opcoes: [
    { selectionId: `${jogo}-${margem}-a`, marketId: `${jogo}-${margem}`, selection: "A",
      odd: 2, noVig: 2.1, marginPct: margem, market: "M", match: jogo,
      competition: null, kickoffLisbon: "20:00" },
    { selectionId: `${jogo}-${margem}-b`, marketId: `${jogo}-${margem}`, selection: "B",
      odd: 2, noVig: 2.1, marginPct: margem, market: "M", match: jogo,
      competition: null, kickoffLisbon: "20:00" },
  ],
});

describe("escolherMercados", () => {
  test("o mais barato primeiro", () => {
    const escolhidos = escolherMercados([
      mercado("A", 12), mercado("B", 4), mercado("C", 8),
    ]);
    expect(escolhidos.map((m) => m.margem)).toEqual([4, 8, 12]);
  });

  test("um jogo não leva mais do que três lugares", () => {
    // O caso real: um jogo popular traz cinco linhas de Acima/Abaixo com
    // margens de 12.6% a 13.5% - todas mais baratas do que o 1X2 de qualquer
    // outro jogo. Sem teto, arrumavam-se todas no topo.
    const muitos = [1, 2, 3, 4, 5, 6].map((i) => mercado("Lecce - Roma", 10 + i / 10));
    const outro = mercado("Sporting - Braga", 15);
    const escolhidos = escolherMercados([...muitos, outro]);
    expect(escolhidos.filter((m) => m.opcoes[0].match === "Lecce - Roma")).toHaveLength(3);
    expect(escolhidos).toContain(outro);
  });

  test("a ementa não passa de 20 mercados", () => {
    const muitos: MercadoDoDia[] = [];
    for (let j = 0; j < 30; j++)
      for (let k = 0; k < 5; k++) muitos.push(mercado(`jogo-${j}`, 5 + k));
    expect(escolherMercados(muitos)).toHaveLength(20);
  });

  test("vinte jogos diferentes cabem todos", () => {
    // O teto corta o excesso de um jogo, nunca a variedade.
    const um = Array.from({ length: 25 }, (_, j) => mercado(`jogo-${j}`, 5 + j));
    const escolhidos = escolherMercados(um);
    expect(new Set(escolhidos.map((m) => m.opcoes[0].match)).size).toBe(20);
  });

  test("não mexe na lista que recebe", () => {
    const entrada = [mercado("A", 12), mercado("B", 4)];
    escolherMercados(entrada);
    expect(entrada.map((m) => m.margem)).toEqual([12, 4]);
  });
});
