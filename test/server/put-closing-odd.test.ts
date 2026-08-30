import { describe, expect, test } from "bun:test";
import { ownsClosingOdds, withStoredClosingOdds } from "../../routes/betsRoutes";

// A extensão reimporta a aposta inteira sempre que o estado muda na casa - ou
// seja, no momento exato em que a aposta se liquida. A casa não sabe o que é
// uma odd de fecho, por isso o payload dela vem sem nenhuma. Estes testes
// fixam a regra que impede esse PUT de apagar o CLV.

/** O corpo tal como a extensão o monta (betPayload): sem `closingOdd`. */
function importPayload(over: Record<string, unknown> = {}) {
  return {
    type: "SIMPLES",
    status: "GANHA",
    stake: 10,
    odd: 2,
    selections: [
      { id: "betclic-9-0", event: "Benfica vs Porto", market: "Vencedor", choice: "Benfica", odd: 2, sourceRef: { selectionId: "s-100" } },
    ],
    metadata: { source: "betclic", importKey: "betclic:9" },
    ...over,
  };
}

/** A linha como está na base de dados, já com a odd de fecho apanhada. */
function storedRow(over: Record<string, unknown> = {}) {
  return {
    selections: [
      { id: "betclic-9-0", event: "Benfica vs Porto", market: "Vencedor", choice: "Benfica", odd: 2, closingOdd: 1.85, sourceRef: { selectionId: "s-100" } },
    ],
    metadata: {
      source: "betclic",
      importKey: "betclic:9",
      closingOddSource: "betclic-auto",
      closingOddCapturedAt: "2026-02-01T18:58:00.000Z",
      closingOddLeadMinutes: 2,
    },
    ...over,
  };
}

describe("ownsClosingOdds", () => {
  test("o site manda a chave e manda nas odds de fecho", () => {
    // mapBetToApi envia sempre `closingOdd`, mesmo a null (para limpar).
    expect(ownsClosingOdds({ closingOdd: 1.85 })).toBe(true);
    expect(ownsClosingOdds({ closingOdd: null })).toBe(true);
  });

  test("a extensão não manda a chave e não lhes toca", () => {
    expect(ownsClosingOdds(importPayload())).toBe(false);
    expect(ownsClosingOdds({})).toBe(false);
    expect(ownsClosingOdds(null)).toBe(false);
  });
});

describe("withStoredClosingOdds", () => {
  test("devolve a odd de fecho a uma perna que veio sem ela", () => {
    const merged = withStoredClosingOdds(importPayload(), storedRow());
    expect(merged.selections[0].closingOdd).toBe(1.85);
  });

  test("não deita fora o resto do que a importação traz", () => {
    // O ponto todo do PUT é atualizar o estado; preservar não pode travá-lo.
    const merged = withStoredClosingOdds(
      importPayload({ status: "PERDIDA", selections: [{ ...importPayload().selections[0], result: "LOST" }] }),
      storedRow(),
    );
    expect(merged.status).toBe("PERDIDA");
    expect(merged.selections[0].result).toBe("LOST");
    expect(merged.selections[0].closingOdd).toBe(1.85);
  });

  test("uma perna que traz odd de fecho própria continua a mandar", () => {
    const body = importPayload();
    body.selections[0] = { ...body.selections[0], closingOdd: 1.6 } as never;
    expect(withStoredClosingOdds(body, storedRow()).selections[0].closingOdd).toBe(1.6);
  });

  test("segue o id da casa, não a posição", () => {
    // Uma múltipla pode voltar com as pernas por outra ordem. Colar a odd de
    // fecho de um jogo a outro seria pior do que não ter odd nenhuma.
    const body = importPayload({
      type: "MULTIPLA",
      odd: 3.7,
      selections: [
        { id: "b-1", event: "C vs D", market: "m", choice: "c2", odd: 1.85, sourceRef: { selectionId: "s-200" } },
        { id: "b-0", event: "A vs B", market: "m", choice: "c1", odd: 2, sourceRef: { selectionId: "s-100" } },
      ],
    });
    const stored = storedRow({
      selections: [
        { event: "A vs B", odd: 2, closingOdd: 1.9, sourceRef: { selectionId: "s-100" } },
        { event: "C vs D", odd: 1.85, closingOdd: 1.8, sourceRef: { selectionId: "s-200" } },
      ],
    });
    expect(withStoredClosingOdds(body, stored).selections.map((s: any) => s.closingOdd)).toEqual([1.8, 1.9]);
  });

  test("sem id da casa, cai na posição", () => {
    // Apostas manuais e importações de CSV não têm sourceRef nenhum.
    const body = importPayload({
      selections: [{ event: "A vs B", market: "m", choice: "c", odd: 2 }],
    });
    const stored = storedRow({ selections: [{ event: "A vs B", odd: 2, closingOdd: 1.7 }] });
    expect(withStoredClosingOdds(body, stored).selections[0].closingOdd).toBe(1.7);
  });

  test("uma perna nova não herda a odd de fecho de outra", () => {
    const body = importPayload({
      type: "MULTIPLA",
      odd: 3.7,
      selections: [
        { event: "A vs B", market: "m", choice: "c1", odd: 2, sourceRef: { selectionId: "s-100" } },
        { event: "E vs F", market: "m", choice: "c3", odd: 1.85, sourceRef: { selectionId: "s-999" } },
      ],
    });
    const merged = withStoredClosingOdds(body, storedRow());
    expect(merged.selections[0].closingOdd).toBe(1.85);
    expect(merged.selections[1].closingOdd).toBeUndefined();
  });

  test("traz de volta a marca de captura sem estragar a metadata da importação", () => {
    const merged = withStoredClosingOdds(importPayload(), storedRow());
    // A marca é nossa e tem de sobreviver...
    expect(merged.metadata.closingOddSource).toBe("betclic-auto");
    expect(merged.metadata.closingOddLeadMinutes).toBe(2);
    // ...e o importKey, de que a deduplicação depende, é o que vier de fora.
    expect(merged.metadata.importKey).toBe("betclic:9");
  });

  test("uma odd de fecho gravada inválida não volta a entrar", () => {
    const stored = storedRow({ selections: [{ closingOdd: 1, sourceRef: { selectionId: "s-100" } }] });
    expect(withStoredClosingOdds(importPayload(), stored).selections[0].closingOdd).toBeUndefined();
  });

  test("uma aposta sem nada gravado passa incólume", () => {
    const merged = withStoredClosingOdds(importPayload(), { selections: [], metadata: null });
    expect(merged.selections[0].closingOdd).toBeUndefined();
    expect(merged.metadata.importKey).toBe("betclic:9");
  });

  test("aguenta selections em texto, que é como o pg às vezes as devolve", () => {
    const stored = { selections: JSON.stringify(storedRow().selections), metadata: {} };
    expect(withStoredClosingOdds(importPayload(), stored).selections[0].closingOdd).toBe(1.85);
  });
});
