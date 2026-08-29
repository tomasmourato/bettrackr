// src/lib/clv.ts
// Matemática do CLV (Closing Line Value). Módulo puro (sem React) para poder
// ser testado como o resto das contas de dinheiro, em extension/test.
//
// Tudo o que a app media até aqui - lucro, yield, ROI da banca, taxa de acerto
// - é RESULTADO: depende da sorte e só fica legível ao fim de muitas apostas.
// O CLV mede PROCESSO. Compara a odd a que se apostou com a odd de fecho (a
// última antes de o evento começar, que é a melhor estimativa pública da
// probabilidade verdadeira) e responde a "estou a apanhar preços melhores do
// que o mercado?" - a pergunta cuja resposta chega primeiro.
//
// As contas, com `odd` a odd apanhada e `close` a odd de fecho:
//
//   CLV %           = (odd / close - 1) * 100
//   CLV em dinheiro = stake * (odd / close - 1)
//
// A segunda não é uma invenção: tratando a linha de fecho como a probabilidade
// verdadeira (p = 1/close), o valor esperado da aposta é exatamente
// stake * (p * (odd - 1) - (1 - p)), que simplifica para aquilo. Por isso o
// "CLV em dinheiro" lê-se como o lucro que a aposta valia à partida.
//
// Quatro decisões que valem a pena estar escritas:
//
//  * As apostas POR LIQUIDAR CONTAM. A odd de fecho existe assim que o evento
//    começa, muito antes de haver resultado - e é esse o motivo de o CLV
//    existir. É a única estatística da app que não espera pela liquidação.
//
//  * As ANULADAS ficam de fora: o evento não se realizou, por isso não há
//    linha de fecho que queira dizer alguma coisa. As IGNORADAS ficam de fora
//    como ficam de todas as outras estatísticas.
//
//  * As freebets entram na percentagem e na taxa de bater a linha, mas não no
//    CLV em dinheiro. É a mesma convenção que o calculateDashboardStats já
//    usa (as freebets contam para o resultado, não para o volume apostado): a
//    stake de uma freebet não é dinheiro do utilizador, e somá-la em euros
//    misturaria dinheiro promocional com dinheiro real. Uma aposta SEM RISCO é
//    dinheiro real e conta para tudo.
//
//  * As apostas PROMOCIONAIS (boosts, odds turbo, missões) ficam fora das
//    médias por inteiro - não só do dinheiro, como as freebets. Uma odd
//    turbinada está acima do mercado por construção: bater a linha de fecho
//    com ela diz que a casa ofereceu valor, não que a escolha foi boa. São
//    contadas e mostradas à parte, porque saber quanto valeram as promoções é
//    útil - só não é a mesma pergunta.
//
//  * A odd de fecho é usada CRUA, com a margem da casa lá dentro. O CLV
//    rigoroso compara com a linha sem margem (no-vig), o que exigiria as odds
//    de fecho de todos os resultados do mercado - que não temos. O efeito é
//    conhecido e sempre no mesmo sentido: estes números são pessimistas em
//    aproximadamente a margem da casa (tipicamente 2 a 5 pontos percentuais).
//    Por isso o que interessa é a tendência e a comparação entre casas, não o
//    zero absoluto. A UI diz isto ao utilizador (chave i18n "clv.help").

import { Bet } from "../types";
import { safeNum } from "../utils";
import { combineClosingOdds } from "../../lib/clvClosingOdds";

export { combineClosingOdds } from "../../lib/clvClosingOdds";

/** O CLV de uma aposta, já calculado. */
export interface ClvBetResult {
  /** (odd / fecho - 1) * 100. Positivo = apanhou-se melhor preço que o fecho. */
  clvPct: number;
  /** stake * (odd / fecho - 1). Sempre 0 numa freebet (não é dinheiro real). */
  moneyClv: number;
  /** A odd apanhada foi estritamente melhor do que a de fecho. */
  beatClose: boolean;
}

/** Um ponto da evolução do CLV, já com o acumulado. */
export interface ClvPoint {
  at: string;
  cumulative: number;
  clvPct: number;
}

export interface ClvBookmakerRow {
  bookmaker: string;
  bets: number;
  avgClvPct: number;
  moneyClv: number;
}

export interface ClvSummary {
  /** Elegíveis COM odd de fecho registada. */
  trackedBets: number;
  /** Seguidas menos as promocionais - a base de todas as médias. */
  ratedBets: number;
  /** Elegíveis, com ou sem odd de fecho. */
  eligibleBets: number;
  /** Elegíveis cujo evento já começou e continuam sem odd de fecho. */
  pendingFill: number;
  /** trackedBets / eligibleBets * 100. */
  coveragePct: number;
  /** % das seguidas em que a odd apanhada bateu a de fecho. */
  beatCloseRate: number;
  /** Média simples do CLV %, freebets incluídas. */
  avgClvPct: number;
  /** Média ponderada pela stake real. null quando não há dinheiro real seguido. */
  weightedClvPct: number | null;
  /** Soma do CLV em dinheiro (só apostas de dinheiro real). */
  moneyClv: number;
  /** Volume real sobre o qual o moneyClv foi medido. */
  clvStake: number;
  /** Seguidas que são promocionais (boost/turbo/missão), contadas à parte. */
  promoBets: number;
  /** Média do CLV % só das promocionais - quanto valeram as promoções. */
  promoAvgClvPct: number;
  /** CLV em dinheiro só das promocionais. */
  promoMoneyClv: number;
  /** Seguidas com odd justa (sem margem) apurada - o subconjunto medido abaixo. */
  noVigBets: number;
  /** Média do CLV % contra a linha SEM margem. Só sobre as `noVigBets`. */
  noVigAvgClvPct: number;
  /** CLV em dinheiro contra a linha sem margem, no mesmo subconjunto. */
  noVigMoneyClv: number;
  /** Margem média dos mercados de onde as odds justas saíram, em %. */
  noVigAvgMarginPct: number;
  /** false quando não há uma única odd de fecho: a UI mostra o estado vazio. */
  hasData: boolean;
  series: ClvPoint[];
  byBookmaker: ClvBookmakerRow[];
}

/**
 * "YYYY-MM-DD HH:mm" -> epoch ms. O replace do espaço por "T" é o mesmo
 * remendo que o Dashboard e a banca já usam: sem ele o Safari não parseia a
 * data. Datas inválidas caem para 0 e ficam no início, de forma determinística.
 */
function toTimestamp(value: string | undefined): number {
  if (!value) return 0;
  const parsed = new Date(value.replace(" ", "T")).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Parte da data ("YYYY-MM-DD") de um "YYYY-MM-DD HH:mm". */
function dayOf(value: string | undefined): string {
  return value ? value.split(" ")[0] : "";
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

/** Uma odd só serve para o CLV se for uma odd decimal a sério (> 1). */
function validOdd(value: unknown): number | null {
  const odd = safeNum(value);
  return Number.isFinite(odd) && odd > 1 ? odd : null;
}

/**
 * A odd de fecho do boletim: o produto das odds de fecho das pernas, tal como
 * a `odd` é o produto das odds apanhadas.
 *
 * Devolve null se FALTAR uma perna que seja. Meia múltipla não dá meia linha
 * de fecho - dava um número que parecia bom e não era, por isso é preferível
 * o boletim continuar por preencher.
 *
 * Vive aqui, e não no formulário, porque há dois escritores (o formulário e a
 * extensão) e a invariante "combinada = produto das pernas" não pode ser
 * calculada em dois sítios. O servidor usa esta mesma função.
 */
/**
 * O apito do jogo, quando se sabe. Numa múltipla é o do jogo que começa por
 * ÚLTIMO: é a partir daí que todas as pernas têm linha de fecho.
 *
 * Cai no Bet.dateTime quando nenhuma perna traz hora - mas isso é um recurso,
 * não um equivalente: na Betclic o dateTime é o momento em que o boletim foi
 * feito (placed_date_utc), que pode ser dias antes do jogo.
 */
export function kickoffOf(bet: Bet): string | undefined {
  const times = (bet.selections || [])
    .map((selection) => selection?.startsAt)
    .filter((value): value is string => Boolean(value));
  if (times.length === 0) return undefined;
  return times.reduce((latest, value) => (value > latest ? value : latest));
}

/**
 * Mercados promocionais, para quando não há melhor: "Boost (10€ máx.)" é o
 * segundo mercado mais usado da conta real, e há ainda odds turbo e missões.
 *
 * É só a rede de segurança. O sinal bom é o `isBoosted` da perna, que vem do
 * `is_boosted_odd` da própria Betclic e apanha boosts que o rótulo do mercado
 * não denuncia. A expressão fica para as apostas escritas à mão e para os CSV,
 * que não trazem a marca.
 *
 * Não inclui "Dicas da Casa": é uma escolha sugerida pela casa a preço normal,
 * não um preço turbinado - o CLV dessas diz alguma coisa.
 */
const PROMO_MARKET_RE = /boost|turbo|missão|missao|super\s*odd/i;

/**
 * Aposta promocional se QUALQUER perna o for - a mesma regra do filtro de
 * desporto. Numa múltipla basta uma perna turbinada para o preço do boletim
 * deixar de ser comparável com o mercado.
 */
export function isPromoBet(bet: Bet): boolean {
  return (bet.selections || []).some(
    (selection) =>
      selection?.isBoosted === true ||
      PROMO_MARKET_RE.test(`${selection?.market ?? ""} ${selection?.betType ?? ""}`),
  );
}

/**
 * A aposta entra nas contas do CLV? Ignoradas e anuladas não; tudo o resto
 * sim, incluindo as que ainda estão por liquidar.
 */
export function isClvEligible(bet: Bet): boolean {
  return !bet.isIgnored && bet.status !== "ANULADA";
}

/**
 * O CLV de uma aposta, ou null quando não há nada a medir - aposta não
 * elegível, sem odd de fecho registada, ou com odds que não fazem sentido.
 */
export function betClv(bet: Bet): ClvBetResult | null {
  if (!isClvEligible(bet)) return null;

  const odd = validOdd(bet.odd);
  const close = validOdd(bet.closingOdd);
  if (odd === null || close === null) return null;

  const ratio = odd / close - 1;

  return {
    clvPct: round2(ratio * 100),
    // A stake de uma freebet não é dinheiro do utilizador: em euros o CLV dela
    // é zero, por melhor que a percentagem seja.
    moneyClv: bet.isFreebet ? 0 : round2(safeNum(bet.stake) * ratio),
    beatClose: odd > close,
  };
}

/**
 * O mesmo CLV, mas contra a linha de fecho SEM a margem da casa.
 *
 * É a medida honesta, e vai dar sempre um número MAIS BAIXO do que o cru - a
 * margem estava a inflacionar o CLV, não a encolhê-lo. Medido num 1X2 real da
 * Betclic com 9.8% de margem: quem apanhou 1.30 contra um fecho de 1.23 tem
 * +5.7% de CLV cru e -3.8% de CLV real. Os +5.7% eram a margem da casa.
 *
 * null quando não há odd justa - o mercado completo nem sempre está na página.
 */
export function betClvNoVig(bet: Bet): ClvBetResult | null {
  if (!isClvEligible(bet)) return null;

  const odd = validOdd(bet.odd);
  const close = validOdd(bet.closingOddNoVig);
  if (odd === null || close === null) return null;

  const ratio = odd / close - 1;

  return {
    clvPct: round2(ratio * 100),
    moneyClv: bet.isFreebet ? 0 : round2(safeNum(bet.stake) * ratio),
    beatClose: odd > close,
  };
}

/**
 * A aposta está à espera de que alguém lhe registe a odd de fecho? É isto que
 * alimenta a caixa de entrada: elegível, sem odd de fecho e com o evento já
 * começado - antes disso ainda não existe linha de fecho nenhuma.
 */
export function needsClosingOdd(bet: Bet, now: Date = new Date()): boolean {
  if (!isClvEligible(bet)) return false;
  if (validOdd(bet.closingOdd) !== null) return false;
  // O apito, quando o conhecemos; senão a data do boletim, que na Betclic é a
  // da aposta e por isso pode chegar aqui antes de o jogo sequer começar.
  const start = toTimestamp(kickoffOf(bet) ?? bet.dateTime);
  return start > 0 && start <= now.getTime();
}

export function calculateClv(bets: Bet[], now: Date = new Date()): ClvSummary {
  let eligibleBets = 0;
  let trackedBets = 0;
  let ratedBets = 0;
  let pendingFill = 0;
  let beatCount = 0;
  let sumClvPct = 0;
  let moneyClv = 0;
  let clvStake = 0;
  let promoBets = 0;
  let promoSumClvPct = 0;
  let promoMoneyClv = 0;
  // A medida sem margem anda à parte: só uma parte das pernas tem mercado
  // completo na página, e misturar as duas numa média só daria um número que
  // não significa nada - a mesma disciplina dos boosts.
  let noVigBets = 0;
  let noVigSumClvPct = 0;
  let noVigMoneyClv = 0;
  let marginSum = 0;
  let marginCount = 0;

  interface ClvEvent {
    ts: number;
    at: string;
    moneyClv: number;
    clvPct: number;
  }
  const events: ClvEvent[] = [];

  const byBookmaker = new Map<string, { bets: number; sumPct: number; money: number }>();

  for (const bet of bets) {
    if (!isClvEligible(bet)) continue;
    eligibleBets++;

    const clv = betClv(bet);
    if (!clv) {
      if (needsClosingOdd(bet, now)) pendingFill++;
      continue;
    }

    trackedBets++;

    // Promocional: conta-se à parte e não entra em mais nada. A odd está acima
    // do mercado por construção, por isso poluía a média e o gráfico.
    if (isPromoBet(bet)) {
      promoBets++;
      promoSumClvPct += clv.clvPct;
      promoMoneyClv += clv.moneyClv;
      continue;
    }

    ratedBets++;
    sumClvPct += clv.clvPct;
    if (clv.beatClose) beatCount++;

    const semVig = betClvNoVig(bet);
    if (semVig) {
      noVigBets++;
      noVigSumClvPct += semVig.clvPct;
      if (!bet.isFreebet) noVigMoneyClv += semVig.moneyClv;
      for (const selection of bet.selections || []) {
        const margem = selection?.closingOddMargin;
        if (typeof margem === "number" && Number.isFinite(margem)) {
          marginSum += margem;
          marginCount++;
        }
      }
    }

    // Só o dinheiro real entra no CLV em euros - e, para a média ponderada
    // fazer sentido, o volume tem de ser exatamente o mesmo subconjunto.
    if (!bet.isFreebet) {
      moneyClv += clv.moneyClv;
      clvStake += safeNum(bet.stake);
    }

    events.push({
      ts: toTimestamp(bet.dateTime),
      at: dayOf(bet.dateTime),
      moneyClv: clv.moneyClv,
      clvPct: clv.clvPct,
    });

    const name = bet.bookmaker || "";
    const row = byBookmaker.get(name) ?? { bets: 0, sumPct: 0, money: 0 };
    row.bets++;
    row.sumPct += clv.clvPct;
    row.money += clv.moneyClv;
    byBookmaker.set(name, row);
  }

  // Uma passagem única sobre os eventos por ordem cronológica constrói a série.
  events.sort((a, b) => a.ts - b.ts);

  const series: ClvPoint[] = [];
  let running = 0;
  for (const event of events) {
    running += event.moneyClv;
    series.push({
      at: event.at,
      cumulative: round2(running),
      clvPct: event.clvPct,
    });
  }

  return {
    trackedBets,
    ratedBets,
    eligibleBets,
    pendingFill,
    // A cobertura é sobre dados preenchidos, não sobre a qualidade da amostra:
    // uma promocional com linha de fecho está preenchida na mesma.
    coveragePct: eligibleBets > 0 ? round2((trackedBets / eligibleBets) * 100) : 0,
    beatCloseRate: ratedBets > 0 ? round2((beatCount / ratedBets) * 100) : 0,
    avgClvPct: ratedBets > 0 ? round2(sumClvPct / ratedBets) : 0,
    // Sem dinheiro real seguido não há volume sobre o qual ponderar.
    weightedClvPct: clvStake > 0 ? round2((moneyClv / clvStake) * 100) : null,
    moneyClv: round2(moneyClv),
    clvStake: round2(clvStake),
    promoBets,
    promoAvgClvPct: promoBets > 0 ? round2(promoSumClvPct / promoBets) : 0,
    promoMoneyClv: round2(promoMoneyClv),
    noVigBets,
    noVigAvgClvPct: noVigBets > 0 ? round2(noVigSumClvPct / noVigBets) : 0,
    noVigMoneyClv: round2(noVigMoneyClv),
    noVigAvgMarginPct: marginCount > 0 ? round2(marginSum / marginCount) : 0,
    hasData: trackedBets > 0,
    series,
    byBookmaker: Array.from(byBookmaker.entries())
      .map(([bookmaker, row]) => ({
        bookmaker,
        bets: row.bets,
        avgClvPct: round2(row.sumPct / row.bets),
        moneyClv: round2(row.money),
      }))
      // Mais apostas primeiro: é a casa com mais amostra que diz alguma coisa.
      .sort((a, b) => b.bets - a.bets || a.bookmaker.localeCompare(b.bookmaker)),
  };
}
