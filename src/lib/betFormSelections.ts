// A fusão entre o que o formulário edita e a perna como ela estava.
//
// PORQUE EXISTE
// O formulário edita cinco campos por perna: evento, mercado, escolha, odd e
// odd de fecho. A perna gravada tem muito mais - `sourceRef`, `startsAtUtc`,
// `result`, o de-vig, `isBoosted`, `sport`, `betType` - e nada disso tem caixa
// no ecrã. Enquanto se listou campo a campo o que havia a preservar, cada
// campo novo era esquecido: o `startsAt` foi lembrado, o `result` só no
// desktop, e o resto perdia-se ao gravar. Abrir e gravar uma aposta importada
// apagava o `sourceRef` (e com ele a hipótese de o agente voltar a ler a
// perna), o `startsAtUtc` e a marca de anulada.
//
// A regra passa a ser a inversa: parte-se da perna INTEIRA e substitui-se o
// que o formulário edita. Um campo novo em Selection fica preservado sozinho.
//
// Existe também para os dois formulários - o do desktop (BetsManager) e o do
// mobile (useBetForm) - deixarem de ter cópias que divergem em silêncio.

import type { Selection, SelectionResult } from "../types";

/** Uma linha do formulário. Os valores editáveis são texto, como no ecrã. */
export interface FormSelectionRow {
  event: string;
  market: string;
  choice: string;
  odd: string;
  /** Odd de fecho desta perna; vazia enquanto não se souber. */
  closingOdd: string;
  // Hora do apito. Não é editável - vem da extensão - mas anda por aqui para
  // uma edição à mão não a deitar fora sem querer.
  startsAt?: string;
  /** Resultado desta perna. Também não editável; conta para a odd combinada. */
  result?: SelectionResult;
  /**
   * A perna como veio, quando esta linha nasceu de uma aposta já gravada.
   * É daqui que sai tudo o que o formulário não edita.
   */
  original?: Selection;
}

/**
 * A perna a gravar: a original com os campos do formulário por cima.
 *
 * A odd de fecho manda pelo formulário, incluindo quando é apagada - é assim
 * que o site consegue LIMPAR uma odd de fecho. E se ela mudar, a justa e a
 * margem vão atrás: pertencem à odd crua de onde saíram, e deixá-las ao lado
 * de uma odd nova era guardar uma margem que já não é de lado nenhum. É a
 * mesma regra que o servidor aplica em applyToBet.
 */
export function mergeSelection(
  row: FormSelectionRow,
  id: string,
  odd: number,
  closingOdd: number | null,
): Selection {
  const merged: Selection = {
    ...(row.original ?? {}),
    id,
    event: row.event.trim(),
    market: row.market.trim(),
    choice: row.choice.trim(),
    odd,
  };

  if (closingOdd !== null && closingOdd > 1) merged.closingOdd = closingOdd;
  else delete merged.closingOdd;

  if (merged.closingOdd !== row.original?.closingOdd) {
    delete merged.closingOddNoVig;
    delete merged.closingOddMargin;
  }

  if (row.startsAt) merged.startsAt = row.startsAt;
  if (row.result) merged.result = row.result;

  return merged;
}

/**
 * A odd combinada das pernas que contam.
 *
 * Uma perna anulada fica de fora, tal como já está fora da odd que a casa
 * pagou: quando o jogo não se realiza, a casa devolve-lhe o valor 1 e volta a
 * liquidar o boletim com as restantes. Sem isto, gravar uma múltipla com um
 * jogo cancelado punha-lhe de volta uma odd que ninguém pagou - uma dupla com
 * o Coquimbo Unido @1.43 anulado e o Saprissa @1.21 saltava de 1.21 para 1.73.
 *
 * É a irmã do combineClosingOdds, que faz o mesmo do lado da linha de fecho.
 */
export function combineFormOdds(
  rows: FormSelectionRow[],
  parse: (value: string) => number | null,
): number {
  let multiplier = 1;
  let validCount = 0;

  for (const row of rows) {
    if (row.result === "ANULADA") continue;
    const parsed = parse(row.odd);
    if (parsed !== null && parsed > 0) {
      multiplier *= parsed;
      validCount++;
    }
  }

  return validCount > 0 ? Number(multiplier.toFixed(2)) : 1.0;
}
