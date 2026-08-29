// routes/clvRoutes.ts
// A odd de fecho apanhada pelo servidor, sem o browser de ninguém aberto.
//
// A extensão já fazia isto, mas só com o Chrome ligado no momento do apito -
// quem fecha o portátil ao jantar perdia a linha, e quem só usa a app Android
// nunca a teve. A página de jogo da Betclic é pública: responde a um fetch sem
// cookies, sem User-Agent e sem bloqueio geográfico, e custa ~74KB com gzip.
// O browser do utilizador nunca foi preciso para ler a linha; era só o relógio.
//
// O ganho grande é a partilha: um jogo é lido UMA vez por passagem e serve
// todos os utilizadores que nele apostaram. Com a extensão, cem utilizadores no
// mesmo Benfica-Porto eram cem pedidos.

import { Router } from "express";
import pool from "../db/pool.js";
import { combineClosingOdds } from "../lib/clvClosingOdds.js";
import {
    betclicMatchPath,
    devig,
    kickoffMs,
    leadMinutesFrom,
    readMatchPage,
} from "../lib/betclicOdds.js";

const router = Router();

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
const CAPTURE_WINDOW_MIN = Number(process.env.CLV_CAPTURE_WINDOW_MIN) || 30;
const CAPTURE_CUTOFF_MIN = Number(process.env.CLV_CAPTURE_CUTOFF_MIN) || 5;

// Para pernas ainda sem `startsAtUtc`, o apito é estimado a partir do
// `startsAt` legado (hora local de quem importou, assumida como Lisboa). Uma
// janela larga dá à auto-cura a hipótese de ler o apito verdadeiro na página e
// gravá-lo - a partir daí a perna passa a ser tratada com precisão. Nunca menor
// do que a janela de captura, senão haveria pernas elegíveis que ninguém iria ler.
const DISCOVERY_WINDOW_MIN = Math.max(150, CAPTURE_WINDOW_MIN);

// Tetos por passagem: não martelar a Betclic e não estourar o maxDuration=60
// da função da Vercel. Uma página estabiliza em ~0.8s.
const MAX_MATCHES_PER_RUN = 25;
const TIME_BUDGET_MS = 40_000;
const FETCH_TIMEOUT_MS = 8_000;

const UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

interface Leg {
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

interface BetRow {
    id: string;
    selections: unknown;
    metadata: any;
}

function asArray(raw: unknown): any[] {
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
export function legsToRead(rows: BetRow[], now: number): Leg[] {
    const legs: Leg[] = [];

    for (const row of rows) {
        const escritaPeloServidor = row.metadata?.closingOddSource === "server";
        const selections = asArray(row.selections);

        selections.forEach((selection, index) => {
            const matchId = selection?.sourceRef?.matchId;
            const selectionId = selection?.sourceRef?.selectionId;
            if (!matchId || !selectionId) return; // sem ids não há como ler

            const filled =
                selection?.closingOdd !== undefined && selection?.closingOdd !== null;
            // Preenchida por uma pessoa: intocável.
            if (filled && !escritaPeloServidor) return;

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

/**
 * Le uma pagina de jogo, dizendo TAMBEM porque falhou quando falha.
 *
 * "Zero precos" juntava quatro avarias muito diferentes - pedido rebentado,
 * resposta nao-200, pagina sem ng-state, e ng-state sem precos - e sem as
 * separar nao ha como saber se o problema e a Betclic, a rede, ou o sitio de
 * onde o pedido sai. Nunca se inventa um preco: em qualquer destes casos a
 * leitura simplesmente nao acontece.
 */
async function fetchMatch(matchId: string, event: string) {
    const url = `https://www.betclic.pt${betclicMatchPath(matchId, event)}`;
    try {
        const res = await fetch(url, {
            headers: { "User-Agent": UA, "Accept-Language": "pt-PT,pt;q=0.9" },
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        const html = await res.text();
        if (!res.ok) {
            return { page: null, porque: `http-${res.status}`, kb: (html.length / 1024) | 0 };
        }
        const page = readMatchPage(html, matchId);
        const kb = (html.length / 1024) | 0;
        if (!html.includes("ng-state")) {
            // A pagina veio, mas sem o estado do Angular. E o que acontece quando
            // do outro lado nos servem uma variante diferente da que um browser
            // normal recebe.
            return { page: null, porque: `sem-ng-state(${kb}KB)`, kb };
        }
        if (page.odds.size === 0) return { page: null, porque: `ng-state-sem-precos(${kb}KB)`, kb };
        return { page, porque: null, kb };
    } catch (e: any) {
        return { page: null, porque: `pedido-falhou(${e?.name || "erro"})`, kb: 0 };
    }
}

interface LegUpdate {
    closingOdd?: number;
    /** A mesma odd sem a margem da casa. Ausente quando nao houve como apurar. */
    closingOddNoVig?: number;
    /** A margem do mercado, guardada para a correcao ser auditavel. */
    closingOddMargin?: number;
    startsAtUtc?: string;
    leadMinutes?: number;
}

/**
 * Aplica as leituras a uma aposta, com a linha bloqueada.
 *
 * O FOR UPDATE é pela mesma razão do PATCH /api/bets/:id/closing-odd: o
 * utilizador pode estar a preencher a mesma aposta no site enquanto isto corre,
 * e sem bloqueio o último a escrever levava o outro à frente em silêncio.
 */
async function applyToBet(
    betId: string,
    updates: Map<number, LegUpdate>,
    capturedAt: string,
): Promise<boolean> {
    const client = await pool.connect();
    let committed = false;
    try {
        await client.query("BEGIN");
        const current = await client.query(
            "SELECT selections, metadata FROM bets WHERE id = $1 FOR UPDATE",
            [betId],
        );
        if (current.rows.length === 0) return false;

        const selections = asArray(current.rows[0].selections);
        let mexeu = false;
        let piorLead: number | null = null;

        for (const [index, update] of updates) {
            if (!selections[index]) continue;
            const antes = selections[index];
            const depois = { ...antes };
            if (update.startsAtUtc && !antes.startsAtUtc) {
                depois.startsAtUtc = update.startsAtUtc;
                mexeu = true;
            }
            if (update.closingOdd !== undefined) {
                depois.closingOdd = update.closingOdd;
                // As tres andam juntas: a crua fica sempre, a justa e a margem
                // so quando o mercado completo deu para confiar. Uma perna que
                // deixe de ter mercado fiavel perde a justa em vez de ficar com
                // uma justa velha ao lado de uma crua nova.
                if (update.closingOddNoVig !== undefined) {
                    depois.closingOddNoVig = update.closingOddNoVig;
                    depois.closingOddMargin = update.closingOddMargin;
                } else {
                    delete depois.closingOddNoVig;
                    delete depois.closingOddMargin;
                }
                mexeu = true;
                if (update.leadMinutes !== undefined) {
                    // A pior perna manda na marca de qualidade, que é o honesto.
                    piorLead =
                        piorLead === null
                            ? update.leadMinutes
                            : Math.max(piorLead, update.leadMinutes);
                }
            }
            selections[index] = depois;
        }

        if (!mexeu) return false;

        // A combinada sai sempre do conjunto COMPLETO das pernas e fica null
        // enquanto faltar uma - meia múltipla não dá meia linha de fecho.
        const combinada = combineClosingOdds(selections);

        const marca: Record<string, unknown> = {};
        if (piorLead !== null) {
            marca.closingOddSource = "server";
            marca.closingOddCapturedAt = capturedAt;
            marca.closingOddLeadMinutes = piorLead;
        }

        await client.query(
            `UPDATE bets
                SET selections = $1::jsonb,
                    closing_odd = $2,
                    metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb,
                    updated_at = timezone('utc', now())
              WHERE id = $4`,
            [JSON.stringify(selections), combinada, JSON.stringify(marca), betId],
        );
        await client.query("COMMIT");
        committed = true;
        return true;
    } catch (error) {
        console.error(`[clv] falhou a escrever a aposta ${betId}:`, error);
        return false;
    } finally {
        if (!committed) await client.query("ROLLBACK").catch(() => {});
        client.release();
    }
}

async function runCapture(now = Date.now()) {
    const started = Date.now();

    const { rows } = await pool.query<BetRow>(
        `SELECT id, selections, metadata
           FROM bets
          WHERE status = 'POR_LIQUIDAR'
            AND is_ignored = false
            AND lower(bookmaker) = 'betclic'
            AND jsonb_typeof(selections) = 'array'
          LIMIT 2000`,
    );

    const legs = legsToRead(rows, now);

    // Agrupar por jogo: é aqui que está o ganho da captura no servidor. Duas
    // pernas do mesmo jogo, ou as apostas de vinte utilizadores no mesmo jogo,
    // são UM pedido.
    const porJogo = new Map<string, Leg[]>();
    for (const leg of legs) {
        const grupo = porJogo.get(leg.matchId);
        if (grupo) grupo.push(leg);
        else porJogo.set(leg.matchId, [leg]);
    }

    // Os jogos mais perto do apito primeiro: se o orçamento acabar, o que fica
    // por ler é o que ainda tem tempo de ser lido na passagem seguinte.
    const jogos = [...porJogo.entries()]
        .sort((a, b) => Math.min(...a[1].map((l) => l.kickoff)) - Math.min(...b[1].map((l) => l.kickoff)))
        .slice(0, MAX_MATCHES_PER_RUN);

    const porAposta = new Map<string, Map<number, LegUpdate>>();
    let lidos = 0;
    let semPrecos = 0;
    let comMercado = 0;
    const motivos: string[] = [];
    // Quantas pernas foram procuradas na pagina e nao estavam la: separa "a
    // pagina veio vazia" de "a pagina veio mas nao tinha a NOSSA seleccao".
    let semSeleccao = 0;
    const capturedAt = new Date(now).toISOString();

    for (const [matchId, grupo] of jogos) {
        if (Date.now() - started > TIME_BUDGET_MS) break;

        const leitura = await fetchMatch(matchId, grupo[0].event);
        lidos++;
        if (!leitura.page) {
            // O canario. Agora diz QUAL foi a avaria, para nao se andar a
            // adivinhar entre a Betclic ter mudado, a rede ter falhado, ou o
            // pedido estar a sair de um sitio a que servem outra pagina.
            semPrecos++;
            motivos.push(`${matchId}:${leitura.porque}`);
            continue;
        }
        const page = leitura.page;

        // O apito que a própria Betclic anuncia manda sobre o que está gravado.
        const apitoReal = page.kickoffUtc ? Date.parse(page.kickoffUtc) : NaN;
        const apito = Number.isNaN(apitoReal) ? null : apitoReal;

        for (const leg of grupo) {
            const update: LegUpdate = {};

            // Auto-cura: a perna passa a ter o apito sem ambiguidade e, da
            // próxima vez, é lida na janela certa mesmo para quem não está em
            // Portugal.
            if (apito !== null && !leg.exact) update.startsAtUtc = page.kickoffUtc!;

            const efetivo = apito ?? leg.kickoff;
            const faltam = efetivo - Date.now();
            // A decisão final é tomada com o apito que a Betclic anuncia, não
            // com o que estava gravado: entre a abertura da janela e o corte.
            // Fora disto ficamos pela auto-cura e voltamos na passagem certa.
            if (
                faltam > CAPTURE_CUTOFF_MIN * 60_000 &&
                faltam <= CAPTURE_WINDOW_MIN * 60_000
            ) {
                const odd = page.odds.get(leg.selectionId);
                if (odd === undefined) semSeleccao++;
                if (typeof odd === "number" && odd > 1) {
                    update.closingOdd = odd;
                    update.leadMinutes = leadMinutesFrom(Date.now(), efetivo);
                    // A odd crua leva a margem da casa la dentro e isso
                    // inflaciona o CLV. Quando o mercado completo esta na
                    // pagina e e de confiar, guarda-se tambem a justa.
                    const justa = devig(odd, page.markets.get(leg.selectionId));
                    if (justa) {
                        update.closingOddNoVig = justa.odd;
                        update.closingOddMargin = justa.marginPct;
                        comMercado++;
                    }
                }
            }

            if (Object.keys(update).length === 0) continue;
            const atual = porAposta.get(leg.betId);
            if (atual) atual.set(leg.index, update);
            else porAposta.set(leg.betId, new Map([[leg.index, update]]));
        }
    }

    // Sonda de saude, ligada por ambiente (CLV_PROBE_MATCH_ID).
    //
    // Sem ela so se descobre que a leitura esta partida quando ha uma aposta
    // mesmo a precisar dela - ou seja, tarde de mais. Com um id de jogo posto
    // na variavel, cada passagem diz nos logs se consegue ou nao ler aquela
    // pagina, sem depender de haver apostas nenhumas. Desliga-se tirando a
    // variavel; nao faz escritas.
    const sonda = process.env.CLV_PROBE_MATCH_ID;
    if (sonda) {
        const r = await fetchMatch(sonda, "sonda");
        console.info(
            `[clv][sonda] jogo ${sonda}: ${r.page
                ? `OK ${r.page.odds.size} precos, ${r.page.markets.size} com mercado, apito ${r.page.kickoffUtc}, ${r.kb}KB`
                : `FALHOU -> ${r.porque}`}`,
        );
    }

    let escritas = 0;
    for (const [betId, updates] of porAposta) {
        if (await applyToBet(betId, updates, capturedAt)) escritas++;
    }

    return {
        candidatas: rows.length,
        pernas: legs.length,
        jogos: porJogo.size,
        lidos,
        semPrecos,
        // Quantas pernas ficaram com a margem removida. A diferenca para
        // `pernas` e a cobertura que falta ao de-vig.
        comDeVig: comMercado,
        semSeleccao,
        motivos,
        apostasEscritas: escritas,
        ms: Date.now() - started,
    };
}

// ============================================================
// GET /api/clv/capture
//
// Fica ACIMA de qualquer authenticateToken de propósito: não há utilizador nem
// subscrição neste pedido, é o agendador a falar. Mesma guarda do cron das
// insights (routes/insightsRoutes.ts) - fail closed, sem segredo ninguém entra.
//
// Quem chama é o pg_cron do Supabase, de 5 em 5 minutos (ver db/cron/
// clv-capture.sql). O plano Hobby da Vercel só permite um cron por dia, e o
// agendamento dentro da base de dados evita ter de mudar de plano.
// ============================================================
router.get("/capture", async (req, res) => {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
        res.status(401).json({ error: "Não autorizado." });
        return;
    }

    try {
        const resumo = await runCapture();
        if (resumo.semPrecos > 0) {
            console.warn(
                `[clv] ${resumo.semPrecos} de ${resumo.lidos} jogo(s) sem leitura -> ${resumo.motivos.join(" | ")}`,
            );
        }
        console.info("[clv] passagem:", JSON.stringify(resumo));
        res.json({ ok: true, ...resumo });
    } catch (error: any) {
        console.error("[clv] passagem falhou:", error);
        res.status(503).json({ ok: false, error: error?.message || "Falhou." });
    }
});

export default router;
