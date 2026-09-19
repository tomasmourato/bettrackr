// Os mercados que a página de um jogo da Betclic não traz.
//
// A página pública, que é o que o agente lê, só vem com o separador "Top". Num
// Roma - Inter medido a 19/09/2026 eram 25 mercados de 238 abertos. Todo o
// resto (Resultado duplo/As duas equipas marcam, Intervalo/final, Ambas
// marcam/Total de golos...) o browser vai buscar depois, categoria a categoria,
// por gRPC-web ao offering.begmedia.com. Uma perna apostada num desses mercados
// nunca tinha odd de fecho e, como isso dependia só do mercado em que se
// apostou, parecia não haver padrão nenhum.
//
// Este módulo fala esse protocolo: monta o pedido que o browser faz
// (MatchService/GetMatchWithNotification, com a categoria) e tira da resposta
// os pares seleção -> preço. A decisão continua toda no servidor; isto só lê.
//
// PROPOSITADAMENTE SEM IMPORTS, pela mesma razão do betclicOdds.ts: vai
// empacotado no agente, que corre num Node sem nada instalado.

export const GRPC_MATCH_URL =
    "https://offering.begmedia.com/web/offering.access.api/" +
    "offering.access.api.MatchService/GetMatchWithNotification";

/**
 * Os cabeçalhos que o browser manda. Os da página (ver cabecalhosDaPagina)
 * sobrepõem-se a estes: a Appversion muda a cada versão do site e é melhor
 * dizer a que a própria página diz do que uma que ficou gravada aqui.
 */
export const GRPC_HEADERS: Record<string, string> = {
    "Content-Type": "application/grpc-web+proto",
    "X-Grpc-Web": "1",
    Appversion: "10.4.0-2",
    "X-BG-REGULATION": "PT",
    "X-BG-Ref-Brand": "BETCLIC",
    "X-BG-Ref-Regulator-Zone": "PT",
    "X-BG-Ref-Platform": "DESKTOP",
    "Accept-Language": "pt-PT",
};

// ------------------------------------------------------------
// O que a página já diz: que categorias há e com que cabeçalhos se pedem
// ------------------------------------------------------------

/**
 * As categorias do jogo (ids como "ca_ftb_rslt"), pela ordem da página. A
 * primeira é a que a página já traz, por isso quem pede as outras começa na
 * segunda. Vem do estado que o Angular embute no HTML (ver parseNgState).
 */
export function categoriasDaPagina(state: unknown, matchId: string): string[] {
    const alvo = String(matchId);
    let found: string[] | null = null;

    const visita = (node: any, depth: number) => {
        if (found !== null) return;
        if (!node || typeof node !== "object" || depth > 14) return;
        if (Array.isArray(node)) {
            for (const item of node) visita(item, depth + 1);
            return;
        }
        if (String(node.matchId) === alvo && Array.isArray(node.categories)) {
            found = node.categories
                .map((c: any) => (typeof c?.id === "string" ? c.id : ""))
                .filter(Boolean);
            return;
        }
        for (const key of Object.keys(node)) visita(node[key], depth + 1);
    };

    visita(state, 0);
    return found ?? [];
}

/** Os cabeçalhos com que a própria página fez os pedidos gRPC dela. */
export function cabecalhosDaPagina(state: unknown): Record<string, string> {
    let found: Record<string, string> | null = null;

    const visita = (node: any, depth: number) => {
        if (found !== null) return;
        if (!node || typeof node !== "object" || depth > 6) return;
        if (Array.isArray(node)) {
            for (const item of node) visita(item, depth + 1);
            return;
        }
        const h = node.requestHeaders;
        if (h && typeof h === "object" && typeof h.Appversion === "string") {
            const limpos: Record<string, string> = {};
            for (const [k, v] of Object.entries(h)) {
                if (typeof v === "string") limpos[k] = v;
            }
            found = limpos;
            return;
        }
        for (const key of Object.keys(node)) visita(node[key], depth + 1);
    };

    visita(state, 0);
    return found ?? {};
}

// ------------------------------------------------------------
// O pedido
// ------------------------------------------------------------

function varint(n: bigint): number[] {
    const out: number[] = [];
    while (n > 127n) {
        out.push(Number(n & 127n) | 128);
        n >>= 7n;
    }
    out.push(Number(n));
    return out;
}

function campoTexto(no: number, texto: string): number[] {
    const bytes = [...new TextEncoder().encode(texto)];
    return [(no << 3) | 2, ...varint(BigInt(bytes.length)), ...bytes];
}

/**
 * GetMatchRequest { match_id = 1 (int64); language = 2; category_id = 3 },
 * já dentro da moldura gRPC-web: 1 byte de flags e 4 de tamanho, big-endian.
 */
export function pedidoDeCategoria(matchId: string, categoryId: string, language = "pt"): Uint8Array {
    const msg = [
        0x08,
        ...varint(BigInt(matchId)),
        ...campoTexto(2, language),
        ...campoTexto(3, categoryId),
    ];
    const out = new Uint8Array(5 + msg.length);
    new DataView(out.buffer).setUint32(1, msg.length);
    out.set(msg, 5);
    return out;
}

// ------------------------------------------------------------
// A resposta
// ------------------------------------------------------------

/**
 * A primeira moldura completa de uma resposta gRPC-web. A chamada é um stream
 * (depois do jogo vêm as notificações de preço, sem fim), por isso quem lê
 * pára assim que isto devolver alguma coisa. `null` = ainda não chegou toda.
 * Uma moldura de trailers (flag 0x80) primeiro quer dizer que não houve dados:
 * o texto dela traz o grpc-status.
 */
export function primeiraMoldura(buf: Uint8Array): { dados: Uint8Array } | { trailer: string } | null {
    if (buf.length < 5) return null;
    const len = new DataView(buf.buffer, buf.byteOffset, buf.byteLength).getUint32(1);
    if (buf.length < 5 + len) return null;
    const corpo = buf.subarray(5, 5 + len);
    if (buf[0] & 0x80) return { trailer: new TextDecoder().decode(corpo) };
    return { dados: corpo };
}

interface Campo {
    no: number;
    wt: number;
    /** varint -> bigint, fixed64 -> double, bytes -> Uint8Array, fixed32 -> 0. */
    v: bigint | number | Uint8Array;
}

/**
 * Os campos de uma mensagem protobuf, ou `null` se aquilo não for uma mensagem
 * válida. É o que permite procurar seleções sem o esquema inteiro: um texto ou
 * um bloco de bytes tentado como mensagem quase sempre cai aqui.
 */
function campos(buf: Uint8Array): Campo[] | null {
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    const out: Campo[] = [];
    let pos = 0;

    const lerVarint = (): bigint | null => {
        let r = 0n;
        let shift = 0n;
        for (let i = 0; i < 10; i++) {
            if (pos >= buf.length) return null;
            const b = buf[pos++];
            r |= BigInt(b & 127) << shift;
            if (!(b & 128)) return r;
            shift += 7n;
        }
        return null;
    };

    while (pos < buf.length) {
        const tag = lerVarint();
        if (tag === null) return null;
        const no = Number(tag >> 3n);
        const wt = Number(tag & 7n);
        if (no === 0) return null;
        if (wt === 0) {
            const v = lerVarint();
            if (v === null) return null;
            out.push({ no, wt, v });
        } else if (wt === 1) {
            if (pos + 8 > buf.length) return null;
            out.push({ no, wt, v: view.getFloat64(pos, true) });
            pos += 8;
        } else if (wt === 2) {
            const len = lerVarint();
            if (len === null || pos + Number(len) > buf.length) return null;
            out.push({ no, wt, v: buf.subarray(pos, pos + Number(len)) });
            pos += Number(len);
        } else if (wt === 5) {
            if (pos + 4 > buf.length) return null;
            out.push({ no, wt, v: 0 });
            pos += 4;
        } else {
            return null; // grupos (3/4) não existem em proto3; 6 e 7 não existem
        }
    }
    return out;
}

const bytesDe = (fs: Campo[], no: number): Uint8Array[] =>
    fs.filter((f) => f.no === no && f.wt === 2).map((f) => f.v as Uint8Array);

export interface SelecaoGrpc {
    id: string;
    odds: number;
    /** betslip_market_id: o mesmo id de mercado que a página usa no de-vig. */
    marketId: string;
}

/**
 * Uma Selection do offering.access.api: id = 1 (int64), odds = 12 (double),
 * betslip_market_id = 15 (int64). Nenhum dos contentores tem esta forma - o
 * Market tem o 12 como enum, não como double.
 */
function comoSelecao(fs: Campo[]): SelecaoGrpc | null {
    const id = fs.find((f) => f.no === 1 && f.wt === 0)?.v;
    const odds = fs.find((f) => f.no === 12 && f.wt === 1)?.v;
    const mercado = fs.find((f) => f.no === 15 && f.wt === 0)?.v;
    if (typeof id !== "bigint" || typeof mercado !== "bigint" || typeof odds !== "number") return null;
    if (id <= 0n || !Number.isFinite(odds) || odds <= 1 || odds > 10_000) return null;
    return { id: String(id), odds, marketId: String(mercado) };
}

/**
 * Todas as seleções com preço de uma resposta GetMatchResponse.
 *
 * O caminho até aos mercados segue o esquema do bundle da Betclic:
 * payload (1) -> match (1) -> market (9), sub_categories (11) -> markets (3),
 * markets (25). Dentro de cada mercado as seleções vivem em contentores que
 * mudam com o layout (selection_matrix, split_card_groups, tabs, sliders,
 * group_markets...) e a Betclic acrescenta-lhes formas novas. Por isso, lá
 * dentro, procura-se a FORMA de uma seleção em vez de seguir contentor a
 * contentor: um layout novo continua a ser lido.
 *
 * Fica de fora de propósito o resto do payload (boosted_odds, hot_bets,
 * top_mycombis): são preços de promoções, não os do mercado.
 */
export function selecoesDaResposta(msg: Uint8Array): SelecaoGrpc[] {
    const out = new Map<string, SelecaoGrpc>();

    const procura = (buf: Uint8Array, depth: number) => {
        if (depth > 12) return;
        const fs = campos(buf);
        if (!fs) return;
        const sel = comoSelecao(fs);
        if (sel) {
            if (!out.has(sel.id)) out.set(sel.id, sel);
            return;
        }
        for (const f of fs) if (f.wt === 2) procura(f.v as Uint8Array, depth + 1);
    };

    const resposta = campos(msg);
    if (!resposta) return [];
    for (const payload of bytesDe(resposta, 1)) {
        const p = campos(payload);
        if (!p) continue;
        for (const match of bytesDe(p, 1)) {
            const m = campos(match);
            if (!m) continue;
            const mercados = [...bytesDe(m, 9), ...bytesDe(m, 25)];
            for (const sub of bytesDe(m, 11)) {
                const s = campos(sub);
                if (s) mercados.push(...bytesDe(s, 3));
            }
            for (const mercado of mercados) procura(mercado, 0);
        }
    }
    return [...out.values()];
}
