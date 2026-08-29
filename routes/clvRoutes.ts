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
    leadMinutesFrom,
    marketFrom,
    readMatchPage,
    type MatchPage,
} from "../lib/betclicOdds.js";
import {
    CAPTURE_CUTOFF_MIN,
    CAPTURE_WINDOW_MIN,
    asArray,
    legsToRead,
    type Leg,
} from "../lib/clvCapture.js";
import type { BetRow } from "../lib/clvCapture.js";

// Tetos por passagem: não martelar a Betclic e não estourar o maxDuration=60
// da função da Vercel. Uma página estabiliza em ~0.8s.
const MAX_MATCHES_PER_RUN = 25;
const TIME_BUDGET_MS = 40_000;
const FETCH_TIMEOUT_MS = 8_000;

const UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

const router = Router();

// A decisao de QUE pernas ler vive no modulo partilhado, para o servidor e o
// agente residencial nunca poderem discordar sobre a janela.
export {
    CAPTURE_WINDOW_MIN,
    CAPTURE_CUTOFF_MIN,
    legsToRead,
    asArray,
} from "../lib/clvCapture.js";

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

/**
 * Que jogos ha a ler agora, e que pernas dependem de cada um.
 *
 * Separado do resto porque ha dois leitores possiveis: a propria funcao, e o
 * agente que corre numa ligacao residencial (a Betclic responde 403 a qualquer
 * datacenter - medido em AWS us-east, AWS eu-central e Azure). Quem le muda; a
 * decisao de o que ler nao.
 */
async function trabalho(now: number) {
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

    return { candidatas: rows.length, legs, jogos };
}

/** Uma leitura de uma pagina, venha ela de onde vier. */
export interface Leitura {
    matchId: string;
    /** id da seleccao -> preco. */
    odds: Record<string, number>;
    /** Mercados completos, para o de-vig. O servidor RE-VALIDA a margem. */
    markets?: Array<{ ids: string[]; odds: number[] }>;
    kickoffUtc?: string | null;
}

/**
 * Aplica leituras ja feitas. E aqui que mora tudo o que decide: a janela, o
 * de-vig, a convergencia e a escrita. O agente residencial so traz os precos.
 */
async function aplicar(
    leituras: Map<string, MatchPage>,
    jogos: Array<[string, Leg[]]>,
    now: number,
) {
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
        const page = leituras.get(matchId);
        lidos++;
        if (!page || page.odds.size === 0) {
            semPrecos++;
            motivos.push(`${matchId}:sem-leitura`);
            continue;
        }

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

    let escritas = 0;
    for (const [betId, updates] of porAposta) {
        if (await applyToBet(betId, updates, capturedAt)) escritas++;
    }

    return {
        pernas: jogos.reduce((n, [, g]) => n + g.length, 0),
        jogos: jogos.length,
        lidos,
        semPrecos,
        // Quantas pernas ficaram com a margem removida. A diferenca para
        // `pernas` e a cobertura que falta ao de-vig.
        comDeVig: comMercado,
        semSeleccao,
        motivos,
        apostasEscritas: escritas,
    };
}

// A sonda antiga vivia dentro da passagem; agora e um passo a parte.
// Sonda de saude, ligada por ambiente (CLV_PROBE_MATCH_ID).
//
// Sem ela so se descobre que a leitura esta partida quando ha uma aposta
// mesmo a precisar dela - ou seja, tarde de mais. Com um id de jogo posto
// na variavel, cada passagem diz nos logs se consegue ou nao ler aquela
// pagina, sem depender de haver apostas nenhumas. Desliga-se tirando a
// variavel; nao faz escritas.
async function correrSonda() {
  const sonda = process.env.CLV_PROBE_MATCH_ID;
if (sonda) {
    const r = await fetchMatch(sonda, "sonda");
    console.info(
        `[clv][sonda] jogo ${sonda}: ${r.page
            ? `OK ${r.page.odds.size} precos, ${r.page.markets.size} com mercado, apito ${r.page.kickoffUtc}, ${r.kb}KB`
            : `FALHOU -> ${r.porque}`}`,
    );
}

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
/** Guarda partilhada: fail closed, sem segredo ninguem entra. */
function autorizado(req: any, nomeDaVariavel: string): boolean {
    const secret = process.env[nomeDaVariavel];
    return Boolean(secret) && req.headers.authorization === `Bearer ${secret}`;
}

/**
 * A passagem feita pelo proprio servidor. Continua aqui por duas razoes: e o
 * caminho certo no dia em que a Betclic deixar de recusar datacenters, e e o
 * que o cron do Supabase ja chama. Hoje leva 403 e nao escreve nada - o que
 * escreve e o agente, pelo /submit.
 */
async function runCapture(now = Date.now()) {
    const started = Date.now();
    const { candidatas, jogos } = await trabalho(now);

    const leituras = new Map<string, MatchPage>();
    const falhas: string[] = [];
    for (const [matchId, grupo] of jogos) {
        if (Date.now() - started > TIME_BUDGET_MS) break;
        const r = await fetchMatch(matchId, grupo[0].event);
        if (r.page) leituras.set(matchId, r.page);
        else falhas.push(`${matchId}:${r.porque}`);
    }

    await correrSonda();
    const resumo = await aplicar(leituras, jogos, now);
    return {
        candidatas,
        ...resumo,
        motivos: falhas.length ? falhas : resumo.motivos,
        ms: Date.now() - started,
    };
}

// ============================================================
// O rele residencial
//
// A Betclic responde 403 a qualquer datacenter - medido em AWS us-east, AWS
// eu-central e Azure; a mesma pagina, pelo mesmo caminho e com os mesmos
// cabecalhos, devolve 200 a partir de uma ligacao residencial. Nao se contorna
// isso com proxies nem com impressao digital forjada: muda-se quem faz o
// pedido. O agente corre numa maquina de casa e traz os precos; TODA a decisao
// (janela, de-vig, convergencia, escrita) continua a acontecer aqui.
//
// O agente guarda um segredo proprio (CLV_AGENT_SECRET), separado do cron: vive
// numa maquina mais exposta e deve poder ser rodado sozinho.
// ============================================================

/** GET /api/clv/work -> que jogos ha a ler agora. */
router.get("/work", async (req, res) => {
    if (!autorizado(req, "CLV_AGENT_SECRET")) {
        res.status(401).json({ error: "Nao autorizado." });
        return;
    }
    try {
        const { candidatas, jogos } = await trabalho(Date.now());
        res.json({
            ok: true,
            candidatas,
            jogos: jogos.map(([matchId, grupo]) => ({
                matchId,
                // O caminho vai daqui para o agente nao ter de saber construi-lo:
                // se a rota da Betclic mudar, muda num sitio so.
                path: betclicMatchPath(matchId, grupo[0].event),
            })),
        });
    } catch (error: any) {
        console.error("[clv] /work falhou:", error);
        res.status(503).json({ ok: false, error: error?.message });
    }
});

/** POST /api/clv/submit -> o agente entrega o que leu. */
router.post("/submit", async (req, res) => {
    if (!autorizado(req, "CLV_AGENT_SECRET")) {
        res.status(401).json({ error: "Nao autorizado." });
        return;
    }
    const cru = req.body?.leituras;
    if (!Array.isArray(cru)) {
        res.status(400).json({ error: "leituras tem de ser um array." });
        return;
    }
    try {
        const now = Date.now();
        // O trabalho e recalculado AQUI: o agente nao decide que pernas contam,
        // so traz precos. Entre o /work e o /submit a janela pode ter fechado.
        const { candidatas, jogos } = await trabalho(now);

        const leituras = new Map<string, MatchPage>();
        for (const l of cru) {
            const matchId = String(l?.matchId ?? "");
            if (!matchId) continue;
            const odds = new Map<string, number>();
            for (const [id, valor] of Object.entries(l?.odds ?? {})) {
                const n = Number(valor);
                if (Number.isFinite(n) && n > 1) odds.set(String(id), n);
            }
            // Os mercados sao RE-VALIDADOS com o mesmo crivo: a margem que o
            // agente mandasse nunca entra sem passar pelas regras da casa.
            const markets = new Map<string, ReturnType<typeof marketFrom>>();
            for (const m of Array.isArray(l?.markets) ? l.markets : []) {
                const market = marketFrom(m?.ids, m?.odds);
                if (!market) continue;
                for (const id of m.ids) markets.set(String(id), market);
            }
            leituras.set(matchId, {
                odds,
                markets: markets as MatchPage["markets"],
                kickoffUtc: typeof l?.kickoffUtc === "string" ? l.kickoffUtc : null,
            });
        }

        const resumo = await aplicar(leituras, jogos, now);
        console.info("[clv][agente] entrega:", JSON.stringify(resumo));
        res.json({ ok: true, candidatas, ...resumo });
    } catch (error: any) {
        console.error("[clv] /submit falhou:", error);
        res.status(503).json({ ok: false, error: error?.message });
    }
});

router.get("/capture", async (req, res) => {
    if (!autorizado(req, "CRON_SECRET")) {
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
