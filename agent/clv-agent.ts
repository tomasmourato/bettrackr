// agent/clv-agent.ts
// O agente que apanha a odd de fecho a partir de uma ligação residencial.
//
// PORQUE EXISTE
// A Betclic responde 403 a qualquer pedido vindo de um datacenter. Medido em
// três redes diferentes - AWS us-east, AWS eu-central e Azure - todas
// recusadas; a mesma página, pelo mesmo caminho e com os mesmos cabeçalhos,
// devolve 200 a partir de uma ligação de casa. Não se contorna isso com
// proxies nem com impressão digital forjada: muda-se quem faz o pedido.
//
// O QUE FAZ (e o que NÃO faz)
// Pergunta ao BetTrackr que jogos há a ler, vai buscar essas páginas, e devolve
// os preços. Mais nada. A janela de leitura, a remoção da margem, a regra de
// convergência e a escrita continuam todas do lado do servidor - o agente não
// decide nada e por isso não precisa de ser atualizado quando essas regras
// mudarem.
//
// No fim de cada passagem - corra bem, mal, ou sem nada a ler - conta ao
// BetTrackr como correu (/api/clv/heartbeat). É isso que o painel do bot mostra
// nas passagens do agente de CLV; sem isto o servidor só sabia do agente quando
// havia leituras para entregar.
//
// COMO CORRE
// Um ficheiro só, sem dependências, com o Node que a máquina já tiver:
//   BETTRACKR_AGENT_SECRET=... node clv-agent.js
// Sozinho faz uma passagem e sai - quem o chama de 5 em 5 minutos é o cron da
// máquina. Assim uma passagem encravada nunca impede a seguinte.

import {
    parseNgState,
    readMatchPage,
    readMatchSnapshot,
    type Market,
} from "../lib/betclicOdds.js";

const BASE = process.env.BETTRACKR_BASE || "https://bettrackr.dev";
const SECRET = process.env.BETTRACKR_AGENT_SECRET || "";
const BETCLIC = "https://www.betclic.pt";

// Os mesmos cabeçalhos que o servidor usava. Não são disfarce nenhum - já se
// confirmou que a página responde na mesma sem cabeçalho algum; ficam por
// serem o que um cliente normal envia.
const UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

const TIMEOUT_MS = 20_000;
// Teto por passagem, para não martelar a Betclic mesmo que o servidor peça mais.
const MAX_JOGOS = 25;

interface Trabalho {
    matchId: string;
    path: string;
}

type Tipo = "capture" | "daily";

/**
 * O que se conta ao BetTrackr no fim da passagem. Vai sendo preenchido pelo
 * caminho, para uma passagem que rebente a meio ainda dizer até onde chegou.
 */
interface Relatorio {
    ok: boolean;
    /** Apostas por liquidar que o servidor considerou (só na captura). */
    candidatas: number | null;
    jogos: number;
    leituras: number;
    escritas: number;
    falhas: string[];
    erro?: string;
}

/** O mesmo caminho que o servidor constroi. A Betclic canoniza pelo id. */
function betclicPath(matchId: string, event: string): string {
    const slug =
        String(event || "evento")
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .toLowerCase()
            .replace(/&/g, " e ")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "evento";
    return `/futebol-sfootball/evento-c0/${slug}-m${encodeURIComponent(matchId)}`;
}

function log(...partes: unknown[]) {
    console.log(new Date().toISOString().slice(0, 19), ...partes);
}

async function bettrackr(caminho: string, init: RequestInit = {}) {
    const res = await fetch(`${BASE}${caminho}`, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SECRET}`,
            ...(init.headers ?? {}),
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const corpo = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(
            `${caminho} respondeu ${res.status}${corpo?.error ? `: ${corpo.error}` : ""}`,
        );
    }
    return corpo;
}

/**
 * Lê uma página de jogo e reduz-a ao que interessa.
 *
 * A página tem ~476KB e o bloco de odds ~327KB; o que sai daqui são poucos KB.
 * Podia mandar-se o HTML cru e deixar o servidor parsear - seria um agente que
 * nunca precisava de atualização - mas custava megabytes por passagem a quem
 * estiver ligado por dados móveis.
 */
async function lerJogo(t: Trabalho) {
    const res = await fetch(`${BETCLIC}${t.path}`, {
        headers: { "User-Agent": UA, "Accept-Language": "pt-PT,pt;q=0.9" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { erro: `http-${res.status}` };

    const html = await res.text();
    const page = readMatchPage(html, t.matchId);
    if (page.odds.size === 0) return { erro: `sem-precos(${(html.length / 1024) | 0}KB)` };

    // Os mercados vão como ids + odds, e é o servidor que decide se aquilo é um
    // mercado completo. O agente não manda na margem.
    const vistos = new Set<Market>();
    const markets: Array<{ ids: string[]; odds: number[] }> = [];
    for (const [id, market] of page.markets) {
        if (vistos.has(market)) {
            markets[markets.length - 1]?.ids.push(id);
            continue;
        }
        vistos.add(market);
        markets.push({ ids: [id], odds: market.odds });
    }

    return {
        leitura: {
            matchId: t.matchId,
            odds: Object.fromEntries(page.odds),
            markets,
            kickoffUtc: page.kickoffUtc,
        },
    };
}

async function passagem(rel: Relatorio) {
    const trabalho = await bettrackr("/api/clv/work");
    const jogos: Trabalho[] = (trabalho.jogos ?? []).slice(0, MAX_JOGOS);
    rel.candidatas = Number(trabalho.candidatas) || 0;
    rel.jogos = jogos.length;

    if (jogos.length === 0) {
        // O caso normal: só há trabalho quando alguma perna está entre os 30 e
        // os 5 minutos do apito. Sem jogos não se toca na Betclic.
        log(`nada a ler (${trabalho.candidatas} aposta(s) por liquidar)`);
        return;
    }

    const leituras = [];
    for (const jogo of jogos) {
        try {
            const r = await lerJogo(jogo);
            if (r.leitura) leituras.push(r.leitura);
            else rel.falhas.push(`${jogo.matchId}:${r.erro}`);
        } catch (e: any) {
            rel.falhas.push(`${jogo.matchId}:${e?.name || "erro"}`);
        }
    }
    rel.leituras = leituras.length;

    if (rel.falhas.length) log("falhas:", rel.falhas.join(" | "));
    if (leituras.length === 0) {
        rel.ok = false;
        rel.erro = "nenhuma leitura conseguida - nada enviado";
        log(rel.erro);
        return;
    }

    const r = await bettrackr("/api/clv/submit", {
        method: "POST",
        body: JSON.stringify({ leituras }),
    });
    rel.escritas = Number(r.apostasEscritas) || 0;
    log(
        `enviadas ${leituras.length} leitura(s) -> ` +
            `${r.apostasEscritas} aposta(s) escrita(s), ${r.comDeVig} perna(s) sem margem`,
    );
}

// ============================================================
// Modo diario (--daily): as odds do dia para as dicas de IA
//
// Corre uma vez de madrugada. Descobre os jogos do dia nas listagens publicas,
// le a pagina de cada um e entrega os mercados COMPLETOS ao BetTrackr, que os
// valida e guarda. Depois disto o modelo deixa de inventar precos.
//
// Nao tem nada a ver com a odd de fecho: sao precos de madrugada, muito antes
// do apito. O CLV continua a vir da passagem de 5 em 5 minutos.
// ============================================================

// Listagens de onde os jogos sao descobertos. Facil de estender: acrescenta o
// caminho, que a forma da pagina e a mesma.
const LISTAGENS = ["futebol-sfootball", "tenis-stennis", "basquetebol-sbasketball"];
const MAX_JOGOS_DIA = 40;

// Pausa entre paginas. NAO e cosmetica: 59 paginas seguidas sem pausa
// nenhuma - cerca de um pedido por segundo durante um minuto - foi quanto
// bastou para a Betclic bloquear um IP RESIDENCIAL, com a mesma pagina de
// bloqueio que serve aos datacenters. Correr de madrugada nao da pressa
// nenhuma, por isso vale mais ir devagar e nao ser expulso.
const PAUSA_MS = Number(process.env.CLV_PAUSA_MS) || 4000;

const dorme = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** O dia em Lisboa, que e o dia desportivo que a app mostra. */
function hojeEmLisboa() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Lisbon" });
}

/** Levantado quando a casa nos recusa. Para tudo - nunca se insiste. */
class Recusado extends Error {
    constructor(readonly status: number) {
        super(`http-${status}`);
    }
}

async function paginaBetclic(caminho: string) {
    const res = await fetch(`${BETCLIC}${caminho}`, {
        headers: { "User-Agent": UA, "Accept-Language": "pt-PT,pt;q=0.9" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // Um 403 e a casa a dizer que ja chega. Insistir mais 40 vezes so prolonga
    // o bloqueio; a passagem para e tenta amanha.
    if (res.status === 403 || res.status === 429) throw new Recusado(res.status);
    return res.ok ? await res.text() : null;
}

async function descobrirJogos(dia: string) {
    const jogos = new Map<string, { matchId: string; event: string }>();

    for (const listagem of LISTAGENS) {
        try {
            const html = await paginaBetclic(`/${listagem}`);
            if (!html) {
                log(`listagem ${listagem}: sem resposta util`);
                continue;
            }
            const visita = (n: any, d: number) => {
                if (!n || typeof n !== "object" || d > 14) return;
                if (Array.isArray(n)) return n.forEach((x) => visita(x, d + 1));
                if (n.matchId && typeof n.matchDateUtc === "string") {
                    // So os jogos DE HOJE - a listagem traz os proximos dias.
                    const emLisboa = new Date(n.matchDateUtc).toLocaleDateString("en-CA", {
                        timeZone: "Europe/Lisbon",
                    });
                    if (emLisboa === dia && !jogos.has(String(n.matchId))) {
                        jogos.set(String(n.matchId), {
                            matchId: String(n.matchId),
                            event: String(n.name ?? ""),
                        });
                    }
                }
                for (const k of Object.keys(n)) visita(n[k], d + 1);
            };
            visita(parseNgState(html), 0);
        } catch (e: any) {
            if (e instanceof Recusado) throw e;
            log(`listagem ${listagem} falhou: ${e?.name || e}`);
        }
        await dorme(PAUSA_MS);
    }

    return [...jogos.values()].slice(0, MAX_JOGOS_DIA);
}

async function passagemDiaria(rel: Relatorio) {
    const dia = hojeEmLisboa();
    const encontrados = await descobrirJogos(dia);
    rel.jogos = encontrados.length;
    log(`${dia}: ${encontrados.length} jogo(s) nas listagens`);
    if (encontrados.length === 0) return;

    const jogos = [];
    let semMercado = 0;
    for (const j of encontrados) {
        try {
            const html = await paginaBetclic(betclicPath(j.matchId, j.event));
            const snap = html ? readMatchSnapshot(html, j.matchId) : null;
            // Sem mercado completo nao ha nada de confianca a guardar.
            if (snap) jogos.push(snap);
            else semMercado++;
        } catch (e: any) {
            if (e instanceof Recusado) {
                // Entregar o que ja se leu vale mais do que perder a passagem
                // toda por causa do bloqueio.
                log(`recusado pela casa (${e.message}) ao fim de ${jogos.length} jogo(s) - a parar`);
                rel.falhas.push(`recusado-pela-casa:${e.message}`);
                break;
            }
            semMercado++;
        }
        await dorme(PAUSA_MS);
    }
    rel.leituras = jogos.length;

    if (jogos.length === 0) {
        rel.ok = false;
        rel.erro = "nenhum jogo com mercado completo - nada enviado";
        log(rel.erro);
        return;
    }

    const r = await bettrackr("/api/clv/daily-odds", {
        method: "POST",
        body: JSON.stringify({ dia, jogos }),
    });
    rel.escritas = Number(r.gravados) || 0;
    log(
        `entregues ${jogos.length} jogo(s) (${semMercado} sem mercado util) -> ` +
            `${r.gravados} gravado(s), ${r.recusados} recusado(s)`,
    );
}

/**
 * Conta a passagem ao BetTrackr, que a guarda para o painel do bot. Nunca estraga
 * a passagem: um servidor sem a rota, ou sem a tabela (migracao 026, aplicada a
 * mao), fica so numa linha do log.
 */
async function reportar(tipo: Tipo, inicio: number, rel: Relatorio) {
    try {
        await bettrackr("/api/clv/heartbeat", {
            method: "POST",
            body: JSON.stringify({
                kind: tipo,
                ok: rel.ok,
                startedAt: new Date(inicio).toISOString(),
                durationMs: Date.now() - inicio,
                candidates: rel.candidatas,
                matches: rel.jogos,
                read: rel.leituras,
                written: rel.escritas,
                failures: rel.falhas,
                error: rel.erro,
            }),
        });
    } catch (e: any) {
        log("passagem nao contada ao BetTrackr:", e?.message || e);
    }
}

/** Uma passagem, contada ao BetTrackr corra ela como correr. */
async function correr(tipo: Tipo) {
    if (!SECRET) {
        // Sem segredo nem a passagem se consegue contar: fica so no log do cron.
        log("ERRO: falta BETTRACKR_AGENT_SECRET.");
        process.exitCode = 1;
        return;
    }

    const inicio = Date.now();
    const rel: Relatorio = { ok: true, candidatas: null, jogos: 0, leituras: 0, escritas: 0, falhas: [] };
    try {
        await (tipo === "daily" ? passagemDiaria(rel) : passagem(rel));
    } catch (e: any) {
        rel.ok = false;
        rel.erro = String(e?.message || e);
        log("passagem falhou:", rel.erro);
    }
    if (!rel.ok) process.exitCode = 1;
    await reportar(tipo, inicio, rel);
}

void correr(process.argv.includes("--daily") ? "daily" : "capture");
