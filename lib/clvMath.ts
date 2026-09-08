// lib/clvMath.ts
// As REGRAS do CLV: que aposta conta, contra que preço se mede, e a conta em
// si. Vive aqui, ao lado do clvClosingOdds e do clvCapture, porque agora há
// dois leitores - o painel (src/lib/clv.ts) e o servidor, que precisa do
// mesmo veredito para dar contexto à IA.
//
// PROPOSITADAMENTE SEM IMPORTS da camada src/: as rotas da Vercel importam
// isto e não podem arrastar o React, nem o dicionário de traduções (o
// src/types.ts importa TKey), nem os dados de demonstração do src/utils.ts.
// Por isso os tipos são estruturais - o `Bet` do frontend encaixa neles.
//
// A explicação de PORQUÊ cada regra é assim está no cabeçalho do
// src/lib/clv.ts, que é onde se lê a matemática toda de uma vez.

export interface ClvSelection {
    odd?: unknown;
    originalOdd?: unknown;
    closingOdd?: unknown;
    closingOddNoVig?: unknown;
    closingOddMargin?: unknown;
    isBoosted?: unknown;
    result?: unknown;
    market?: unknown;
    betType?: unknown;
    sport?: unknown;
    startsAt?: unknown;
}

export interface ClvBet {
    stake?: unknown;
    odd?: unknown;
    isFreebet?: unknown;
    isIgnored?: unknown;
    status?: unknown;
    bookmaker?: unknown;
    dateTime?: unknown;
    closingOdd?: unknown;
    closingOddNoVig?: unknown;
    selections?: ClvSelection[];
}

/** O CLV de uma aposta, já calculado. */
export interface ClvBetResult {
    /** (odd / fecho - 1) * 100. Positivo = apanhou-se melhor preço que o fecho. */
    clvPct: number;
    /** stake * (odd / fecho - 1). Sempre 0 numa freebet (não é dinheiro real). */
    moneyClv: number;
    /** A odd apanhada foi estritamente melhor do que a de fecho. */
    beatClose: boolean;
}

export function safeNum(value: unknown, defaultValue = 0): number {
    if (value === undefined || value === null) return defaultValue;
    const num = typeof value === "number" ? value : parseFloat(String(value));
    return Number.isNaN(num) ? defaultValue : num;
}

export function round2(value: number): number {
    return Number(value.toFixed(2));
}

/** Uma odd só serve para o CLV se for uma odd decimal a sério (> 1). */
export function validOdd(value: unknown): number | null {
    const odd = safeNum(value);
    return Number.isFinite(odd) && odd > 1 ? odd : null;
}

/**
 * "YYYY-MM-DD HH:mm" -> epoch ms. O replace do espaço por "T" é o mesmo
 * remendo que o Dashboard e a banca já usam: sem ele o Safari não parseia a
 * data. Datas inválidas caem para 0 e ficam no início, de forma determinística.
 */
export function toTimestamp(value: unknown): number {
    if (typeof value !== "string" || value === "") return 0;
    const parsed = new Date(value.replace(" ", "T")).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
}

const contam = (bet: ClvBet): ClvSelection[] =>
    (bet.selections || []).filter((selection) => selection?.result !== "ANULADA");

/**
 * O preço de antes do boost, ao nível do boletim: o produto de
 * `originalOdd ?? odd` das pernas que contam.
 */
export function originalOddOf(bet: ClvBet): number | null {
    const legs = contam(bet);
    if (!legs.some((selection) => validOdd(selection?.originalOdd) !== null)) return null;

    let product = 1;
    for (const leg of legs) {
        const odd = validOdd(leg?.originalOdd) ?? validOdd(leg?.odd);
        if (odd === null) return null;
        product *= odd;
    }
    return round2(product);
}

/** Alguma perna que conta traz o preço de antes do boost? */
function isBoostPriced(bet: ClvBet): boolean {
    return contam(bet).some((selection) => validOdd(selection?.originalOdd) !== null);
}

/**
 * A odd contra a qual o CLV desta aposta se mede: a de antes do boost quando
 * se conhece, a apanhada quando não.
 */
export function oddForClv(bet: ClvBet): number | null {
    const original = originalOddOf(bet);
    if (original !== null) return original;
    // Boost registado mas boletim por medir (perna com odd impossível): aqui
    // não se cai para a odd turbinada, que daria justamente o número errado.
    return isBoostPriced(bet) ? null : validOdd(bet.odd);
}

/**
 * O apito do jogo, quando se sabe. Numa múltipla é o do jogo que começa por
 * ÚLTIMO: é a partir daí que todas as pernas têm linha de fecho.
 */
export function kickoffOf(bet: ClvBet): string | undefined {
    const times = (bet.selections || [])
        .map((selection) => selection?.startsAt)
        .filter((value): value is string => typeof value === "string" && value !== "");
    if (times.length === 0) return undefined;
    return times.reduce((latest, value) => (value > latest ? value : latest));
}

/** Mercados promocionais, para quando não há melhor sinal do que o rótulo. */
const PROMO_MARKET_RE = /boost|turbo|missão|missao|super\s*odd/i;

/** Aposta promocional se QUALQUER perna o for. */
export function isPromoBet(bet: ClvBet): boolean {
    return (bet.selections || []).some(
        (selection) =>
            selection?.isBoosted === true ||
            validOdd(selection?.originalOdd) !== null ||
            PROMO_MARKET_RE.test(`${selection?.market ?? ""} ${selection?.betType ?? ""}`),
    );
}

/** Ignoradas e anuladas não; tudo o resto sim, incluindo as por liquidar. */
export function isClvEligible(bet: ClvBet): boolean {
    return !bet.isIgnored && bet.status !== "ANULADA";
}

/** A conta, uma vez só: uma odd apanhada contra uma linha de fecho. */
function clvEntre(bet: ClvBet, odd: number | null, close: number | null): ClvBetResult | null {
    if (odd === null || close === null) return null;

    const ratio = odd / close - 1;

    return {
        clvPct: round2(ratio * 100),
        // A stake de uma freebet não é dinheiro do utilizador: em euros o CLV
        // dela é zero, por melhor que a percentagem seja.
        moneyClv: bet.isFreebet ? 0 : round2(safeNum(bet.stake) * ratio),
        beatClose: odd > close,
    };
}

/** O CLV de uma aposta, medido pelo preço de antes do boost quando se conhece. */
export function betClv(bet: ClvBet): ClvBetResult | null {
    if (!isClvEligible(bet)) return null;
    return clvEntre(bet, oddForClv(bet), validOdd(bet.closingOdd));
}

/** O CLV pelo preço que a casa REALMENTE deu - a odd turbinada. */
export function betClvAtTakenPrice(bet: ClvBet): ClvBetResult | null {
    if (!isClvEligible(bet)) return null;
    return clvEntre(bet, validOdd(bet.odd), validOdd(bet.closingOdd));
}

/** O mesmo CLV, mas contra a linha de fecho SEM a margem da casa. */
export function betClvNoVig(bet: ClvBet): ClvBetResult | null {
    if (!isClvEligible(bet)) return null;
    return clvEntre(bet, oddForClv(bet), validOdd(bet.closingOddNoVig));
}

/** A aposta está à espera de que alguém lhe registe a odd de fecho? */
export function needsClosingOdd(bet: ClvBet, now: Date = new Date()): boolean {
    if (!isClvEligible(bet)) return false;
    if (validOdd(bet.closingOdd) !== null) return false;
    // O apito, quando o conhecemos; senão a data do boletim, que na Betclic é
    // a da aposta e por isso pode chegar aqui antes de o jogo sequer começar.
    const start = toTimestamp(kickoffOf(bet) ?? bet.dateTime);
    return start > 0 && start <= now.getTime();
}
