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

// ------------------------------------------------------------
// Mercado completo e remoção da margem (de-vig)
//
// A odd que a casa mostra tem a margem dela lá dentro, e isso não é um detalhe:
// medido num 1X2 real da Betclic, [1.23, 5.75, 9.00] soma 1.0980 de
// probabilidade - 9.8% de margem. Comparar a odd apanhada contra uma linha de
// fecho com margem INFLACIONA o CLV: quem apostou a 1.30 parece ter batido a
// linha em +5.7% quando na verdade pagou 3.7% acima do preço justo.
//
// Só se de-viga um mercado que esteja COMPLETO na página. Medido na mesma
// página: de 10 grupos de odds, 4 somavam menos de 1 (mercado incompleto - a
// margem daria negativa e a "correção" inventava odds mais altas do que as
// reais) e 4 somavam mais de 1.25 (listas de marcadores, que não são mercados
// exclusivos). Quando não dá para confiar, não se de-viga e fica a odd crua.
// ------------------------------------------------------------

/**
 * A banda em que a soma das probabilidades de um mercado completo pode cair.
 *
 * Abaixo do mínimo faltam seleções à página. Acima do máximo não é um mercado
 * coerente - é uma lista de nomes que por acaso tem odds.
 */
const OVERROUND_MIN = 1.005;
const OVERROUND_MAX = 1.25;

/** O menor número de seleções que ainda faz um mercado. */
const MIN_SELECTIONS = 2;

export interface Market {
    /** Odds de TODAS as seleções do mercado, como vieram. */
    odds: number[];
    /** Soma das probabilidades implícitas. Sempre > 1 num mercado completo. */
    overround: number;
}

/**
 * Os mercados de confiança da página, indexados por id de seleção.
 *
 * O sinal de que um grupo é mesmo um mercado é ESTRUTURAL: só os arrays
 * `mainSelections` contam. Um crivo só pela soma deixava passar um grupo de 22
 * seleções chamado "Galatasaray" que caiu por acaso na banda plausível.
 */
export function collectMarkets(state: unknown): Map<string, Market> {
    const out = new Map<string, Market>();

    const visita = (node: any, depth: number) => {
        if (!node || typeof node !== "object" || depth > 14) return;
        if (Array.isArray(node)) {
            for (const item of node) visita(item, depth + 1);
            return;
        }

        const grupo = node.mainSelections;
        if (Array.isArray(grupo) && grupo.length >= MIN_SELECTIONS) {
            const odds: number[] = [];
            const ids: string[] = [];
            let completo = true;
            for (const sel of grupo) {
                const odd = Number(sel?.odds);
                if (sel?.id == null || !Number.isFinite(odd) || odd <= 1) {
                    completo = false;
                    break;
                }
                odds.push(odd);
                ids.push(String(sel.id));
            }
            if (completo) {
                const overround = odds.reduce((soma, odd) => soma + 1 / odd, 0);
                if (overround >= OVERROUND_MIN && overround <= OVERROUND_MAX) {
                    const market: Market = { odds, overround };
                    for (const id of ids) out.set(id, market);
                }
            }
        }

        for (const key of Object.keys(node)) visita(node[key], depth + 1);
    };

    visita(state, 0);
    return out;
}

/**
 * Reconstroi um mercado a partir de ids e odds soltos, aplicando o MESMO crivo
 * do collectMarkets. Existe para o servidor nunca ter de acreditar na margem
 * que o agente residencial lhe manda: o agente traz os precos, o servidor
 * decide se aquilo e um mercado completo. Devolve null quando nao e de confiar.
 */
export function marketFrom(ids: unknown, odds: unknown): Market | null {
    if (!Array.isArray(ids) || !Array.isArray(odds)) return null;
    if (ids.length !== odds.length || odds.length < MIN_SELECTIONS) return null;
    const limpas: number[] = [];
    for (const o of odds) {
        const n = Number(o);
        if (!Number.isFinite(n) || n <= 1) return null;
        limpas.push(n);
    }
    const overround = limpas.reduce((soma, o) => soma + 1 / o, 0);
    if (overround < OVERROUND_MIN || overround > OVERROUND_MAX) return null;
    return { odds: limpas, overround };
}

export interface FairOdd {
    /** A odd sem a margem da casa. Sempre MAIOR do que a crua. */
    odd: number;
    /** A margem do mercado, em percentagem. Guardada para ser auditável. */
    marginPct: number;
}

/**
 * A odd justa, sem a margem: `odd x soma_das_probabilidades`.
 *
 * De-vig multiplicativo, que reparte a margem proporcionalmente à
 * probabilidade. É transparente e não precisa de iterações; para mercados de
 * duas vias é praticamente ótimo. Em três vias corrige o favorito a mais (as
 * casas carregam mais margem nos azarões), e aí o método de Shin ou o da
 * potência seriam melhores - fica como afinação para quando houver margens
 * gravadas que cheguem para comparar.
 */
export function devig(odd: number, market: Market | undefined): FairOdd | null {
    if (!market) return null;
    if (!Number.isFinite(odd) || odd <= 1) return null;
    const justa = odd * market.overround;
    if (!Number.isFinite(justa) || justa <= 1) return null;
    return {
        odd: Number(justa.toFixed(3)),
        marginPct: Number(((market.overround - 1) * 100).toFixed(2)),
    };
}

// ------------------------------------------------------------
// Retrato de um jogo, para as dicas do dia
//
// A captura da odd de fecho so precisa de precos por id. Isto precisa de mais:
// nomes legiveis, para o modelo de linguagem poder falar do jogo, e a margem de
// cada mercado, que e a unica vantagem REAL que se pode oferecer sem ter de
// adivinhar melhor do que a casa - apostar onde ela cobra menos.
// ------------------------------------------------------------

export interface NamedSelection {
    id: string;
    name: string;
    /** O preco como a casa o mostra, com a margem dela dentro. */
    odd: number;
    /** O mesmo preco sem a margem. E a melhor estimativa de probabilidade. */
    noVig: number;
}

export interface NamedMarket {
    id: string;
    name: string;
    /** Margem da casa neste mercado, em percentagem. */
    marginPct: number;
    /** A casa turbinou alguma seleccao deste mercado? */
    boosted: boolean;
    selections: NamedSelection[];
}

export interface MatchSnapshot {
    matchId: string;
    event: string;
    competition: string | null;
    kickoffUtc: string | null;
    markets: NamedMarket[];
}

/**
 * Os mercados de confianca de um jogo, com nomes e ja sem margem.
 *
 * Mesmo crivo do collectMarkets - so `mainSelections`, e so quando a soma das
 * probabilidades cai na banda plausivel. Um mercado incompleto daria margem
 * negativa e odds "justas" maiores do que as reais.
 */
export function readMatchSnapshot(html: string, matchId: string): MatchSnapshot | null {
    const state = parseNgState(html);
    if (state === null) return null;

    const alvo = String(matchId);

    // O NO DO JOGO, e nao a pagina toda.
    //
    // Uma pagina de jogo traz dezenas de outros jogos (medido: 210 nos de jogo
    // numa so pagina). E os proprios nos de MERCADO tambem carregam matchId, o
    // que da 24 nos com o mesmo id. Recolher mercados da pagina inteira atribuia
    // o 1X2 de um jogo de futebol a um jogo de tenis - aconteceu mesmo.
    //
    // O que distingue o jogo de um mercado seu e o `matchDateUtc`: so o jogo o
    // tem. A partir daqui so se olha para dentro dele.
    let jogo: any = null;
    const procura = (node: any, depth: number) => {
        if (jogo !== null || !node || typeof node !== "object" || depth > 14) return;
        if (Array.isArray(node)) {
            for (const item of node) procura(item, depth + 1);
            return;
        }
        if (String(node.matchId) === alvo && typeof node.matchDateUtc === "string") {
            jogo = node;
            return;
        }
        for (const key of Object.keys(node)) procura(node[key], depth + 1);
    };
    procura(state, 0);
    if (jogo === null) return null;

    const markets: NamedMarket[] = [];
    const vistos = new Set<string>();

    const visita = (node: any, depth: number) => {
        if (!node || typeof node !== "object" || depth > 14) return;
        if (Array.isArray(node)) {
            for (const item of node) visita(item, depth + 1);
            return;
        }

        const grupo = node.mainSelections;
        if (Array.isArray(grupo) && grupo.length >= MIN_SELECTIONS && node.id != null) {
            const id = String(node.id);
            if (!vistos.has(id)) {
                const odds: number[] = [];
                const brutas: Array<{ id: string; name: string; odd: number }> = [];
                let completo = true;
                for (const sel of grupo) {
                    const odd = Number(sel?.odds);
                    if (sel?.id == null || !Number.isFinite(odd) || odd <= 1) {
                        completo = false;
                        break;
                    }
                    odds.push(odd);
                    brutas.push({
                        id: String(sel.id),
                        name: String(sel.name ?? sel.betslipName ?? ""),
                        odd,
                    });
                }
                const overround = odds.reduce((soma, o) => soma + 1 / o, 0);
                if (completo && overround >= OVERROUND_MIN && overround <= OVERROUND_MAX) {
                    vistos.add(id);
                    markets.push({
                        id,
                        name: String(node.name ?? ""),
                        marginPct: Number(((overround - 1) * 100).toFixed(2)),
                        boosted: node.hasBoostedOdds === true,
                        selections: brutas.map((b) => ({
                            ...b,
                            noVig: Number((b.odd * overround).toFixed(3)),
                        })),
                    });
                }
            }
        }

        for (const key of Object.keys(node)) visita(node[key], depth + 1);
    };
    visita(jogo, 0);

    if (markets.length === 0) return null;

    return {
        matchId: alvo,
        event: String(jogo.name ?? ""),
        competition:
            typeof jogo.competition?.name === "string" ? jogo.competition.name : null,
        kickoffUtc: typeof jogo.matchDateUtc === "string" ? jogo.matchDateUtc : null,
        markets,
    };
}

export interface MatchPage {
    /** id da seleção -> preço corrente. */
    odds: Map<string, number>;
    /** id da seleção -> o mercado completo a que pertence, quando é de confiar. */
    markets: Map<string, Market>;
    /** Apito em ISO-8601 UTC, quando a página o anuncia. */
    kickoffUtc: string | null;
}

/** Uma leitura da página: preços, mercados e apito, de uma assentada. */
export function readMatchPage(html: string, matchId: string): MatchPage {
    const state = parseNgState(html);
    if (state === null) {
        return { odds: new Map(), markets: new Map(), kickoffUtc: null };
    }
    return {
        odds: collectSelectionOdds(state),
        markets: collectMarkets(state),
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
