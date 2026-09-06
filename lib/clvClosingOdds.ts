// Regra partilhada pelo backend e pelo frontend para odds de fecho por perna.
// Este módulo é deliberadamente independente da camada React/src: as rotas da
// Vercel podem importá-lo sem carregar dependências exclusivas do browser.

function validClosingOdd(value: unknown): number | null {
  const odd = typeof value === "number" ? value : Number(value);
  return Number.isFinite(odd) && odd > 1 ? odd : null;
}

/**
 * Calcula a odd de fecho combinada. Uma múltipla só fica completa quando todas
 * as pernas que CONTAM têm uma odd de fecho válida; uma linha parcial continua
 * pendente.
 *
 * Uma perna anulada não conta - sai do produto, tal como já saiu da odd da
 * aposta. Quando um jogo não se realiza, a casa devolve àquela perna o valor 1
 * e volta a liquidar o boletim com as restantes.
 *
 * Sem isto o CLV comparava coisas diferentes. Caso real (31/08/2026): uma dupla
 * com o Coquimbo Unido @1.43 anulado e o Saprissa @1.21 ganho ficou com a odd
 * em 1.21, que é o que a Betclic pagou, mas com a linha de fecho em 1.54 - o
 * produto de 1.33 x 1.16, ainda com as duas pernas. O painel mostrava -21.4%,
 * que não era um mau preço nenhum: era o preço de uma perna dividido pela linha
 * de duas. Com a perna anulada de fora dá 1.16, e o CLV verdadeiro é +4.3%.
 */
export function combineClosingOdds(
  selections: Array<{ closingOdd?: unknown; result?: unknown }> | undefined,
): number | null {
  if (!Array.isArray(selections) || selections.length === 0) return null;

  // "ANULADA" é a forma canónica: o mapper da extensão já lá converte o Void,
  // Refunded, Canceled, Cancelled e Push das várias casas.
  const contam = selections.filter((selection) => selection?.result !== "ANULADA");
  // Todas anuladas é o boletim inteiro anulado, e esse não tem CLV nenhum para
  // medir - nem sequer chega aqui, porque o isClvEligible o exclui antes.
  if (contam.length === 0) return null;

  let product = 1;
  for (const selection of contam) {
    const odd = validClosingOdd(selection?.closingOdd);
    if (odd === null) return null;
    product *= odd;
  }

  return Number(product.toFixed(2));
}
