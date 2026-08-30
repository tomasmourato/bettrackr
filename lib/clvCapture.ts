// lib/clvCapture.ts
// Que pernas ler, e quando. Logica pura, partilhada entre a rota do servidor e
// o agente que corre na ligacao de casa - sao dois sitios a decidir a mesma
// coisa e a regra tem de viver num so.
//
// PROPOSITADAMENTE SEM IMPORTS ALEM do modulo irmao, que tambem e puro. A rota
// e compilada pela Vercel e o agente e empacotado num ficheiro unico para
// correr em Node sem instalar nada.

import { kickoffMs } from "./betclicOdds.js";

// A janela onde uma leitura conta: abre a 30 minutos do apito e FECHA a 5.
//
// Não é o último preço em absoluto de propósito. Na Betclic as odds descem
// muito nos minutos que antecedem o apito, e uma linha de fecho apanhada aí
// seria baixa de mais: como o CLV é (odd / fecho - 1), um fecho baixo demais
// inflaciona o CLV de toda a gente. Parar aos 5 minutos dá uma linha mais
// estável e erra por defeito, que é o lado certo para errar.
//
// A abertura larga não é desperdício: cada leitura substitui a anterior, por
// isso as primeiras são a rede de segurança para quando a última falhar.
//
// Ambas reguláveis por ambiente, para se afinarem sem novo deploy.
export const CAPTURE_WINDOW_MIN = Number(process.env.CLV_CAPTURE_WINDOW_MIN) || 30;
export const CAPTURE_CUTOFF_MIN = Number(process.env.CLV_CAPTURE_CUTOFF_MIN) || 5;

// Para pernas ainda sem `startsAtUtc`, o apito é estimado a partir do
// `startsAt` legado (hora local de quem importou, assumida como Lisboa). Uma
// janela larga dá à auto-cura a hipótese de ler o apito verdadeiro na página e
// gravá-lo - a partir daí a perna passa a ser tratada com precisão. Nunca menor
// do que a janela de captura, senão haveria pernas elegíveis que ninguém iria ler.
const DISCOVERY_WINDOW_MIN = Math.max(150, CAPTURE_WINDOW_MIN);

export interface Leg {
    betId: string;
    index: number;
    matchId: string;
    selectionId: string;
    event: string;
    /** Apito estimado (ms UTC) a partir do que está gravado na perna. */
    kickoff: number;
    /** true quando o apito veio de `startsAtUtc` e não de uma suposição. */
    exact: boolean;
    /** A perna já tem odd de fecho gravada? */
    filled: boolean;
}

export interface BetRow {
    id: string;
    selections: unknown;
    metadata: any;
}

export function asArray(raw: unknown): any[] {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
        try {
            const parsed = JSON.parse(raw || "[]");
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
}

/**
 * As pernas que vale a pena ir ler agora.
 *
 * Uma perna já preenchida à mão não se toca nunca: o que a pessoa escreveu vale
 * mais do que o que nós lemos. Uma preenchida por nós pode ser substituída
 * enquanto o jogo não começar - é assim que a leitura converge para o último
 * preço sem ser preciso guardar fotografias em lado nenhum, como a extensão faz.
 */
/** Origens escritas por maquina, que uma leitura melhor pode substituir. */
const MAQUINA = new Set(["server", "betclic"]);

export function legsToRead(rows: BetRow[], now: number): Leg[] {
    const legs: Leg[] = [];

    for (const row of rows) {
        // Quem escreveu a odd que la esta decide se pode ser melhorada.
        //
        // "manual" e de uma pessoa e nao se toca. "server" e "betclic" sao de
        // maquina: a da extensao e pior de propriedade - apanha a linha a zero
        // minutos do apito, dentro da zona em que as odds da Betclic desabam, e
        // sem tirar a margem. Deixar que bloqueasse a leitura boa era guardar a
        // pior das duas.
        const podeMelhorar = MAQUINA.has(row.metadata?.closingOddSource);
        const selections = asArray(row.selections);

        selections.forEach((selection, index) => {
            const matchId = selection?.sourceRef?.matchId;
            const selectionId = selection?.sourceRef?.selectionId;
            if (!matchId || !selectionId) return; // sem ids não há como ler

            const filled =
                selection?.closingOdd !== undefined && selection?.closingOdd !== null;
            // Preenchida por uma pessoa: intocável.
            if (filled && !podeMelhorar) return;

            const kickoff = kickoffMs(selection);
            if (kickoff === null) return; // sem apito não se sabe quando ler

            const faltam = kickoff - now;
            // Passado o corte já não há nada a gravar, por isso nem se vai lá.
            // (Inclui o depois do apito: aí o mercado está suspenso e o preço
            // que viesse seria lixo com ar de dado.)
            if (faltam <= CAPTURE_CUTOFF_MIN * 60_000) return;

            const exact = typeof selection?.startsAtUtc === "string";
            const janela = exact ? CAPTURE_WINDOW_MIN : DISCOVERY_WINDOW_MIN;
            if (faltam > janela * 60_000) return; // ainda é cedo

            legs.push({
                betId: String(row.id),
                index,
                matchId: String(matchId),
                selectionId: String(selectionId),
                event: String(selection?.event || ""),
                kickoff,
                exact,
                filled,
            });
        });
    }

    return legs;
}

// Quanto tem de divergir o apito anunciado para valer a pena reescrever a perna.
// Um minuto: abaixo disso é arredondamento e só daria escritas a cada passagem.
const TOLERANCIA_CURA_MS = 60_000;

/**
 * O apito a gravar na perna, ou `null` quando não há nada a corrigir.
 *
 * O horário que a Betclic anuncia na própria página do jogo manda sobre o que
 * a aposta trouxe do importador - e manda SEMPRE, não apenas quando a perna
 * chega sem `startsAtUtc`.
 *
 * Até 30/08/2026 a correção só se aplicava a pernas sem `startsAtUtc`, na
 * suposição de que um horário importado era exato. Não é. Nesse dia uma aposta
 * em Jaime Faria - Jenson Brooksby foi importada com apito às 17:20Z e a
 * Betclic passou a anunciar 19:00Z - no ténis a ordem de jogos escorrega horas.
 * A perna foi lida na janela do horário velho, o horário certo estava na
 * página, e foi deitado fora aqui. Às 17:15Z saiu da janela e nunca mais foi
 * pedida: o jogo começou às 19:00Z sem odd de fecho nenhuma.
 *
 * Corrigido o horário, a perna volta sozinha à janela certa - a leitura que
 * descobre o adiamento é a mesma que o conserta, sem custar um pedido a mais.
 */
export function curaDeHorario(
    anunciadoMs: number | null,
    leg: Pick<Leg, "kickoff" | "exact">,
): string | null {
    if (anunciadoMs === null || Number.isNaN(anunciadoMs)) return null;
    // Normalizado à saída: a Betclic serve o instante com sete casas decimais
    // ("2026-08-30T19:00:00.0000000Z") e não é isso que se guarda na aposta.
    const iso = new Date(anunciadoMs).toISOString();
    // Sem horário fiável, qualquer anúncio é melhor do que a estimativa.
    if (!leg.exact) return iso;
    return Math.abs(anunciadoMs - leg.kickoff) > TOLERANCIA_CURA_MS ? iso : null;
}
