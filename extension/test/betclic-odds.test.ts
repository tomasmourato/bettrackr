import { describe, expect, test } from "bun:test";
import {
  betclicMatchPath,
  collectMarkets,
  collectSelectionOdds,
  devig,
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

  test("os dois módulos veem os MESMOS mercados", () => {
    // Foi a divergencia que existiu de verdade: o servidor de-vigava e a
    // extensao nao, por isso a mesma perna valia coisas diferentes conforme
    // quem a apanhasse.
    const meu = collectMarkets(mercado([1.23, 5.75, 9]));
    const dele = ext.collectMarkets(mercado([1.23, 5.75, 9]));
    expect(meu.size).toBe(dele.size);
    expect([...meu.values()][0].overround).toBeCloseTo(
      [...dele.values()][0].overround, 6);
  });

  test("os dois módulos de-vigam igual", () => {
    const m = collectMarkets(mercado([1.23, 5.75, 9]));
    const d = ext.collectMarkets(mercado([1.23, 5.75, 9]));
    for (const odd of [1.23, 5.75, 9]) {
      const a = devig(odd, m.get("s-mainSelections-0"));
      const b = ext.devig(odd, d.get("s-mainSelections-0"));
      expect(a!.odd).toBe(b.odd);
      expect(a!.marginPct).toBe(b.marginPct);
    }
  });

  test("os dois recusam as mesmas armadilhas", () => {
    for (const odds of [[1.21, 7.75], [1.42, 2.3, 2.3, 2.65, 2.9], [1.5]]) {
      expect(collectMarkets(mercado(odds)).size).toBe(
        ext.collectMarkets(mercado(odds)).size);
    }
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

// ------------------------------------------------------------
// De-vig: tirar a margem da casa antes de gravar
//
// Os casos abaixo são os que apareceram MESMO numa página real da Betclic. De
// 10 grupos de odds, só 1 era um mercado de confiança; os outros 9 teriam dado
// odds justas inventadas.
// ------------------------------------------------------------

const mercado = (odds: number[], chave = "mainSelections") => ({
  [chave]: odds.map((o, i) => ({ id: `s-${chave}-${i}`, odds: o })),
});

describe("collectMarkets", () => {
  test("um 1X2 completo é de confiança", () => {
    // Números reais: Resultado (Tempo Regulamentar) de um jogo da Betclic.
    const m = collectMarkets(mercado([1.23, 5.75, 9]));
    expect(m.size).toBe(3);
    expect(m.get("s-mainSelections-0")!.overround).toBeCloseTo(1.098, 3);
  });

  test("um mercado INCOMPLETO é recusado", () => {
    // Visto a sério: [1.21, 7.75] soma 0.9555. Margem negativa é impossível
    // num mercado completo - falta-lhe uma seleção que a página não mostra.
    // De-vigar isto inventava odds MAIORES do que as justas.
    expect(collectMarkets(mercado([1.21, 7.75])).size).toBe(0);
  });

  test("uma lista de marcadores não é um mercado", () => {
    // Somas de 2.48, 4.69, 5.60 apareceram todas na mesma página.
    expect(collectMarkets(mercado([1.42, 2.3, 2.3, 2.65, 2.9])).size).toBe(0);
  });

  test("o crivo é estrutural, não só pela soma", () => {
    // Um grupo de 22 seleções chamado "Galatasaray" somava 1.1457 e caía na
    // banda plausível por acaso - um crivo só pela soma deixava-o passar. O
    // que o exclui é não estar em `mainSelections`.
    const odds = [2.5, 3, 4, 6]; // soma 1.15, dentro da banda
    expect(collectMarkets(mercado(odds, "selections")).size).toBe(0);
    expect(collectMarkets(mercado(odds, "mainSelections")).size).toBe(4);
  });

  test("um mercado de uma seleção só não é mercado", () => {
    expect(collectMarkets(mercado([1.5])).size).toBe(0);
  });

  test("uma odd em falta invalida o mercado inteiro", () => {
    // Meio mercado dá uma margem errada, e uma margem errada é pior do que
    // margem nenhuma.
    const meio = { mainSelections: [{ id: "a", odds: 1.23 }, { id: "b" }] };
    expect(collectMarkets(meio).size).toBe(0);
  });
});

describe("devig", () => {
  const m3 = collectMarkets(mercado([1.23, 5.75, 9]));

  test("a odd justa é sempre MAIOR do que a crua", () => {
    const justa = devig(1.23, m3.get("s-mainSelections-0"))!;
    expect(justa.odd).toBe(1.351);
    expect(justa.marginPct).toBe(9.8);
  });

  test("as odds justas somam 1 de probabilidade - é essa a prova", () => {
    const soma = [1.23, 5.75, 9]
      .map((o) => devig(o, m3.get("s-mainSelections-0"))!.odd)
      .reduce((a, o) => a + 1 / o, 0);
    expect(soma).toBeCloseTo(1, 2);
  });

  test("sem mercado não há odd justa - e não se inventa nenhuma", () => {
    expect(devig(1.23, undefined)).toBeNull();
  });

  test("uma odd que não é odd não passa", () => {
    expect(devig(1, m3.get("s-mainSelections-0"))).toBeNull();
    expect(devig(NaN, m3.get("s-mainSelections-0"))).toBeNull();
  });

  test("o efeito no CLV: o que parecia ganho era a margem", () => {
    // Quem apanhou 1.30 contra um fecho de 1.23.
    const justa = devig(1.23, m3.get("s-mainSelections-0"))!.odd;
    expect(Number(((1.3 / 1.23 - 1) * 100).toFixed(1))).toBe(5.7); // cru
    expect(Number(((1.3 / justa - 1) * 100).toFixed(1))).toBe(-3.8); // real
  });
});

describe("readMatchPage com mercados", () => {
  test("traz preços, mercados e apito", () => {
    const comMercado = {
      matchId: "111",
      matchDateUtc: "2026-08-29T19:00:00.0000000Z",
      ...mercado([1.23, 5.75, 9]),
    };
    const page = readMatchPage(html(comMercado), "111");
    expect(page.odds.size).toBe(3);
    expect(page.markets.size).toBe(3);
    expect(page.kickoffUtc).toBe("2026-08-29T19:00:00.0000000Z");
  });

  test("página sem estado não traz mercado nenhum", () => {
    expect(readMatchPage("<html></html>", "111").markets.size).toBe(0);
  });
});
