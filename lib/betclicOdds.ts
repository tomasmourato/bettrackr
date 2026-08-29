// Leitura da página pública de um jogo da Betclic, para o servidor.
//
// A extensão já fazia isto dentro do Chrome (extension/src/closing-odds.js).
// Este módulo é a mesma leitura, mas num sítio que o bundle do backend alcança:
// a página é pública, responde a um fetch sem cookies e sem User-Agent, e não
// tem bloqueio geográfico - medido, não suposto. Ou seja, o browser do
// utilizador nunca foi necessário para ler a linha; só servia de relógio.
//
// PROPOSITADAMENTE SEM IMPORTS. A rota é compilada pela Vercel e já houve dois
// deploys perdidos (e506149, 8a3b345) a tentar partilhar código entre `src/` e
// `routes/`. Não acrescentes dependências aqui.
//
// A cópia da extensão continua a existir porque a extensão é empacotada à parte
// (scripts/zip-extension.mjs) e tem de correr carregada sem empacotar. As duas
// cópias são amarradas por um teste de paridade, não por disciplina:
// extension/test/betclic-odds.test.ts.

/** O estado que o Angular embute no HTML servido. Sem ele não há preços. */
export function parseNgState(html: string): unknown {
    if (typeof html !== "string") return null;
    const match = html.match(
        /<script\b[^>]*\bid=["']ng-state["'][^>]*>([\s\S]*?)<\/script>/i,
    );
    if (!match) return null;
    try {
        return JSON.parse(match[1]);
    } catch {
        return null;
    }
}

/**
 * Todos os preços que a página traz, por id de seleção.
 *
 * A página de um jogo traz muito mais do que esse jogo (medido: 352 preços de
 * 210 jogos numa página, dos quais 86 eram do jogo pedido). Não faz mal: o id
 * da seleção é global, e uma perna de outro boletim que por acaso esteja ali
 * fica lida de borla.
 */
export function collectSelectionOdds(state: unknown): Map<string, number> {
    const out = new Map<string, number>();

    const visita = (node: any, depth: number) => {
        // O estado é grande e fundo; o limite evita um ciclo patológico se a
        // Betclic mudar a forma sem avisar.
        if (!node || typeof node !== "object" || depth > 14) return;
        if (Array.isArray(node)) {
            for (const item of node) visita(item, depth + 1);
            return;
        }
        const odd = Number(node.odds);
        if (node.id != null && Number.isFinite(odd) && odd > 1) {
            out.set(String(node.id), odd);
        }
        for (const key of Object.keys(node)) visita(node[key], depth + 1);
    };

    visita(state, 0);
    return out;
}

/**
 * A hora do apito que a própria Betclic anuncia, em UTC e sem ambiguidade.
 *
 * É isto que corrige o pecado original do `startsAt`: o mapper grava-o com
 * `getHours()`, ou seja na hora LOCAL de quem importou. No browser do
 * utilizador (Lisboa) está certo; lido pelo servidor (UTC) daria uma hora a
 * mais no verão, o cron chegava atrasado e a leitura era rejeitada por ser
 * depois do apito. A funcionalidade morria em silêncio.
 */
export function findKickoffUtc(state: unknown, matchId: string): string | null {
    const alvo = String(matchId);
    let found: string | null = null;

    const visita = (node: any, depth: number) => {
        if (found !== null) return;
        if (!node || typeof node !== "object" || depth > 14) return;
        if (Array.isArray(node)) {
            for (const item of node) visita(item, depth + 1);
            return;
        }
        if (String(node.matchId) === alvo && typeof node.matchDateUtc === "string") {
            found = node.matchDateUtc;
            return;
        }
        for (const key of Object.keys(node)) visita(node[key], depth + 1);
    };

    visita(state, 0);
    return found;
}

export interface MatchPage {
    /** id da seleção -> preço corrente. */
    odds: Map<string, number>;
    /** Apito em ISO-8601 UTC, quando a página o anuncia. */
    kickoffUtc: string | null;
}

/** Uma leitura da página: os preços e o apito, de uma assentada. */
export function readMatchPage(html: string, matchId: string): MatchPage {
    const state = parseNgState(html);
    if (state === null) return { odds: new Map(), kickoffUtc: null };
    return {
        odds: collectSelectionOdds(state),
        kickoffUtc: findKickoffUtc(state, matchId),
    };
}

/**
 * A rota SSR da página de jogo.
 *
 * O prefixo do desporto e o slug não são vinculativos - a Betclic canoniza pelo
 * id do jogo e redireciona (medido: um jogo de ténis pedido por esta rota de
 * futebol devolve 301 e os 303 preços certos). Por isso não é preciso saber o
 * desporto nem a competição para ler um jogo.
 */
export function betclicMatchPath(matchId: string, event?: string): string {
    const slug =
        String(event || "evento")
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .toLowerCase()
            .replace(/&/g, " e ")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "evento";
    return `/futebol-sfootball/evento-c0/${slug}-m${encodeURIComponent(matchId)}`;
}

// ------------------------------------------------------------
// Tempo. Tudo o que entra aqui tem de sair em milissegundos UTC.
// ------------------------------------------------------------

/** Portugal continental: UTC no inverno, UTC+1 no verão. */
const LISBON_TZ = "Europe/Lisbon";

/**
 * Um instante UTC a partir do que estiver gravado na perna.
 *
 * `startsAtUtc` é ISO com `Z` e não tem conversa. O `startsAt` legado é
 * "YYYY-MM-DD HH:mm" sem fuso nenhum, escrito na hora local de quem importou -
 * na prática Lisboa, que é para quem esta app é feita. Interpretá-lo como UTC
 * (que é o que `new Date()` faria no servidor) atrasava tudo uma hora.
 */
export function kickoffMs(selection: {
    startsAtUtc?: unknown;
    startsAt?: unknown;
}): number | null {
    const utc = selection?.startsAtUtc;
    if (typeof utc === "string" && utc.trim() !== "") {
        const ms = Date.parse(utc);
        if (!Number.isNaN(ms)) return ms;
    }

    const local = selection?.startsAt;
    if (typeof local === "string" && local.trim() !== "") {
        return lisbonToUtcMs(local.trim());
    }

    return null;
}

/**
 * "2026-08-29 20:00" em Lisboa -> milissegundos UTC.
 *
 * Sem biblioteca de fusos: assume-se UTC, pergunta-se ao Intl que horas isso dá
 * em Lisboa, e corrige-se pela diferença. Uma passagem chega porque o desvio de
 * Portugal continental é sempre 0 ou 1 hora.
 */
export function lisbonToUtcMs(texto: string): number | null {
    const m = texto.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (!m) return null;
    const [, y, mo, d, h, mi] = m;
    const comoSeFosseUtc = Date.UTC(+y, +mo - 1, +d, +h, +mi);
    if (Number.isNaN(comoSeFosseUtc)) return null;
    return comoSeFosseUtc - lisbonOffsetMs(comoSeFosseUtc);
}

/** Quanto Lisboa está à frente de UTC no instante dado (0 ou +1h). */
function lisbonOffsetMs(instante: number): number {
    const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: LISBON_TZ,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
    const p: Record<string, string> = {};
    for (const part of fmt.formatToParts(new Date(instante))) {
        if (part.type !== "literal") p[part.type] = part.value;
    }
    // O Intl devolve 24 para a meia-noite nalgumas versões; normalizar.
    const hora = p.hour === "24" ? 0 : Number(p.hour);
    const emLisboa = Date.UTC(
        Number(p.year),
        Number(p.month) - 1,
        Number(p.day),
        hora,
        Number(p.minute),
    );
    return emLisboa - instante;
}

/** Minutos entre a leitura e o apito. Negativo = leitura já depois do apito. */
export function leadMinutesFrom(capturedMs: number, kickoff: number): number {
    return Math.round((kickoff - capturedMs) / 60000);
}
