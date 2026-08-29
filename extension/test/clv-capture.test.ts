import { describe, expect, test } from "bun:test";
import { legsToRead } from "../../routes/clvRoutes";

// Quais as pernas que o cron vai mesmo ler numa passagem. É aqui que se decide
// se a linha de fecho é apanhada perto do apito, se uma perna preenchida à mão
// é respeitada, e se uma aposta de quem não está em Portugal se auto-corrige.

const AGORA = Date.parse("2026-08-29T18:00:00Z");
const minutos = (n: number) => new Date(AGORA + n * 60_000).toISOString();

function bet(selections: unknown[], metadata: unknown = {}) {
  return { id: "b1", selections, metadata };
}

function leg(over: Record<string, unknown> = {}) {
  return {
    event: "Benfica - Porto",
    market: "Vencedor",
    choice: "Benfica",
    odd: 2,
    sourceRef: { matchId: "m-1", selectionId: "s-100" },
    startsAtUtc: minutos(20),
    ...over,
  };
}

describe("janela de leitura: abre aos 30, fecha aos 5", () => {
  const legivel = (m: number) =>
    legsToRead([bet([leg({ startsAtUtc: minutos(m) })])], AGORA).length === 1;

  test("a 20 minutos do apito é lida", () => {
    expect(legivel(20)).toBe(true);
  });

  test("a 30 minutos - o limite de cima - ainda é lida", () => {
    expect(legivel(30)).toBe(true);
  });

  test("a 31 minutos ainda é cedo", () => {
    expect(legivel(31)).toBe(false);
  });

  test("a 6 minutos ainda entra", () => {
    expect(legivel(6)).toBe(true);
  });

  test("aos 5 minutos JÁ NÃO - é aqui que as odds da Betclic desabam", () => {
    // Um fecho apanhado no último minuto seria baixo de mais e, como o CLV é
    // (odd / fecho - 1), inflacionava o CLV de toda a gente.
    expect(legivel(5)).toBe(false);
  });

  test("a 2 minutos muito menos", () => {
    expect(legivel(2)).toBe(false);
  });

  test("passado o apito nunca - o mercado está suspenso e o preço seria lixo", () => {
    expect(legivel(-1)).toBe(false);
  });

  test("sem apito nenhum não se sabe quando ler", () => {
    const sem = leg();
    delete (sem as Record<string, unknown>).startsAtUtc;
    expect(legsToRead([bet([sem])], AGORA)).toHaveLength(0);
  });
});

describe("ids da casa", () => {
  test("sem matchId não há como ler", () => {
    expect(legsToRead([bet([leg({ sourceRef: { selectionId: "s-100" } })])], AGORA)).toHaveLength(0);
  });

  test("sem selectionId não há como encontrar o preço na página", () => {
    expect(legsToRead([bet([leg({ sourceRef: { matchId: "m-1" } })])], AGORA)).toHaveLength(0);
  });

  test("sem sourceRef nenhum - aposta manual ou de CSV - fica de fora", () => {
    expect(legsToRead([bet([leg({ sourceRef: undefined })])], AGORA)).toHaveLength(0);
  });
});

describe("quem manda na odd de fecho", () => {
  test("uma perna preenchida à mão é intocável", () => {
    const rows = [bet([leg({ closingOdd: 1.7 })], { closingOddSource: "manual" })];
    expect(legsToRead(rows, AGORA)).toHaveLength(0);
  });

  test("uma perna que nós escrevemos pode ser relida enquanto o jogo não começa", () => {
    // É assim que a leitura converge para o último preço antes do apito, sem
    // ser preciso guardar fotografias como a extensão faz.
    const rows = [bet([leg({ closingOdd: 1.9 })], { closingOddSource: "server" })];
    const legs = legsToRead(rows, AGORA);
    expect(legs).toHaveLength(1);
    expect(legs[0].filled).toBe(true);
  });

  test("uma perna escrita pela EXTENSÃO pode ser melhorada", () => {
    // A extensão apanha a linha a zero minutos do apito, dentro da janela em
    // que as odds da Betclic desabam, e sem tirar a margem. Se isso bloqueasse
    // a leitura do servidor, ficava guardada a pior das duas.
    const rows = [bet([leg({ closingOdd: 1.41 })], { closingOddSource: "betclic" })];
    expect(legsToRead(rows, AGORA)).toHaveLength(1);
  });

  test("uma perna vazia é sempre candidata", () => {
    expect(legsToRead([bet([leg()])], AGORA)[0].filled).toBe(false);
  });
});

describe("auto-cura do fuso horário", () => {
  test("sem startsAtUtc entra numa janela larga, para descobrir o apito", () => {
    // O startsAt legado é hora local de quem importou. Para quem não está em
    // Portugal a estimativa erra, e a janela larga é o que dá à passagem a
    // hipótese de ler o apito verdadeiro na página e gravá-lo.
    const semUtc = leg();
    delete (semUtc as Record<string, unknown>).startsAtUtc;
    (semUtc as Record<string, unknown>).startsAt = "2026-08-29 20:00"; // 19:00Z
    const legs = legsToRead([bet([semUtc])], AGORA);
    expect(legs).toHaveLength(1);
    expect(legs[0].exact).toBe(false);
  });

  test("com startsAtUtc é tratada com precisão", () => {
    expect(legsToRead([bet([leg()])], AGORA)[0].exact).toBe(true);
  });

  test("mesmo na janela larga, um jogo daqui a 3 horas fica de fora", () => {
    const semUtc = leg({ startsAt: "2026-08-29 22:00" });
    delete (semUtc as Record<string, unknown>).startsAtUtc;
    expect(legsToRead([bet([semUtc])], AGORA)).toHaveLength(0);
  });
});

describe("agrupamento", () => {
  test("uma múltipla com duas pernas do mesmo jogo dá duas pernas, um jogo", () => {
    const rows = [
      bet([
        leg({ sourceRef: { matchId: "m-1", selectionId: "s-100" } }),
        leg({ sourceRef: { matchId: "m-1", selectionId: "s-101" } }),
      ]),
    ];
    const legs = legsToRead(rows, AGORA);
    expect(legs).toHaveLength(2);
    expect(new Set(legs.map((l) => l.matchId)).size).toBe(1);
    expect(legs.map((l) => l.index)).toEqual([0, 1]);
  });

  test("as selections também chegam como texto do pg", () => {
    const rows = [{ id: "b1", selections: JSON.stringify([leg()]), metadata: {} }];
    expect(legsToRead(rows, AGORA)).toHaveLength(1);
  });

  test("uma aposta sem selections não rebenta a passagem", () => {
    expect(legsToRead([{ id: "b1", selections: null, metadata: {} }], AGORA)).toHaveLength(0);
  });
});
