// scripts/recon-markets.mjs
// Mede os mercados de uma página de jogo da Betclic: quantas seleções tem cada
// um, que soma de probabilidades dá, e quais é que o crivo do de-vig aceita.
//
// Existe porque não havia NENHUMA página real no repositório. Os números que
// os comentários do lib/betclicOdds.ts citavam - "413 preços", "56 aceites",
// "23 mercados" - tinham sido medidos à mão uma vez e nunca mais se
// conseguiram reproduzir. Sem isto, mexer no crivo da margem é adivinhar.
//
// Uso:
//   node scripts/recon-markets.mjs --list           # os jogos de hoje, com id
//   node scripts/recon-markets.mjs                  # descobre um jogo e lê-o
//   node scripts/recon-markets.mjs <matchId>        # lê um jogo à escolha
//   node scripts/recon-markets.mjs --html <ficheiro> # lê uma página guardada
//   node scripts/recon-markets.mjs ... --fixture <ficheiro.json>
//
// DOIS pedidos, no máximo. A Betclic bloqueou um IP RESIDENCIAL com 59 páginas
// seguidas (ver agent/clv-agent.ts); isto não é um crawler e não deve virar um.

import { readFileSync, writeFileSync } from "node:fs";

const BETCLIC = "https://www.betclic.pt";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const args = process.argv.slice(2);
const opcao = (nome) => {
  const i = args.indexOf(nome);
  return i === -1 ? null : args[i + 1];
};
const listar = args.includes("--list");
const htmlFile = opcao("--html");
const fixtureOut = opcao("--fixture");
const matchIdArg = args.find((a) => /^\d+$/.test(a)) ?? null;

async function pagina(caminho) {
  const res = await fetch(`${BETCLIC}${caminho}`, {
    headers: { "User-Agent": UA, "Accept-Language": "pt-PT,pt;q=0.9" },
    signal: AbortSignal.timeout(20_000),
  });
  if (res.status === 403 || res.status === 429) {
    throw new Error(`a casa recusou (${res.status}) - não insistir`);
  }
  if (!res.ok) throw new Error(`http-${res.status}`);
  return await res.text();
}

// O mesmo extrator do lib/betclicOdds.ts. Duplicado de propósito: este script
// é uma ferramenta de bancada e não deve obrigar a compilar TypeScript.
function parseNgState(html) {
  const marca = 'id="ng-state" type="application/json">';
  const inicio = html.indexOf(marca);
  if (inicio === -1) return null;
  const fim = html.indexOf("</script>", inicio);
  if (fim === -1) return null;
  try {
    return JSON.parse(html.slice(inicio + marca.length, fim));
  } catch {
    return null;
  }
}

/** O nó do jogo, e não a página toda: uma página traz dezenas de outros jogos. */
function noDoJogo(state, matchId) {
  let achado = null;
  const procura = (n, d) => {
    if (achado || !n || typeof n !== "object" || d > 14) return;
    if (Array.isArray(n)) return n.forEach((x) => procura(x, d + 1));
    if (String(n.matchId) === String(matchId) && typeof n.matchDateUtc === "string") {
      achado = n;
      return;
    }
    for (const k of Object.keys(n)) procura(n[k], d + 1);
  };
  procura(state, 0);
  return achado;
}

/** Agrupa os preços pelo betslipMarketId, herdando o nome do mercado de cima. */
function grupos(raiz) {
  const porId = new Map();
  const vistos = new Set();

  const visita = (n, d, nome) => {
    if (!n || typeof n !== "object" || d > 18) return;
    if (Array.isArray(n)) return n.forEach((x) => visita(x, d + 1, nome));

    const nomeAqui = typeof n.name === "string" && n.name ? n.name : nome;
    const odd = Number(n.odds);
    if (n.id != null && n.betslipMarketId != null && Number.isFinite(odd) && odd > 1) {
      const id = String(n.id);
      if (!vistos.has(id)) {
        vistos.add(id);
        const chave = String(n.betslipMarketId);
        const g = porId.get(chave) ?? { marketId: chave, nome: nome ?? "?", odds: [], selecoes: [] };
        g.odds.push(odd);
        g.selecoes.push(typeof n.name === "string" ? n.name : "");
        porId.set(chave, g);
      }
    }
    for (const k of Object.keys(n)) visita(n[k], d + 1, nomeAqui);
  };

  visita(raiz, 0, undefined);
  return [...porId.values()];
}

const soma = (odds) => odds.reduce((s, o) => s + 1 / o, 0);

// O crivo, copiado do lib/betclicOdds.ts (este script é uma ferramenta de
// bancada e não deve obrigar a compilar TypeScript). Se divergirem, é aqui que
// se corrige - a fonte é o lib.
const OVERROUND_MIN = 1.005;
const OVERROUND_TETO = 2;
const MARGEM_MIN_POR_SAIDA = 0.015;
const MARGEM_MAX_POR_SAIDA = 0.15;

const aceite = (g) => {
  const n = g.odds.length;
  const s = soma(g.odds);
  if (n < 2 || s < OVERROUND_MIN || s > OVERROUND_TETO) return false;
  const porSaida = (s - 1) / n;
  return porSaida >= MARGEM_MIN_POR_SAIDA && porSaida <= MARGEM_MAX_POR_SAIDA;
};

/** Os jogos de hoje na listagem de futebol. Um pedido. */
async function listagemDeJogos() {
  const html = await pagina("/futebol-sfootball");
  const jogos = [];
  const visita = (n, d) => {
    if (!n || typeof n !== "object" || d > 14) return;
    if (Array.isArray(n)) return n.forEach((x) => visita(x, d + 1));
    if (n.matchId && typeof n.matchDateUtc === "string") {
      jogos.push({ id: String(n.matchId), nome: String(n.name ?? ""), quando: n.matchDateUtc });
    }
    for (const k of Object.keys(n)) visita(n[k], d + 1);
  };
  visita(parseNgState(html), 0);
  return jogos;
}

async function main() {
  if (listar) {
    for (const j of await listagemDeJogos()) console.log(`${j.id}  ${j.quando}  ${j.nome}`);
    return;
  }

  let html;
  let matchId = matchIdArg;

  if (htmlFile) {
    html = readFileSync(htmlFile, "utf8");
    if (!matchId) {
      const m = html.match(/"matchId":\s*"?(\d+)"?/);
      matchId = m?.[1] ?? null;
    }
  } else {
    if (!matchId) {
      // Pedido 1: a listagem, só para escolher um jogo.
      const ids = await listagemDeJogos();
      if (ids.length === 0) throw new Error("nenhum jogo na listagem");
      matchId = ids[0].id;
      console.log(`jogo escolhido: ${ids[0].nome} (${matchId}) de ${ids.length} na listagem\n`);
    }
    // Pedido 2: a página do jogo.
    const slug = "evento";
    html = await pagina(`/futebol-sfootball/evento-c0/${slug}-m${matchId}`);
  }

  const state = parseNgState(html);
  if (!state) throw new Error("sem ng-state na página");
  const jogo = noDoJogo(state, matchId);
  if (!jogo) throw new Error(`nó do jogo ${matchId} não encontrado`);

  const gs = grupos(jogo).sort((a, b) => a.odds.length - b.odds.length);
  const precos = gs.reduce((s, g) => s + g.odds.length, 0);
  const aceites = gs.filter(aceite);
  const precosAceites = aceites.reduce((s, g) => s + g.odds.length, 0);

  console.log(`página: ${(html.length / 1024) | 0}KB · jogo: ${jogo.name ?? matchId}`);
  console.log(`${precos} preços em ${gs.length} mercados`);
  console.log(`crivo: ${aceites.length} mercados, ${precosAceites} preços\n`);
  console.log("  n    soma    margem   p/saída  entra  mercado");
  for (const g of gs) {
    const s = soma(g.odds);
    const n = g.odds.length;
    const margem = ((s - 1) * 100).toFixed(1) + "%";
    const porSaida = (((s - 1) / n) * 100).toFixed(2) + "%";
    console.log(
      `${String(n).padStart(3)}  ${s.toFixed(3).padStart(7)}  ${margem.padStart(8)}  ${porSaida.padStart(8)}  ${aceite(g) ? " sim " : "  -  "}  ${g.nome}`
    );
  }

  if (fixtureOut) {
    const fixture = {
      medidoEm: new Date().toISOString().slice(0, 10),
      matchId: String(matchId),
      event: jogo.name ?? null,
      precos,
      grupos: gs.map((g) => ({ marketId: g.marketId, nome: g.nome, odds: g.odds })),
    };
    writeFileSync(fixtureOut, JSON.stringify(fixture, null, 2) + "\n");
    console.log(`\nfixture: ${fixtureOut} (${gs.length} mercados, ${precos} preços)`);
  }
}

main().catch((e) => {
  console.error(`recon-markets: ${e.message}`);
  process.exitCode = 1;
});
