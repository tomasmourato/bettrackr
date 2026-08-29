import { describe, expect, test } from "bun:test";
import {
  SNAPSHOT_LEAD_MINUTES,
  acceptSnapshot,
  collectSelectionOdds,
  betclicMatchPath,
  leadMinutes,
  legKeyOf,
  nextWakeUp,
  parseNgState,
  pendingLegsFrom,
  readyToWrite,
  toEpoch,
} from "../src/closing-odds.js";

// A extensão apanha a linha de fecho sozinha. Estes testes fixam as regras que
// decidem quando ela acorda, que leitura guarda e quando a escreve.

const NOW = Date.parse("2026-08-29T12:00:00Z");
const minutes = (n) => n * 60 * 1000;
const hours = (n) => n * 60 * minutes(1);
const iso = (ms) => new Date(ms).toISOString();

function leg(over = {}) {
  return {
    id: "sel",
    event: "Benfica - Porto",
    market: "Vencedor do jogo",
    choice: "Benfica",
    odd: 2,
    startsAt: iso(NOW + hours(3)),
    ...over,
  };
}

function bet(over = {}) {
  return {
    id: "bet-1",
    status: "POR_LIQUIDAR",
    selections: [leg()],
    metadata: { importKey: "betclic:abc" },
    ...over,
  };
}

describe("toEpoch", () => {
  test("aceita ISO e o formato da app", () => {
    expect(toEpoch("2026-08-29T20:45:00Z")).toBe(Date.parse("2026-08-29T20:45:00Z"));
    // Sem o replace do espaço por "T" o Safari devolvia Invalid Date.
    expect(toEpoch("2026-08-29 20:45")).toBe(Date.parse("2026-08-29T20:45"));
  });

  test("null no que não é data", () => {
    expect(toEpoch("")).toBeNull();
    expect(toEpoch("amanhã")).toBeNull();
    expect(toEpoch(undefined)).toBeNull();
  });
});

describe("pendingLegsFrom", () => {
  test("apanha as pernas por liquidar com jogo por começar", () => {
    const legs = pendingLegsFrom([bet()], NOW);
    expect(legs).toHaveLength(1);
    expect(legs[0].importKey).toBe("betclic:abc");
    expect(legs[0].index).toBe(0);
  });

  test("ignora o que já está feito ou não interessa", () => {
    const casos = [
      bet({ status: "GANHA" }),
      bet({ isIgnored: true }),
      bet({ selections: [leg({ closingOdd: 1.9 })] }), // já tem linha
      bet({ selections: [leg({ startsAt: undefined })] }), // sem apito
      bet({ metadata: {} }), // sem chave de importação
    ];
    for (const caso of casos) {
      expect(pendingLegsFrom([caso], NOW)).toHaveLength(0);
    }
  });

  test("ignora jogos já começados e os que estão para lá da janela", () => {
    const jaComecou = bet({ selections: [leg({ startsAt: iso(NOW - minutes(1)) })] });
    const longeDemais = bet({ selections: [leg({ startsAt: iso(NOW + hours(72)) })] });
    expect(pendingLegsFrom([jaComecou], NOW)).toHaveLength(0);
    expect(pendingLegsFrom([longeDemais], NOW)).toHaveLength(0);
  });

  test("uma múltipla dá uma perna por jogo", () => {
    const multipla = bet({
      selections: [leg(), leg({ startsAt: iso(NOW + hours(5)) })],
    });
    expect(pendingLegsFrom([multipla], NOW)).toHaveLength(2);
  });
});

describe("nextWakeUp", () => {
  test("o apito mais próximo menos a antecedência", () => {
    const legs = pendingLegsFrom(
      [
        bet({ selections: [leg({ startsAt: iso(NOW + hours(5)) })] }),
        bet({ id: "b2", selections: [leg({ startsAt: iso(NOW + hours(2)) })] }),
      ],
      NOW,
    );
    expect(nextWakeUp(legs, NOW)).toBe(NOW + hours(2) - minutes(SNAPSHOT_LEAD_MINUTES));
  });

  test("sem nada a vigiar não há alarme", () => {
    expect(nextWakeUp([], NOW)).toBeNull();
  });

  test("um instante de leitura já passado lê-se já, não no passado", () => {
    // O Chrome esteve fechado: ainda vale a pena ler antes do apito.
    const legs = [{ startsAt: NOW + minutes(1) }];
    expect(nextWakeUp(legs, NOW)).toBe(NOW);
  });
});

describe("leadMinutes", () => {
  test("mede a antecedência da leitura", () => {
    expect(leadMinutes(iso(NOW), iso(NOW + minutes(2)))).toBe(2);
    expect(leadMinutes(iso(NOW), iso(NOW + hours(4)))).toBe(240);
  });

  test("null quando falta uma das datas", () => {
    expect(leadMinutes(undefined, iso(NOW))).toBeNull();
    expect(leadMinutes(iso(NOW), undefined)).toBeNull();
  });
});

describe("acceptSnapshot", () => {
  const startsAt = iso(NOW + hours(1));

  test("uma primeira leitura antes do apito entra", () => {
    expect(acceptSnapshot(undefined, { odd: 1.9, at: iso(NOW) }, startsAt)).toBe(true);
  });

  test("uma leitura mais recente substitui a anterior", () => {
    const antiga = { odd: 2.1, at: iso(NOW) };
    const nova = { odd: 1.95, at: iso(NOW + minutes(30)) };
    expect(acceptSnapshot(antiga, nova, startsAt)).toBe(true);
    expect(acceptSnapshot(nova, antiga, startsAt)).toBe(false);
  });

  test("depois do apito não entra", () => {
    // O mercado está suspenso: seria lixo com ar de dado.
    const tardia = { odd: 1.9, at: iso(NOW + hours(2)) };
    expect(acceptSnapshot(undefined, tardia, startsAt)).toBe(false);
  });

  test("odds impossíveis não entram", () => {
    expect(acceptSnapshot(undefined, { odd: 1, at: iso(NOW) }, startsAt)).toBe(false);
    expect(acceptSnapshot(undefined, { odd: 0, at: iso(NOW) }, startsAt)).toBe(false);
    expect(acceptSnapshot(undefined, { odd: "x", at: iso(NOW) }, startsAt)).toBe(false);
  });
});

describe("readyToWrite", () => {
  const passado = iso(NOW - hours(1));

  test("escreve quando todas as pernas têm leitura e os jogos começaram", () => {
    const b = bet({ selections: [leg({ startsAt: passado })] });
    const snapshots = {
      [legKeyOf("betclic:abc", 0)]: { odd: 1.9, at: iso(NOW - hours(1) - minutes(2)) },
    };
    const body = readyToWrite(b, snapshots, NOW);
    expect(body).not.toBeNull();
    expect(body.legs).toEqual([{ index: 0, closingOdd: 1.9 }]);
    expect(body.leadMinutes).toBe(2);
    expect(body.source).toBe("betclic");
  });

  test("uma múltipla com uma perna sem leitura não escreve nada", () => {
    // Meia múltipla não dá meia linha de fecho: fica para a caixa de entrada.
    const b = bet({
      selections: [leg({ startsAt: passado }), leg({ startsAt: passado })],
    });
    const snapshots = { [legKeyOf("betclic:abc", 0)]: { odd: 1.9, at: iso(NOW - hours(2)) } };
    expect(readyToWrite(b, snapshots, NOW)).toBeNull();
  });

  test("não escreve enquanto um dos jogos não começou", () => {
    const b = bet({
      selections: [leg({ startsAt: passado }), leg({ startsAt: iso(NOW + hours(1)) })],
    });
    const snapshots = {
      [legKeyOf("betclic:abc", 0)]: { odd: 1.9, at: iso(NOW - hours(2)) },
      [legKeyOf("betclic:abc", 1)]: { odd: 2.5, at: iso(NOW) },
    };
    expect(readyToWrite(b, snapshots, NOW)).toBeNull();
  });

  test("a marca de qualidade é a da pior perna", () => {
    // Uma múltipla vale o que vale a leitura mais antiga que a compõe.
    const b = bet({
      selections: [leg({ startsAt: passado }), leg({ startsAt: passado })],
    });
    const snapshots = {
      [legKeyOf("betclic:abc", 0)]: { odd: 1.9, at: iso(NOW - hours(1) - minutes(2)) },
      [legKeyOf("betclic:abc", 1)]: { odd: 2.5, at: iso(NOW - hours(5)) },
    };
    const body = readyToWrite(b, snapshots, NOW);
    expect(body.legs).toHaveLength(2);
    expect(body.leadMinutes).toBe(240);
  });
});

describe("leitura do ng-state da Betclic", () => {
  // Forma real, encurtada: as respostas gRPC descodificadas vivem sob chaves
  // "grpc:<hash>", e as seleções trazem id, name, odds e betslipMarketId.
  const estado = {
    "header-state": { irrelevante: true },
    "grpc:69174683": {
      response: {
        payload: {
          hotBets: [
            { selection: { id: "1204466505232395", name: "Empate ou Palestino", odds: 2, betslipMarketId: "1204466505240596" } },
          ],
          markets: [
            {
              id: "1204466505240598",
              selections: [
                { id: "1204466505232398", name: "Cobresal", odds: 1.42 },
                { id: "1204466505232397", name: "Palestino", odds: 4 },
              ],
            },
          ],
        },
      },
    },
  };

  test("colhe as odds indexadas pelo id da seleção", () => {
    const precos = collectSelectionOdds(estado);
    expect(precos.get("1204466505232398")).toBe(1.42);
    expect(precos.get("1204466505232397")).toBe(4);
    expect(precos.get("1204466505232395")).toBe(2);
  });

  test("ignora odds impossíveis e nós sem id", () => {
    const precos = collectSelectionOdds({
      a: { id: "x", odds: 1 },
      b: { id: "y", odds: 0 },
      c: { odds: 2.5 },
      d: { id: "z", odds: "abc" },
    });
    expect(precos.size).toBe(0);
  });

  test("aguenta estado vazio ou lixo", () => {
    expect(collectSelectionOdds(null).size).toBe(0);
    expect(collectSelectionOdds({}).size).toBe(0);
    expect(collectSelectionOdds([]).size).toBe(0);
  });

  test("extrai o ng-state do HTML", () => {
    const html = `<html><head></head><body><script id="ng-state" type="application/json">{"a":{"id":"1","odds":2.5}}</script></body></html>`;
    const estado = parseNgState(html);
    expect(collectSelectionOdds(estado).get("1")).toBe(2.5);
  });

  test("aceita atributos adicionais e ordem diferente no script", () => {
    const html = `<script type="application/json" data-x="1" id="ng-state">{"a":{"id":"1","odds":2.5}}</script>`;
    const estado = parseNgState(html);
    expect(collectSelectionOdds(estado).get("1")).toBe(2.5);
  });

  test("HTML sem ng-state ou com JSON partido dá null", () => {
    expect(parseNgState("<html></html>")).toBeNull();
    expect(parseNgState(`<script id="ng-state" type="application/json">{isto nao</script>`)).toBeNull();
    expect(parseNgState(undefined)).toBeNull();
  });
});

describe("URL atual da página de jogo", () => {
  test("constrói a rota SSR com slug do evento", () => {
    expect(betclicMatchPath("123", "Gimnasia Y Tiro de Salta - Chacarita Juniors"))
      .toBe("/futebol-sfootball/evento-c0/gimnasia-y-tiro-de-salta-chacarita-juniors-m123");
  });
});

describe("ids da perna", () => {
  test("pendingLegsFrom leva os ids do sourceRef", () => {
    const b = bet({
      selections: [
        leg({ sourceRef: { matchId: "1204466502094848", selectionId: "1204466505232398" } }),
      ],
    });
    const [l] = pendingLegsFrom([b], NOW);
    expect(l.matchId).toBe("1204466502094848");
    expect(l.selectionId).toBe("1204466505232398");
  });
});
