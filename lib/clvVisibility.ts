// lib/clvVisibility.ts
// Tirar a odd de fecho e o CLV de uma aposta antes de a mandar para quem não
// paga.
//
// O CLV é funcionalidade paga. Esconder a coluna no ecrã não chega: o
// `/api/bets` devolve o mesmo JSON a toda a gente, e quem abrisse a consola do
// browser via lá o valor na mesma. Um bloqueio que se contorna com F12 não é
// um bloqueio - é decoração. Por isso o corte é feito aqui, no servidor, e o
// que o cliente faz é só a versão educada de dizer que aquilo existe.
//
// PROPOSITADAMENTE SEM IMPORTS: é chamada tanto pela rota REST como pelo SSR
// do server.ts, que são empacotados em separado.

/** Campos por perna que só existem por causa do CLV. */
const CAMPOS_DA_PERNA = ["closingOdd", "closingOddNoVig", "closingOddMargin"] as const;

/** Marcas de captura na metadata da aposta. */
const CAMPOS_DA_METADATA = [
    "closingOddSource",
    "closingOddCapturedAt",
    "closingOddLeadMinutes",
] as const;

/**
 * A mesma linha, sem nada que revele a linha de fecho.
 *
 * Não toca na base de dados: o que está gravado fica gravado. Uma conta que
 * volte a ter subscrição volta a ver o histórico todo, incluindo o que foi
 * capturado enquanto esteve de fora - apagar seria castigar quem pausa o
 * pagamento durante um mês.
 */
export function semClv<T extends Record<string, any>>(row: T): T {
    const limpa: Record<string, any> = { ...row, closing_odd: null };

    const selections =
        typeof row.selections === "string"
            ? (() => {
                  try {
                      return JSON.parse(row.selections || "[]");
                  } catch {
                      return null;
                  }
              })()
            : row.selections;

    if (Array.isArray(selections)) {
        const podadas = selections.map((s: any) => {
            if (!s || typeof s !== "object") return s;
            const perna = { ...s };
            for (const campo of CAMPOS_DA_PERNA) delete perna[campo];
            return perna;
        });
        // Devolve na mesma forma em que veio: o SSR serializa o que recebe.
        limpa.selections = typeof row.selections === "string" ? JSON.stringify(podadas) : podadas;
    }

    if (limpa.metadata && typeof limpa.metadata === "object") {
        const metadata = { ...limpa.metadata };
        for (const campo of CAMPOS_DA_METADATA) delete metadata[campo];
        limpa.metadata = metadata;
    }

    return limpa as T;
}

/** O mesmo, para uma lista. Devolve a original quando há acesso. */
export function comClvSeEntitled<T extends Record<string, any>>(
    rows: T[],
    entitled: boolean,
): T[] {
    return entitled ? rows : rows.map(semClv);
}
