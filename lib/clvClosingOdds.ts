// Regra partilhada pelo backend e pelo frontend para odds de fecho por perna.
// Este módulo é deliberadamente independente da camada React/src: as rotas da
// Vercel podem importá-lo sem carregar dependências exclusivas do browser.

function validClosingOdd(value: unknown): number | null {
  const odd = typeof value === "number" ? value : Number(value);
  return Number.isFinite(odd) && odd > 1 ? odd : null;
}

/**
 * Calcula a odd de fecho combinada. Uma múltipla só fica completa quando todas
 * as pernas têm uma odd de fecho válida; uma linha parcial continua pendente.
 */
export function combineClosingOdds(
  selections: Array<{ closingOdd?: unknown }> | undefined,
): number | null {
  if (!Array.isArray(selections) || selections.length === 0) return null;

  let product = 1;
  for (const selection of selections) {
    const odd = validClosingOdd(selection?.closingOdd);
    if (odd === null) return null;
    product *= odd;
  }

  return Number(product.toFixed(2));
}
