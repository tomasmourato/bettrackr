import { describe, expect, test } from "bun:test";
import { semClv } from "../../lib/clvVisibility";

// O CLV é funcionalidade paga, e esconder a coluna no ecrã não chega: o
// /api/bets devolveria o valor na mesma a quem abrisse a consola do browser.
// Estes testes fixam o que sai do servidor para uma conta sem subscrição.

const aposta = () => ({
  id: "b1",
  stake: 10,
  odd: 2.1,
  closing_odd: 1.85,
  bookmaker: "Betclic",
  selections: [
    {
      id: "s1",
      event: "Benfica - Porto",
      market: "1X2",
      choice: "Benfica",
      odd: 2.1,
      closingOdd: 1.85,
      closingOddNoVig: 1.99,
      closingOddMargin: 7.5,
      startsAtUtc: "2026-09-04T19:00:00.000Z",
      sourceRef: { matchId: "m1", selectionId: "s1" },
    },
  ],
  metadata: {
    source: "betclic",
    ref: "abc",
    closingOddSource: "server",
    closingOddCapturedAt: "2026-09-04T18:55:00.000Z",
    closingOddLeadMinutes: 5,
  },
});

describe("semClv", () => {
  test("a odd de fecho da aposta desaparece", () => {
    expect(semClv(aposta()).closing_odd).toBeNull();
  });

  test("a odd de fecho de cada perna desaparece, com a justa e a margem", () => {
    const perna = semClv(aposta()).selections[0] as Record<string, unknown>;
    expect("closingOdd" in perna).toBe(false);
    expect("closingOddNoVig" in perna).toBe(false);
    expect("closingOddMargin" in perna).toBe(false);
  });

  test("as marcas de captura saem da metadata", () => {
    // Diziam quando e como a linha foi apanhada - é meia funcionalidade a
    // escapar-se pela porta das traseiras.
    const m = semClv(aposta()).metadata as Record<string, unknown>;
    expect("closingOddSource" in m).toBe(false);
    expect("closingOddCapturedAt" in m).toBe(false);
    expect("closingOddLeadMinutes" in m).toBe(false);
  });

  test("o resto da aposta fica intacto", () => {
    // Cortar a mais seria partir a app a quem não paga, que continua a poder
    // registar e ler as apostas.
    const b = semClv(aposta());
    expect(b.stake).toBe(10);
    expect(b.odd).toBe(2.1);
    expect(b.bookmaker).toBe("Betclic");
    expect(b.metadata.source).toBe("betclic");
    const perna = b.selections[0] as Record<string, unknown>;
    expect(perna.event).toBe("Benfica - Porto");
    expect(perna.odd).toBe(2.1);
    expect(perna.startsAtUtc).toBe("2026-09-04T19:00:00.000Z");
    expect(perna.sourceRef).toEqual({ matchId: "m1", selectionId: "s1" });
  });

  test("não mexe na linha que recebe", () => {
    // A mesma linha pode ser servida a mais do que um sítio; mutá-la aqui
    // apagava o CLV para quem tem direito a ele.
    const original = aposta();
    semClv(original);
    expect(original.closing_odd).toBe(1.85);
    expect(original.selections[0].closingOdd).toBe(1.85);
    expect(original.metadata.closingOddSource).toBe("server");
  });

  test("selections em texto sai em texto", () => {
    // É a forma em que o SSR as recebe do driver; devolver um array partia a
    // serialização do lado de lá.
    const crua = { ...aposta(), selections: JSON.stringify(aposta().selections) };
    const limpa = semClv(crua);
    expect(typeof limpa.selections).toBe("string");
    const pernas = JSON.parse(limpa.selections as string);
    expect("closingOdd" in pernas[0]).toBe(false);
    expect(pernas[0].event).toBe("Benfica - Porto");
  });

  test("uma aposta sem pernas nem metadata não rebenta", () => {
    expect(semClv({ id: "b2", closing_odd: 3 } as any).closing_odd).toBeNull();
    expect(semClv({ id: "b3", selections: "lixo{{" } as any).id).toBe("b3");
  });
});
