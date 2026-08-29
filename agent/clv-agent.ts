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
// COMO CORRE
// Um ficheiro só, sem dependências, com o Node que a máquina já tiver:
//   BETTRACKR_AGENT_SECRET=... node clv-agent.js
// Sozinho faz uma passagem e sai - quem o chama de 5 em 5 minutos é o cron da
// máquina. Assim uma passagem encravada nunca impede a seguinte.

import { readMatchPage, type Market } from "../lib/betclicOdds.js";

const BASE = process.env.BETTRACKR_BASE || "https://betrackr.vercel.app";
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

async function passagem() {
    if (!SECRET) {
        log("ERRO: falta BETTRACKR_AGENT_SECRET.");
        process.exitCode = 1;
        return;
    }

    const trabalho = await bettrackr("/api/clv/work");
    const jogos: Trabalho[] = (trabalho.jogos ?? []).slice(0, MAX_JOGOS);

    if (jogos.length === 0) {
        // O caso normal: só há trabalho quando alguma perna está entre os 30 e
        // os 5 minutos do apito. Sem jogos não se toca na Betclic.
        log(`nada a ler (${trabalho.candidatas} aposta(s) por liquidar)`);
        return;
    }

    const leituras = [];
    const falhas: string[] = [];
    for (const jogo of jogos) {
        try {
            const r = await lerJogo(jogo);
            if (r.leitura) leituras.push(r.leitura);
            else falhas.push(`${jogo.matchId}:${r.erro}`);
        } catch (e: any) {
            falhas.push(`${jogo.matchId}:${e?.name || "erro"}`);
        }
    }

    if (falhas.length) log("falhas:", falhas.join(" | "));
    if (leituras.length === 0) {
        log("nenhuma leitura conseguida - nada enviado");
        process.exitCode = 1;
        return;
    }

    const r = await bettrackr("/api/clv/submit", {
        method: "POST",
        body: JSON.stringify({ leituras }),
    });
    log(
        `enviadas ${leituras.length} leitura(s) -> ` +
            `${r.apostasEscritas} aposta(s) escrita(s), ${r.comDeVig} perna(s) sem margem`,
    );
}

passagem().catch((e) => {
    log("passagem falhou:", e?.message || e);
    process.exitCode = 1;
});
