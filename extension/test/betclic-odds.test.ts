import { describe, expect, test } from "bun:test";
import {
  betclicMatchPath,
  collectSelectionOdds,
  findKickoffUtc,
  kickoffMs,
  leadMinutesFrom,
  lisbonToUtcMs,
  parseNgState,
  readMatchPage,
} from "../../lib/betclicOdds";
// A cópia que corre dentro do Chrome. Os dois módulos existem porque a extensão
// é empacotada à parte e o bundle do backend não lhe chega; o teste de paridade
// abaixo é o que impede as duas de divergirem em silêncio.
import * as ext from "../src/closing-odds.js";

// Um ng-state em miniatura com a forma real: nós aninhados, preços em `odds`
// com `id`, e o apito em `matchDateUtc` ao lado de `matchId`. A página a sério
// traz ~1MB e vários jogos (medido: 352 preços de 210 jogos numa só página),
// o que não cabe - nem faz falta - num teste.
const estado = {
  pageProps: {
    matches: [
      {
        matchId: "111",
        name: "Benfica - Porto",
        matchDateUtc: "2026-08-29T19:00:00.0000000Z",
        markets: [
          { id: "m1", selections: [{ id: "s-100", odds: 1.85 }, { id: "s-101", odds: 4.2 }] },
        ],
      },
      {
        // O jogo do lado, que a página traz por arrasto.
        matchId: "222",
        name: "Sporting - Braga",
        matchDateUtc: "2026-08-29T21:30:00.0000000Z",
        markets: [{ id: "m2", selections: [{ id: "s-200", odds: 2.5 }] }],
      },
    ],
  },
};

const html = (state: unknown) =>
  `<html><body><script id="ng-state" type="application/json">${JSON.stringify(state)}</script></body></html>`;

describe("parseNgState", () => {
  test("tira o estado de dentro do script", () => {
    expect(parseNgState(html(estado))).toEqual(estado as never);
  });

  test("uma página sem ng-state não rebenta, devolve null", () => {
    expect(parseNgState("<html><body>manutenção</body></html>")).toBeNull();
  });

  test("um ng-state truncado devolve null em vez de rebentar", () => {
    // Acontece de verdade: resposta cortada a meio, ou a Betclic a mudar de
    // forma. Um throw aqui matava a passagem toda do cron.
    const truncado = `<script id="ng-state" type="application/json">{"pageProps":{</script>`;
    expect(parseNgState(truncado)).toBeNull();
  });
});

describe("collectSelectionOdds", () => {
  test("apanha os preços de toda a página, por id de seleção", () => {
    const odds = collectSelectionOdds(estado);
    expect(odds.get("s-100")).toBe(1.85);
    expect(odds.get("s-101")).toBe(4.2);
    // O jogo do lado também entra. Não faz mal: o id da seleção é global.
    expect(odds.get("s-200")).toBe(2.5);
  });

  test("uma odd <= 1 não é preço nenhum e fica de fora", () => {
    const odds = collectSelectionOdds({ markets: [{ selections: [{ id: "x", odds: 1 }] }] });
    expect(odds.has("x")).toBe(false);
  });
});

describe("findKickoffUtc", () => {
  test("devolve o apito DO jogo pedido, não o do vizinho", () => {
    expect(findKickoffUtc(estado, "111")).toBe("2026-08-29T19:00:00.0000000Z");
    expect(findKickoffUtc(estado, "222")).toBe("2026-08-29T21:30:00.0000000Z");
  });

  test("um jogo que não está na página devolve null", () => {
    expect(findKickoffUtc(estado, "999")).toBeNull();
  });

  test("a Betclic manda 7 casas decimais e o Date aguenta", () => {
    // Se isto partisse, o apito vinha NaN e nada era escrito.
    const ms = Date.parse(findKickoffUtc(estado, "111")!);
    expect(Number.isNaN(ms)).toBe(false);
    expect(new Date(ms).toISOString()).toBe("2026-08-29T19:00:00.000Z");
  });
});

describe("readMatchPage", () => {
  test("preços e apito de uma assentada", () => {
    const page = readMatchPage(html(estado), "111");
    expect(page.odds.get("s-100")).toBe(1.85);
    expect(page.kickoffUtc).toBe("2026-08-29T19:00:00.0000000Z");
  });

  test("página sem estado devolve vazio, nunca um preço inventado", () => {
    const page = readMatchPage("<html></html>", "111");
    expect(page.odds.size).toBe(0);
    expect(page.kickoffUtc).toBeNull();
  });
});

describe("paridade com o módulo da extensão", () => {
  // Se alguém mexer numa cópia e não na outra, é aqui que se descobre.
  test("os dois módulos dão exatamente os mesmos preços", () => {
    const meu = collectSelectionOdds(estado);
    const dele = ext.collectSelectionOdds(estado);
    expect([...meu.entries()].sort()).toEqual([...dele.entries()].sort());
  });

  test("os dois módulos parseiam o ng-state igual", () => {
    expect(parseNgState(html(estado))).toEqual(ext.parseNgState(html(estado)));
  });

  test("os dois módulos constroem o mesmo caminho", () => {
    for (const evento of ["Benfica - Porto", "Peñarol & Nacional", "", "Ajax - PSV"]) {
      expect(betclicMatchPath("123", evento)).toBe(ext.betclicMatchPath("123", evento));
    }
  });
});

describe("fuso horário", () => {
  // O bug que este módulo existe para não repetir: o `startsAt` legado é hora
  // LOCAL de quem importou (mapper.js usa getHours()). Lido como UTC pelo
  // servidor, dava uma hora a mais no verão e o cron chegava atrasado.
  test("verão em Lisboa (WEST, UTC+1): 20:00 é 19:00Z", () => {
    expect(new Date(lisbonToUtcMs("2026-08-29 20:00")!).toISOString()).toBe(
      "2026-08-29T19:00:00.000Z",
    );
  });

  test("inverno em Lisboa (WET, UTC+0): 20:00 é 20:00Z", () => {
    expect(new Date(lisbonToUtcMs("2026-01-15 20:00")!).toISOString()).toBe(
      "2026-01-15T20:00:00.000Z",
    );
  });

  test("o startsAtUtc manda sobre o startsAt", () => {
    const ms = kickoffMs({
      startsAtUtc: "2026-08-29T19:00:00.0000000Z",
      startsAt: "2026-08-29 12:00",
    });
    expect(new Date(ms!).toISOString()).toBe("2026-08-29T19:00:00.000Z");
  });

  test("sem startsAtUtc cai no startsAt, lido como Lisboa", () => {
    const ms = kickoffMs({ startsAt: "2026-08-29 20:00" });
    expect(new Date(ms!).toISOString()).toBe("2026-08-29T19:00:00.000Z");
  });

  test("sem data nenhuma devolve null, e quem chama não lê nada", () => {
    expect(kickoffMs({})).toBeNull();
    expect(kickoffMs({ startsAt: "" })).toBeNull();
    expect(kickoffMs({ startsAt: "amanhã" })).toBeNull();
  });
});

describe("leadMinutesFrom", () => {
  const apito = Date.parse("2026-08-29T19:00:00Z");

  test("dois minutos antes do apito", () => {
    expect(leadMinutesFrom(apito - 2 * 60000, apito)).toBe(2);
  });

  test("quatro horas antes", () => {
    expect(leadMinutesFrom(apito - 4 * 3600_000, apito)).toBe(240);
  });

  test("depois do apito é negativo - quem chama tem de recusar", () => {
    expect(leadMinutesFrom(apito + 60000, apito)).toBe(-1);
  });
});
