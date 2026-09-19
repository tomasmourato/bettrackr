import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  cabecalhosDaPagina,
  categoriasDaPagina,
  pedidoDeCategoria,
  primeiraMoldura,
  selecoesDaResposta,
} from "../../lib/betclicGrpc";

// A página de um jogo só traz o separador "Top". Os mercados das outras
// categorias vêm por gRPC-web, e era por aí que ficavam sem odd de fecho as
// pernas em "Resultado duplo/As duas equipas marcam", "Intervalo/final" e
// companhia. A fixture é a primeira mensagem real da categoria "Resultado" de
// um Roma - Inter (19/09/2026), sem a moldura gRPC-web.
const resultado = new Uint8Array(
  readFileSync(new URL("./fixtures/betclic-grpc-roma-inter-resultado.bin", import.meta.url)),
);

describe("selecoesDaResposta", () => {
  const selecoes = selecoesDaResposta(resultado);
  const porId = new Map(selecoes.map((s) => [s.id, s]));

  test("lê a categoria inteira", () => {
    // 248 é o que dá a descodificação com o esquema COMPLETO do bundle da
    // Betclic. A procura pela forma da seleção tem de chegar ao mesmo número.
    expect(selecoes.length).toBe(248);
    expect(porId.size).toBe(248);
  });

  test("apanha os mercados combinados que a página não traz", () => {
    // Resultado duplo/As duas equipas marcam: "Roma / Empate & Sim".
    expect(porId.get("1218288612810752")?.odds).toBe(2.08);
    // Resultado ao intervalo/final: "Roma / Roma".
    expect(porId.get("1218288612811120")?.odds).toBe(3.95);
  });

  test("agrupa pelo id de mercado da casa, para o de-vig", () => {
    const mercado = porId.get("1218288612810752")!.marketId;
    expect(selecoes.filter((s) => s.marketId === mercado).length).toBe(6);
    const intervalo = porId.get("1218288612811120")!.marketId;
    expect(selecoes.filter((s) => s.marketId === intervalo).length).toBe(9);
  });

  test("só devolve preços de verdade", () => {
    for (const s of selecoes) {
      expect(s.odds).toBeGreaterThan(1);
      expect(s.id).toMatch(/^\d+$/);
      expect(s.marketId).toMatch(/^\d+$/);
    }
  });

  test("lixo não rebenta nem inventa preços", () => {
    expect(selecoesDaResposta(new Uint8Array(0))).toEqual([]);
    expect(selecoesDaResposta(new TextEncoder().encode("<html>403 Forbidden</html>"))).toEqual([]);
    // A resposta cortada a meio: fica o que se conseguir ler, sem exceção.
    expect(() => selecoesDaResposta(resultado.subarray(0, 20_000))).not.toThrow();
  });
});

describe("pedidoDeCategoria", () => {
  test("monta o GetMatchRequest que o browser manda", () => {
    // Bytes confirmados contra o offering.begmedia.com a 19/09/2026: moldura
    // gRPC-web (5 bytes), match_id=1 (varint), language=2, category_id=3.
    const hex = Buffer.from(pedidoDeCategoria("1218287014801408", "ca_ftb_rslt")).toString("hex");
    expect(hex).toBe("000000001a0880e081e6e8809502120270741a0b63615f6674625f72736c74");
  });
});

describe("primeiraMoldura", () => {
  const moldura = (flag: number, corpo: number[]) => {
    const out = new Uint8Array(5 + corpo.length);
    out[0] = flag;
    new DataView(out.buffer).setUint32(1, corpo.length);
    out.set(corpo, 5);
    return out;
  };

  test("espera pela moldura inteira", () => {
    expect(primeiraMoldura(new Uint8Array([0, 0, 0]))).toBeNull();
    expect(primeiraMoldura(moldura(0, [1, 2, 3]).subarray(0, 6))).toBeNull();
  });

  test("devolve os dados e ignora o que vem a seguir", () => {
    const junto = new Uint8Array([...moldura(0, [7, 8]), ...moldura(0, [9])]);
    const r = primeiraMoldura(junto);
    expect(r && "dados" in r ? [...r.dados] : null).toEqual([7, 8]);
  });

  test("uma moldura de trailers primeiro é um erro, com o grpc-status", () => {
    const texto = [...new TextEncoder().encode("grpc-status:12\r\ngrpc-message:\r\n")];
    const r = primeiraMoldura(moldura(0x80, texto));
    expect(r && "trailer" in r ? r.trailer : "").toContain("grpc-status:12");
  });
});

describe("o que a página já diz", () => {
  // A forma do ng-state: o pedido gRPC que a própria página fez, com os
  // cabeçalhos dela, e o jogo com as categorias.
  const estado = {
    "grpc:1": {
      requestHeaders: { Appversion: "10.9.9-1", "X-BG-Ref-Platform": "DESKTOP", Outro: 3 },
      request: { language: "pt" },
    },
    "grpc:2": {
      response: {
        payload: {
          match: {
            matchId: "1218287014801408",
            categories: [
              { id: "ca_ftb_top", name: "Top" },
              { id: "ca_ftb_rslt", name: "Resultado" },
              { id: "ca_ftb_goa", name: "Golos" },
            ],
          },
        },
      },
    },
  };

  test("as categorias do jogo, pela ordem da página", () => {
    expect(categoriasDaPagina(estado, "1218287014801408")).toEqual(["ca_ftb_top", "ca_ftb_rslt", "ca_ftb_goa"]);
    expect(categoriasDaPagina(estado, "123")).toEqual([]);
    expect(categoriasDaPagina(null, "1218287014801408")).toEqual([]);
  });

  test("os cabeçalhos com que a página pediu, só os de texto", () => {
    expect(cabecalhosDaPagina(estado)).toEqual({ Appversion: "10.9.9-1", "X-BG-Ref-Platform": "DESKTOP" });
    expect(cabecalhosDaPagina({})).toEqual({});
  });
});
