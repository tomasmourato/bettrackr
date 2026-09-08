// lib/clvProfile.ts
// O retrato do CLV de UM utilizador, para dar contexto à IA.
//
// Porquê no servidor e não no cliente: o painel já calcula tudo isto no
// browser (src/lib/clv.ts), mas a IA corre no servidor e a rota das dicas do
// dia nem sequer recebe as apostas. Recalcular aqui, a partir da base de
// dados, é a diferença entre um contexto que se confia e um número que o
// cliente mandou. As REGRAS não são recalculadas - vêm do lib/clvMath.ts, o
// mesmo módulo que o painel usa, para as duas leituras não divergirem.
//
// O que isto NÃO é: uma previsão. É histórico - "esta pessoa costuma apanhar
// preços acima ou abaixo da linha de fecho, e em quê". O modelo recebe-o como
// contexto sobre o apostador, nunca como sinal sobre o jogo.

import {
    betClv,
    isClvEligible,
    isPromoBet,
    round2,
    safeNum,
    type ClvBet,
} from "./clvMath.js";

/** Uma linha do retrato: por família de mercado, por desporto ou por casa. */
export interface ClvGroupRow {
    label: string;
    bets: number;
    avgClvPct: number;
    /** Percentagem de 0 a 100 - a mesma unidade do ClvSummary do painel. */
    beatCloseRate: number;
}

export interface ClvProfile {
    /** Apostas medidas: elegíveis, com odd de fecho e não promocionais. */
    bets: number;
    avgClvPct: number;
    /** Percentagem de 0 a 100, como no painel. */
    beatCloseRate: number;
    /** Média ponderada pela stake. null quando não houve dinheiro real. */
    weightedClvPct: number | null;
    byMarketFamily: ClvGroupRow[];
    bySport: ClvGroupRow[];
    byBookmaker: ClvGroupRow[];
}

/**
 * A amostra mínima para uma linha entrar no retrato.
 *
 * Abaixo disto o número é ruído, e dar ruído à IA é pior do que não dar nada:
 * ela usa o que lhe derem, e "tens -14% de CLV nos handicaps" a partir de duas
 * apostas é uma frase confiante construída sobre nada.
 */
export const AMOSTRA_MINIMA = 5;

/** Quantas linhas por eixo, no máximo. O prompt não pode crescer sem limite. */
const MAX_LINHAS = 6;

/**
 * O nome do mercado reduzido a uma FAMÍLIA, para agrupar.
 *
 * Sem isto cada linha de Acima/Abaixo é um mercado diferente ("Mais de 2.5",
 * "Mais de 3.5", ...) e nenhuma chega à amostra mínima. Os números saem, os
 * acentos e a pontuação também, e o que sobra é a família.
 */
export function marketFamily(market: unknown): string {
    const cru = String(market ?? "").trim();
    if (cru === "") return "";

    const limpo = cru
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[0-9]+([.,][0-9]+)?/g, " ")
        .replace(/[^a-z ]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    // As famílias que a Betclic e os CSV usam, na forma que o utilizador lê.
    if (/(acima|abaixo|mais de|menos de|over|under|total de golos)/.test(limpo)) {
        return "Acima/Abaixo";
    }
    if (/(ambas.*marcam|as duas equipas marcam|btts)/.test(limpo)) return "Ambas marcam";
    if (/handicap/.test(limpo)) return "Handicap";
    if (/(resultado corre|resultado exato|correct score)/.test(limpo)) return "Resultado exato";
    if (/(dupla hipotese|resultado duplo|double chance)/.test(limpo)) return "Dupla hipótese";
    if (/(marcador|jogador\w* marca|goalscorer|anytime scorer)/.test(limpo)) return "Marcadores";
    if (/(parte|intervalo|half)/.test(limpo)) return "Partes/Intervalo";
    if (/(resultado|vencedor|moneyline|match winner|full time result)/.test(limpo)) {
        return "Resultado final";
    }

    // Sem família conhecida fica o nome como veio - é melhor uma etiqueta feia
    // do que juntar mercados que não têm nada a ver.
    return cru.slice(0, 40);
}

/** O desporto do boletim: o da primeira perna que o traga. */
function sportOf(bet: ClvBet): string {
    for (const selection of bet.selections || []) {
        const sport = String(selection?.sport ?? "").trim();
        if (sport) return sport;
    }
    return "";
}

/** As famílias de mercado do boletim, sem repetições. */
function familiesOf(bet: ClvBet): string[] {
    const vistas = new Set<string>();
    for (const selection of bet.selections || []) {
        // `||` e não `??`: um mercado vazio é tão inútil como um ausente, e nos
        // CSV antigos o nome do mercado vem muitas vezes só no `betType`.
        const family = marketFamily(selection?.market || selection?.betType);
        if (family) vistas.add(family);
    }
    return [...vistas];
}

interface Acumulador {
    bets: number;
    sumPct: number;
    beat: number;
}

function acumula(mapa: Map<string, Acumulador>, label: string, clvPct: number, beat: boolean) {
    const linha = mapa.get(label) ?? { bets: 0, sumPct: 0, beat: 0 };
    linha.bets++;
    linha.sumPct += clvPct;
    if (beat) linha.beat++;
    mapa.set(label, linha);
}

/** As linhas com amostra que chegue, das mais medidas para as menos. */
function linhas(mapa: Map<string, Acumulador>): ClvGroupRow[] {
    return [...mapa.entries()]
        .filter(([label, linha]) => label !== "" && linha.bets >= AMOSTRA_MINIMA)
        .map(([label, linha]) => ({
            label,
            bets: linha.bets,
            avgClvPct: round2(linha.sumPct / linha.bets),
            beatCloseRate: round2((linha.beat / linha.bets) * 100),
        }))
        .sort((a, b) => b.bets - a.bets)
        .slice(0, MAX_LINHAS);
}

/**
 * O retrato, ou null quando não há amostra que chegue para dizer seja o que
 * for. null é o caso normal de quem acabou de começar, e a rota trata-o como
 * "não há contexto" em vez de mandar zeros para o prompt.
 *
 * As promocionais ficam de fora, pela mesma razão que ficam fora das médias do
 * painel: uma aposta turbinada é boa aposta por causa do boost, e o CLV dela
 * não diz nada sobre as escolhas de quem a fez.
 */
export function buildClvProfile(bets: ClvBet[], amostraMinima = AMOSTRA_MINIMA): ClvProfile | null {
    let medidas = 0;
    let sumPct = 0;
    let beat = 0;
    let stakeTotal = 0;
    let sumPctPorStake = 0;

    const porFamilia = new Map<string, Acumulador>();
    const porDesporto = new Map<string, Acumulador>();
    const porCasa = new Map<string, Acumulador>();

    for (const bet of bets) {
        if (!isClvEligible(bet) || isPromoBet(bet)) continue;
        const clv = betClv(bet);
        if (!clv) continue;

        medidas++;
        sumPct += clv.clvPct;
        if (clv.beatClose) beat++;

        if (!bet.isFreebet) {
            const stake = safeNum(bet.stake);
            stakeTotal += stake;
            sumPctPorStake += clv.clvPct * stake;
        }

        for (const family of familiesOf(bet)) acumula(porFamilia, family, clv.clvPct, clv.beatClose);
        acumula(porDesporto, sportOf(bet), clv.clvPct, clv.beatClose);
        acumula(porCasa, String(bet.bookmaker ?? "").trim(), clv.clvPct, clv.beatClose);
    }

    if (medidas < amostraMinima) return null;

    return {
        bets: medidas,
        avgClvPct: round2(sumPct / medidas),
        beatCloseRate: round2((beat / medidas) * 100),
        weightedClvPct: stakeTotal > 0 ? round2(sumPctPorStake / stakeTotal) : null,
        byMarketFamily: linhas(porFamilia),
        bySport: linhas(porDesporto),
        byBookmaker: linhas(porCasa),
    };
}
