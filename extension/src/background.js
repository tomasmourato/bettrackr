// Extension service worker. It imports each bookmaker independently, maps
// source-specific payloads, updates changed imports, and sends new records to
// BetTrackr in bounded batches.
import { mapBetclicBets, betclicRef } from "./mapper.js";
import { fetchBetclicHistory } from "./betclic-history.js";
import { mapBetanoBets, betanoHistoryStart, betanoRef } from "./mapper-betano.js";
import { fetchBetanoHistory } from "./betano-history.js";
import { mapSolverdeBets, solverdeRef } from "./mapper-solverde.js";
import { fetchSolverdeHistory } from "./solverde-history.js";
import { runAfterBettrackrVerification } from "./bettrackr-identity.js";
import {
  SNAPSHOT_LEAD_MINUTES,
  acceptSnapshot,
  collectMarkets,
  devig,
  betclicMatchPath,
  collectSelectionOdds,
  legKeyOf,
  parseNgState,
  nextWakeUp,
  pendingLegsFrom,
  readyToWrite,
} from "./closing-odds.js";

const PAGE_SIZE = 20;
const DEFAULT_BETTRACKR_BASE = "https://bettrackr.dev";
const BETTRACKR_APP_URLS = [
  "https://bettrackr.dev/*",
  "https://www.bettrackr.dev/*",
  // Dominios *.vercel.app anteriores ao dominio proprio. Ficam aqui ate
  // deixarem de servir a app: enquanto so redirecionarem, o separador acaba
  // no dominio novo (que ja esta na lista), mas uma extensao antiga que ainda
  // nao tenha sido recarregada continua a precisar deles para a ponte.
  "https://betrackr.vercel.app/*",
  "https://gestordebets.vercel.app/*",
  "http://localhost/*",
  "http://127.0.0.1/*",
];

// Recarregar/atualizar a extensão mata os content scripts das tabs já abertas
// e o Chrome NÃO os reinjeta - a app deixava de detetar a extensão (PING sem
// resposta) até o utilizador recarregar a página à mão. Numa reinstalação o
// chrome.storage também vem vazio (token BetTrackr perdido). Reinjetar a ponte
// nas tabs abertas da app repõe a deteção e ressincroniza o token de imediato.
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const tabs = await chrome.tabs.query({ url: BETTRACKR_APP_URLS });
    for (const tab of tabs) {
      if (tab.id === undefined) continue;
      chrome.scripting
        .executeScript({ target: { tabId: tab.id }, files: ["src/content-bettrackr.js"] })
        .catch(() => {}); // tab protegida/descarregada - o reload manual continua a funcionar
    }
  } catch (_) {}
});

const pendingBetanoRequests = new Map();
const betanoTokenWaiters = new Set();
let betanoSessionTokens = null;
let requestSequence = 0;

function progress(text) {
  chrome.runtime.sendMessage({ type: "PROGRESS", text }).catch(() => {});
}

async function getConfig() {
  const stored = await chrome.storage.local.get([
    "betclicToken", "betclicApiBase", "bettrackrToken", "bettrackrBase", "bettrackrUserId",
  ]);
  return {
    betclicToken: stored.betclicToken || null,
    betclicApiBase: stored.betclicApiBase || "https://betting.begmedia.pt",
    bettrackrToken: stored.bettrackrToken || null,
    bettrackrBase: stored.bettrackrBase || DEFAULT_BETTRACKR_BASE,
    bettrackrUserId: stored.bettrackrUserId || null,
  };
}

function validSessionSnapshot(value) {
  if (!value || typeof value !== "object") return null;
  const token = typeof value.token === "string" ? value.token.trim() : "";
  const baseUrl = typeof value.baseUrl === "string" ? value.baseUrl.trim().replace(/\/+$/, "") : "";
  const expectedUserId = typeof value.expectedUserId === "string" ? value.expectedUserId.trim() : "";
  if (!token || !baseUrl) return null;
  return { token, baseUrl, expectedUserId };
}

async function sessionFromOpenBettrackrTab() {
  const tabs = await chrome.tabs.query({ url: BETTRACKR_APP_URLS });
  const ordered = [...tabs].sort((a, b) => Number(Boolean(b.active)) - Number(Boolean(a.active)));
  for (const tab of ordered) {
    if (tab.id === undefined) continue;
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: "GET_BETTRACKR_SESSION" });
      const session = validSessionSnapshot(response?.session);
      if (session) return session;
    } catch (_) {}
  }
  return null;
}

/**
 * Troca o token do site por um token de extensão. Falha fechada: sem ele a
 * extensão ficaria com uma sessão que o servidor não sabe distinguir da web,
 * e a importação paga passava a grátis. Um erro aqui é para o utilizador
 * tentar de novo, não para lhe abrir a porta de trás.
 */
async function exchangeForExtensionToken(baseUrl, token) {
  let res;
  try {
    res = await fetch(`${baseUrl}/api/auth/extension-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
  } catch (_) {
    throw new Error("Não foi possível falar com o BetTrackr para preparar a sessão. Tenta novamente.");
  }
  if (!res.ok) {
    throw new Error("Não foi possível preparar a sessão da extensão. Recarrega a app e tenta novamente.");
  }
  const data = await res.json().catch(() => null);
  if (!data?.token) {
    throw new Error("Não foi possível preparar a sessão da extensão. Recarrega a app e tenta novamente.");
  }
  return data.token;
}

/**
 * Guarda a sessao do BetTrackr, sempre trocada por um token de extensao.
 *
 * E o unico sitio onde uma sessao captada da app entra no storage. O content
 * script deixou de la escrever: fazia-o com o token cru do site, que o
 * servidor nao distingue de um pedido da web, e assim a importacao paga
 * passava sem subscricao sempre que nao houvesse um separador da app aberto.
 */
async function storeBettrackrSession(session) {
  if (!session || !session.token) {
    await chrome.storage.local.remove(["bettrackrToken", "bettrackrUserId"]);
    return null;
  }
  const token = await exchangeForExtensionToken(session.baseUrl, session.token);
  await chrome.storage.local.set({
    bettrackrToken: token,
    bettrackrBase: session.baseUrl,
    bettrackrUserId: session.expectedUserId || null,
  });
  return token;
}

async function configForImport(sessionSnapshot) {
  const suppliedSnapshot = sessionSnapshot !== undefined && sessionSnapshot !== null;
  const session = validSessionSnapshot(sessionSnapshot) || await sessionFromOpenBettrackrTab();

  if (suppliedSnapshot && !session) {
    throw new Error("A sessão enviada pela app é inválida. Recarrega a página e tenta novamente.");
  }
  if (session) {
    if (!session.expectedUserId) {
      throw new Error("Não foi possível identificar o utilizador atual. Termina sessão e volta a entrar na app.");
    }
    await storeBettrackrSession(session);
  }

  return getConfig();
}

// O /ended do Betclic limita o histórico a ~3 meses do lado do servidor e
// ignora qualquer filtro de datas (confirmado: startDate/endDate ISO e
// dateFrom/dateTo epoch-ms não têm efeito). Não há forma de ir mais atrás por
// este endpoint, por isso ficamos pela paginação simples por offset.
async function fetchBetclicBets(kind, cfg) {
  return fetchBetclicHistory(async ({ offset, limit }) => {
    const url = `${cfg.betclicApiBase}/api/v2/me/bets/${kind}` +
      `?cache-burst=${Date.now()}&limit=${limit}&offset=${offset}&embed=Metagame`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${cfg.betclicToken}`,
        Accept: "application/json",
        "X-Bg-Universe": "Sports",
        "X-Bg-Language": "pt",
      },
    });
    if (res.status === 401 || res.status === 403) {
      throw new Error("Sessão Betclic expirada. Abre betclic.pt e recarrega as tuas apostas.");
    }
    if (!res.ok) throw new Error(`Betclic respondeu ${res.status} ao obter apostas (${kind}).`);
    const totalHeader = res.headers.get("X-Total-Count");
    const data = await res.json().catch(() => ({}));
    const bets = Array.isArray(data.bets) ? data.bets : [];
    return { bets, total: totalHeader === null ? undefined : Number(totalHeader) };
  }, {
    pageSize: PAGE_SIZE,
    onPage: ({ count, total }) => {
      progress(`A ler apostas do Betclic (${kind}): ${count}${Number.isFinite(total) ? "/" + total : ""}...`);
    },
  });
}

async function findBetanoTab() {
  const tabs = await chrome.tabs.query({ url: ["https://www.betano.pt/*", "https://betano.pt/*"] });
  const mainTabs = tabs.filter((tab) => {
    try { return !new URL(tab.url || "").pathname.startsWith("/myaccount/bethistory"); } catch (_) { return true; }
  });
  return mainTabs.find((tab) => tab.active) || mainTabs[0] || tabs.find((tab) => tab.active) || tabs[0] || null;
}

function isBetanoHistoryTab(tab) {
  try { return new URL(tab.url || "").pathname.startsWith("/myaccount/bethistory"); } catch (_) { return false; }
}

function isBetanoSettledTab(tab) {
  try { return new URL(tab.url || "").pathname === "/myaccount/bethistory/settled"; } catch (_) { return false; }
}

function settledHistoryUrl(origin) {
  const end = Date.now();
  const startDate = betanoHistoryStart();
  return `${origin}/myaccount/bethistory/settled?dateFrom=${startDate.getTime()}&dateTo=${end}`;
}

function waitForTabComplete(tabId, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    let timer;
    const finish = (error) => {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      clearTimeout(timer);
      if (error) reject(error); else resolve();
    };
    const onUpdated = (updatedTabId, changeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === "complete") finish();
    };
    chrome.tabs.onUpdated.addListener(onUpdated);
    timer = setTimeout(() => finish(new Error("A página do histórico do Betano não terminou de carregar.")), timeoutMs);
    chrome.tabs.get(tabId).then((tab) => {
      if (tab.status === "complete") finish();
    }).catch(finish);
  });
}

function waitForBetanoTokens(timeoutMs = 15000) {
  if (betanoSessionTokens) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const waiter = { resolve, reject, timer: null };
    waiter.timer = setTimeout(() => {
      betanoTokenWaiters.delete(waiter);
      reject(new Error("Sessão Betano ainda não foi capturada. Mantém a página principal aberta e recarrega-a uma vez."));
    }, timeoutMs);
    betanoTokenWaiters.add(waiter);
  });
}

async function ensureBetanoHistoryTab(opts = {}) {
  const tabs = await chrome.tabs.query({ url: ["https://www.betano.pt/*", "https://betano.pt/*"] });
  const existingSettled = tabs.find(isBetanoSettledTab);
  if (existingSettled && existingSettled.id !== undefined) {
    await waitForTabComplete(existingSettled.id).catch(() => {});
    return { tab: existingSettled, created: false };
  }

  // Auto-import: nunca sequestrar o separador do utilizador. Sem um separador
  // de histórico já aberto, salta silenciosamente (fica para o próximo gatilho).
  if (opts.auto) return null;

  const source = tabs.find(isBetanoHistoryTab) || await findBetanoTab();
  if (!source || source.id === undefined) throw new Error("Abre a página principal do Betano numa tab aberta.");
  const restoreUrl = source.url || null;
  const origin = (() => {
    try { return new URL(source.url || "https://www.betano.pt").origin; } catch (_) { return "https://www.betano.pt"; }
  })();
  // Keep the same tab so Betano's tab-scoped sessionStorage/auth state is
  // preserved. The settled view initializes the API context required by the
  // settled-history endpoint; open bets are still fetched separately below.
  const historyTab = await chrome.tabs.update(source.id, {
    url: settledHistoryUrl(origin),
  });
  if (!historyTab || historyTab.id === undefined) throw new Error("Não foi possível abrir o histórico do Betano.");
  await waitForTabComplete(historyTab.id);
  return { tab: historyTab, restoreUrl, created: true };
}

function betanoRequestId() {
  requestSequence = (requestSequence + 1) % 1000000000;
  return `betano-${Date.now()}-${requestSequence}`;
}

function requestBetanoPage(tabId, params) {
  const requestId = betanoRequestId();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingBetanoRequests.delete(requestId);
      reject(new Error("O separador do Betano não respondeu a tempo."));
    }, 30000);
    pendingBetanoRequests.set(requestId, {
      resolve: (value) => { clearTimeout(timer); resolve(value); },
      reject: (error) => { clearTimeout(timer); reject(error); },
    });
    chrome.tabs.sendMessage(tabId, {
      type: "BETANO_FETCH_PAGE",
      requestId,
      params,
      tokens: betanoSessionTokens,
    })
      .catch((error) => {
        pendingBetanoRequests.delete(requestId);
        clearTimeout(timer);
        reject(new Error("Abre ou recarrega a página principal do Betano antes de importar."));
      });
  });
}

async function fetchBetanoBets(tabId) {
  return fetchBetanoHistory(async (url) => {
    const parsed = new URL(url);
    const params = {};
    parsed.searchParams.forEach((value, key) => { params[key] = value; });
    const response = await requestBetanoPage(tabId, params);
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Sessão Betano expirada. Abre o histórico do Betano e inicia sessão novamente.");
      }
      throw new Error(`Betano respondeu ${response.status || "sem resposta"} ao obter apostas.`);
    }
    return response.payload;
  }, {
    onProgress(info) {
      const source = info.kind === "open" ? "abertas" : `histórico ${info.window}/${info.windows}`;
      progress(`A ler apostas do Betano (${source}): ${info.total}...`);
    },
  });
}

async function fetchBetclicBetsForImport(cfg) {
  const [ended, ongoing] = await Promise.all([
    fetchBetclicBets("ended", cfg),
    fetchBetclicBets("ongoing", cfg),
  ]);
  const byRef = new Map();
  for (const bet of ongoing) byRef.set(betclicRef(bet), bet);
  for (const bet of ended) byRef.set(betclicRef(bet), bet);
  byRef.delete(null);
  return mapBetclicBets([...byRef.values()]);
}

async function fetchExistingBets(cfg) {
  const res = await fetch(`${cfg.bettrackrBase}/api/bets`, {
    headers: { Authorization: `Bearer ${cfg.bettrackrToken}` },
  });
  if (res.status === 401) throw new Error("Sessão BetTrackr expirada. Inicia sessão novamente.");
  if (!res.ok) throw new Error(`BetTrackr respondeu ${res.status} ao listar apostas.`);
  const data = await res.json().catch(() => ({}));
  const existing = new Map();
  for (const bet of data.bets || []) {
    const metadata = typeof bet.metadata === "string"
      ? (() => { try { return JSON.parse(bet.metadata); } catch (_) { return {}; } })()
      : (bet.metadata || {});
    let key = metadata.importKey;
    if (!key && metadata.source && metadata.ref) key = `${metadata.source}:${metadata.ref}`;
    // Before source-aware keys existed, all extension imports were Betclic.
    if (!key && metadata.ref) key = `betclic:${metadata.ref}`;
    if (key) existing.set(String(key), { ...bet, metadata });
  }
  return existing;
}


// ============================================================
// Odd de fecho (CLV) - a extensão apanha a linha sozinha.
//
// O problema: a odd de fecho é a última antes do apito e ninguém a escreve à
// mão para centenas de apostas. A extensão já tem sessão na Betclic; só lhe
// faltava acordar. É o que os alarmes fazem.
//
// Duas passagens:
//   1. Oportunista - sempre que a extensão corre por outro motivo, tira uma
//      fotografia do preço das pernas com jogo nas próximas 48h. É a rede
//      para quando o Chrome estiver fechado à hora do apito.
//   2. Ao alarme - dois minutos antes do apito mais próximo, para apanhar a
//      linha o mais tarde possível.
//
// Só se lê ANTES do apito (ver closing-odds.js): depois disso o mercado está
// suspenso e o preço que viesse seria lixo com ar de dado.
// ============================================================
const CLOSING_ALARM = "bettrackr-closing-odds";
const SNAPSHOT_STORE = "closingOddSnapshots";
// Teto por passagem, para não martelar a Betclic nem gastar bateria. O que
// custa é a página do jogo (centenas de KB), por isso o teto que interessa é
// o de JOGOS - está em MAX_MATCHES_PER_PASS, junto à leitura.
const MAX_LEGS_PER_PASS = 60;

async function closingOddsEnabled() {
  const stored = await chrome.storage.local.get(["captureClosingOdds"]);
  return stored.captureClosingOdds === true;
}

async function getSnapshots() {
  const stored = await chrome.storage.local.get([SNAPSHOT_STORE]);
  return stored[SNAPSHOT_STORE] && typeof stored[SNAPSHOT_STORE] === "object"
    ? stored[SNAPSHOT_STORE]
    : {};
}

/**
 * O preço corrente de cada perna. Devolve um Map de legKey -> odd.
 *
 * A página de um jogo da Betclic traz o estado todo embebido no HTML, num
 * <script id="ng-state"> - o transfer state do Angular, já com as respostas
 * gRPC descodificadas. As odds estão lá em JSON, indexadas pelo MESMO id de
 * seleção que a API de apostas devolve.
 *
 * Por isso não é preciso gRPC (o endpoint real é binário), nem abrir um
 * separador, nem raspar o DOM - os botões de odd da página não têm id nenhum e
 * obrigariam a casar por texto do mercado. É um GET a uma página pública.
 *
 * A rota inclui o slug do evento porque a Betclic deixou de servir o estado
 * do jogo no atalho /m<matchId>. O id no fim continua a ser a referência
 * canónica para encontrar a seleção.
 */
const MAX_MATCHES_PER_PASS = 8;

async function readMatchOdds(matchId, event) {
  // credentials: "omit" de propósito - a página é pública e não há razão para
  // lhe mandar a sessão do utilizador.
  const res = await fetch(`https://www.betclic.pt${betclicMatchPath(matchId, event)}`, {
    credentials: "omit",
  });
  if (!res.ok) return null;
  const state = parseNgState(await res.text());
  if (!state) return null;
  // Alem dos precos vem o MERCADO completo de cada seleccao, que e o que
  // permite tirar a margem da casa. Sem isto a extensao guardava a odd crua e o
  // CLV saia inflacionado - a margem de um 1X2 portugues anda pelos 9%.
  return { odds: collectSelectionOdds(state), markets: collectMarkets(state) };
}

async function readCurrentOdds(legs) {
  const out = new Map();

  // Agrupar por jogo: uma múltipla com duas pernas do mesmo jogo, ou dois
  // boletins no mesmo jogo, são um pedido só. Cada página são centenas de KB.
  const porJogo = new Map();
  for (const leg of legs) {
    if (!leg.matchId || !leg.selectionId) continue;
    if (!porJogo.has(leg.matchId)) porJogo.set(leg.matchId, []);
    porJogo.get(leg.matchId).push(leg);
  }

  let lidos = 0;
  for (const [matchId, grupo] of porJogo) {
    if (lidos >= MAX_MATCHES_PER_PASS) break;
    lidos++;
    let precos = null;
    try {
      precos = await readMatchOdds(matchId, grupo[0].event);
    } catch (_) {
      // Um jogo que falhe não pode travar os outros.
      continue;
    }
    if (!precos) continue;
    for (const leg of grupo) {
      const odd = precos.odds.get(String(leg.selectionId));
      if (typeof odd === "number" && odd > 1) {
        // A justa so existe quando o mercado completo esta na pagina e passa o
        // crivo. Quando nao passa, fica so a crua - nunca se inventa.
        const justa = devig(odd, precos.markets.get(String(leg.selectionId)));
        out.set(legKeyOf(leg.importKey, leg.index), {
          odd,
          ...(justa ? { noVig: justa.odd, margin: justa.marginPct } : {}),
        });
      }
    }
  }

  return out;
}

/**
 * Uma passagem: lê os preços das pernas que interessam, guarda as leituras que
 * passam as regras, e escreve no BetTrackr os boletins que ficaram completos.
 */
async function runClosingOddsPass(cfg, bets) {
  const now = Date.now();
  const legs = pendingLegsFrom(bets, now).slice(0, MAX_LEGS_PER_PASS);

  const snapshots = await getSnapshots();
  let guardadas = 0;

  if (legs.length > 0) {
    const precos = await readCurrentOdds(legs);
    const at = new Date().toISOString();
    for (const leg of legs) {
      const lido = precos.get(legKeyOf(leg.importKey, leg.index));
      if (lido === undefined) continue;
      const key = legKeyOf(leg.importKey, leg.index);
      const candidate = { odd: lido.odd, at, ...(lido.noVig ? { noVig: lido.noVig, margin: lido.margin } : {}) };
      if (!acceptSnapshot(snapshots[key], candidate, leg.startsAt)) continue;
      snapshots[key] = candidate;
      guardadas++;
    }
  }

  // Escrever o que já está completo, e limpar as leituras que deixaram de
  // fazer falta - senão o chrome.storage crescia para sempre.
  let escritas = 0;
  const usadas = new Set();
  for (const bet of bets) {
    const body = readyToWrite(bet, snapshots, now);
    if (!body) continue;
    const ok = await writeClosingOdd(cfg, bet, body);
    if (!ok) continue;
    escritas++;
    for (const leg of body.legs) {
      usadas.add(legKeyOf(bet.importKey || bet.metadata?.importKey, leg.index));
    }
  }
  for (const key of usadas) delete snapshots[key];

  await chrome.storage.local.set({ [SNAPSHOT_STORE]: snapshots });
  await scheduleClosingOddsAlarm(bets, now);

  return { pernas: legs.length, guardadas, escritas };
}

/** Escreve a odd de fecho de um boletim. Devolve true se ficou gravada. */
async function writeClosingOdd(cfg, bet, body) {
  const id = bet.bettrackrId;
  if (!id) return false;
  try {
    const res = await fetch(`${cfg.bettrackrBase}/api/bets/${id}/closing-odd`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.bettrackrToken}`,
      },
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      // Sessão morta: parar em vez de repetir em ciclo.
      await chrome.alarms.clear(CLOSING_ALARM);
      return false;
    }
    return res.ok;
  } catch (_) {
    return false;
  }
}

/** Um alarme de cada vez, para o apito mais próximo menos a antecedência. */
async function scheduleClosingOddsAlarm(bets, now = Date.now()) {
  await chrome.alarms.clear(CLOSING_ALARM);
  const when = nextWakeUp(pendingLegsFrom(bets, now), now);
  if (when === null) return;
  // O mínimo do MV3 é um minuto; abaixo disso o alarme não dispara.
  await chrome.alarms.create(CLOSING_ALARM, { when: Math.max(when, now + 60 * 1000) });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== CLOSING_ALARM) return;
  if (!(await closingOddsEnabled())) return;
  try {
    const cfg = await getConfig();
    if (!cfg.betclicToken || !cfg.bettrackrToken) return;
    const bets = await fetchBetsForClosingOdds(cfg);
    const r = await runClosingOddsPass(cfg, bets);
    console.info(
      `[BetTrackr][fecho] alarme: ${r.pernas} perna(s), ${r.guardadas} leitura(s), ${r.escritas} escrita(s).`,
    );
  } catch (error) {
    console.info("[BetTrackr][fecho] alarme falhou:", error && error.message);
  }
});

/**
 * As apostas do BetTrackr no formato de que a captura precisa: com o id da
 * app (para o PATCH), a chave de importação (para as fotografias) e as
 * seleções já com startsAt e sourceRef.
 */
async function fetchBetsForClosingOdds(cfg) {
  const existing = await fetchExistingBets(cfg);
  const out = [];
  for (const [importKey, bet] of existing) {
    let selections = bet.selections;
    if (typeof selections === "string") {
      try {
        selections = JSON.parse(selections);
      } catch (_) {
        selections = [];
      }
    }
    out.push({
      bettrackrId: bet.id,
      importKey,
      status: bet.status,
      isIgnored: bet.is_ignored === true,
      selections: Array.isArray(selections) ? selections : [],
    });
  }
  return out;
}

function importKey(bet) {
  if (bet && bet.metadata && bet.metadata.importKey) return String(bet.metadata.importKey);
  if (bet && bet.metadata && bet.metadata.source && bet.metadata.ref) {
    return `${bet.metadata.source}:${bet.metadata.ref}`;
  }
  return null;
}

function selectionsSignature(selections) {
  let value = selections;
  if (typeof value === "string") {
    try { value = JSON.parse(value); } catch (_) { value = []; }
  }
  return JSON.stringify((Array.isArray(value) ? value : []).map((selection) => ({
    event: selection.event || "",
    market: selection.market || "",
    choice: selection.choice || "",
    odd: Number(selection.odd) || 0,
    result: selection.result || null,
  })));
}

function needsUpdate(existing, incoming, accountId) {
  // Cashouts são sempre reenviados. Versões antigas do mapper guardavam
  // FullCashout como POR_LIQUIDAR; forçar o PUT garante a correção mesmo que
  // a comparação local esteja a olhar para dados normalizados/stale.
  // Uma conta escolhida também "preenche" apostas antigas ainda sem conta.
  return (Boolean(accountId) && !existing.account_id) ||
    incoming?.metadata?.isCashout === true ||
    existing.status !== incoming.status ||
    Number(existing.stake) !== Number(incoming.stake) ||
    Number(existing.odd) !== Number(incoming.odd) ||
    Number(existing.final_return) !== Number(incoming.finalReturn) ||
    Number(existing.net_profit) !== Number(incoming.netProfit) ||
    Boolean(existing.is_freebet) !== Boolean(incoming.isFreebet) ||
    Boolean(existing.is_risk_free) !== Boolean(incoming.isRiskFree) ||
    String(existing.freebet_type || "") !== String(incoming.freebetType || "") ||
    selectionsSignature(existing.selections) !== selectionsSignature(incoming.selections);
}

// NAO acrescentes `closingOdd` aqui. A casa de apostas nao sabe o que e uma
// odd de fecho: quem a le e a propria extensao, minutos antes do apito, e quem
// a guarda e o PATCH /closing-odd. O servidor distingue os dois escritores
// exatamente por esta chave - um corpo sem ela nao mexe nas odds de fecho ja
// gravadas, e e assim que reimportar uma aposta liquidada deixou de apagar o
// CLV. Mandar `closingOdd: null` daqui punha o servidor a limpar tudo.
function betPayload(bet, accountId) {
  return {
    type: bet.type,
    status: bet.status,
    stake: bet.stake,
    odd: bet.odd,
    isFreebet: bet.isFreebet,
    isRiskFree: bet.isRiskFree,
    freebetType: bet.freebetType,
    potentialReturn: bet.potentialReturn,
    finalReturn: bet.finalReturn,
    netProfit: bet.netProfit,
    bookmaker: bet.bookmaker,
    accountId: accountId || null,
    dateTime: bet.dateTime,
    notes: bet.notes,
    origin: bet.origin,
    selections: bet.selections,
    comment: bet.comment,
    tags: bet.tags,
    metadata: bet.metadata,
  };
}

async function postBulk(bets, cfg, accountId) {
  const res = await fetch(`${cfg.bettrackrBase}/api/bets/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.bettrackrToken}` },
    body: JSON.stringify({ bets: bets.map((bet) => betPayload(bet, accountId)) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `BetTrackr respondeu ${res.status} ao importar.`);
  return Array.isArray(data.bets) ? data.bets.length : bets.length;
}

async function updateBet(existing, incoming, cfg, accountId) {
  // Uma aposta já associada a uma conta mantém-na; só as "sem conta" herdam
  // a conta escolhida para esta importação.
  const res = await fetch(`${cfg.bettrackrBase}/api/bets/${encodeURIComponent(existing.id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.bettrackrToken}` },
    body: JSON.stringify(betPayload(incoming, existing.account_id || accountId)),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `BetTrackr respondeu ${res.status} ao atualizar.`);
}

async function persistMapped(mapped, unsupported, source, cfg, accountId) {
  // Modo "só atualizar": sincroniza as apostas já registadas no BetTrackr e
  // ignora as que a casa tem mas a app não - útil para quem regista as apostas
  // à mão (ou selecionou o que quis importar) e só quer os estados/valores
  // atualizados sem o histórico completo da casa a entrar.
  const stored = await chrome.storage.local.get("updateOnlyImport");
  const updateOnly = stored.updateOnlyImport === true;
  const existing = await fetchExistingBets(cfg);
  const fresh = [];
  const updates = [];
  let skipped = 0;
  let ignoredNew = 0;
  for (const bet of mapped) {
    const key = importKey(bet);
    const old = key && existing.get(key);
    if (!old) {
      if (updateOnly) ignoredNew++;
      else fresh.push(bet);
    }
    else if (needsUpdate(old, bet, accountId)) updates.push({ old, bet });
    else skipped++;
  }

  let imported = 0;
  const chunkSize = 500;
  for (let i = 0; i < fresh.length; i += chunkSize) {
    imported += await postBulk(fresh.slice(i, i + chunkSize), cfg, accountId);
    progress(`A importar ${source}: ${Math.min(i + chunkSize, fresh.length)}/${fresh.length}...`);
  }
  let updated = 0;
  for (const pair of updates) {
    await updateBet(pair.old, pair.bet, cfg, accountId);
    updated++;
    progress(`A atualizar ${source}: ${updated}/${updates.length}...`);
  }
  const cashouts = mapped.filter((bet) => bet?.metadata?.isCashout === true).length;
  return { fetched: mapped.length, imported, updated, skipped, unsupported, cashouts, ignoredNew };
}

async function runBetclicImport(cfg, accountId) {
  if (!cfg.betclicToken) throw new Error("Sessão Betclic não detetada.");
  progress("A obter apostas do Betclic...");
  const mapped = await fetchBetclicBetsForImport(cfg);
  return persistMapped(mapped, 0, "Betclic", cfg, accountId);
}

// ============================================================
// Solverde - ao contrário da Betclic/Betano, a API não usa um token de header;
// a sessão é um cookie entre subdomínios (www.solverde.pt /
// sportswidget.solverde.pt). Com host_permissions para ambos, o fetch do
// service worker é feito com os cookies do utilizador anexados
// automaticamente - não precisa de nenhuma bridge na página.
// ============================================================
const SOLVERDE_BETS_URL = "https://sportswidget.solverde.pt/bets";

async function solverdeRequestPage({ from, to, page, itemsPerPage }) {
  const res = await fetch(SOLVERDE_BETS_URL, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "*/*" },
    body: JSON.stringify({
      filterCriteria: { from, to },
      oddsFormat: "decimal",
      pagination: { itemsPerPage, page },
    }),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error("Sessão Solverde não detetada. Inicia sessão em solverde.pt e tenta novamente.");
  }
  if (!res.ok) throw new Error(`Solverde respondeu ${res.status} ao obter apostas.`);
  const data = await res.json().catch(() => null);
  if (!data || data.status !== "SUCCESS") {
    throw new Error("Solverde não devolveu uma resposta válida. Inicia sessão em solverde.pt e tenta novamente.");
  }
  return data.data;
}

async function fetchSolverdeBets() {
  return fetchSolverdeHistory(solverdeRequestPage, {
    onPage: ({ count, window, page }) => {
      progress(`A ler apostas da Solverde (janela ${window}, página ${page}): ${count}...`);
    },
  });
}

// Sonda leve para o estado do popup: um pedido de 1 dia chega para confirmar
// se a sessão existe, sem paginar todo o histórico.
async function solverdeStatus() {
  try {
    const now = new Date();
    const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const res = await fetch(SOLVERDE_BETS_URL, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "*/*" },
      body: JSON.stringify({
        filterCriteria: { from: from.toISOString(), to: now.toISOString() },
        oddsFormat: "decimal",
        pagination: { itemsPerPage: 1, page: 1 },
      }),
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => null);
    return Boolean(data && data.status === "SUCCESS");
  } catch (_) {
    return false;
  }
}

async function runSolverdeImport(cfg, accountId) {
  progress("A obter apostas da Solverde...");
  const raw = await fetchSolverdeBets();
  const byRef = new Map();
  for (const bet of raw) {
    const ref = solverdeRef(bet);
    if (ref) byRef.set(ref, bet);
  }
  const { bets: mapped, unsupported } = mapSolverdeBets([...byRef.values()]);
  return persistMapped(mapped, unsupported, "Solverde", cfg, accountId);
}

async function runBetanoImport(cfg, accountId, opts = {}) {
  const ensured = await ensureBetanoHistoryTab(opts);
  if (!ensured) return { skipped: true }; // auto-import sem histórico aberto
  const { tab, restoreUrl, created } = ensured;
  try {
    if (!betanoSessionTokens) await waitForBetanoTokens();
    progress("A obter apostas do Betano...");
    const { open, settled } = await fetchBetanoBets(tab.id);
    const byRef = new Map();
    for (const bet of settled) byRef.set(betanoRef(bet), bet);
    for (const bet of open) if (!byRef.has(betanoRef(bet))) byRef.set(betanoRef(bet), bet);
    byRef.delete(null);
    const mapped = mapBetanoBets([...byRef.values()]);
    return persistMapped(mapped.bets, mapped.unsupported, "Betano", cfg, accountId);
  } finally {
    if (created && tab.id !== undefined && restoreUrl) {
      await chrome.tabs.update(tab.id, { url: restoreUrl }).catch(() => {});
    }
  }
}

// ============================================================
// Deteção automática de conta pelo username da sessão da casa.
// A extensão pergunta à casa quem é o utilizador com sessão iniciada e procura
// uma bookie_account do BetTrackr com esse username (case-insensitive). Se
// encontrar, encaminha as apostas para essa conta - sobrepondo-se à escolha
// manual do dropdown. Sem username detetado (ou sem correspondência), mantém-se
// a seleção manual.
// ============================================================
const SOURCE_BOOKMAKER = { betclic: "Betclic", betano: "Betano", solverde: "Solverde" };
// Casas suportadas, em ordem canónica. Fonte única para os imports "all", a
// deteção de username e o filtro de casas ativas.
const SUPPORTED_SOURCES = ["betclic", "betano", "solverde"];

// Casas ativas escolhidas pelo utilizador no site (/api/settings). NULL na BD
// (não configurado) -> todas as suportadas. Em caso de falha de rede assumimos
// todas, para não bloquear imports por causa de um hiccup do servidor.
async function fetchEnabledBookmakers(cfg) {
  if (!cfg.bettrackrToken) return [...SUPPORTED_SOURCES];
  try {
    const res = await fetch(`${cfg.bettrackrBase}/api/settings`, {
      headers: { Authorization: `Bearer ${cfg.bettrackrToken}` },
    });
    if (!res.ok) return [...SUPPORTED_SOURCES];
    const data = await res.json().catch(() => ({}));
    const enabled = Array.isArray(data.enabledBookmakers) ? data.enabledBookmakers : null;
    return enabled ? SUPPORTED_SOURCES.filter((s) => enabled.includes(s)) : [...SUPPORTED_SOURCES];
  } catch (_) {
    return [...SUPPORTED_SOURCES];
  }
}

// Estado da subscrição do utilizador (/api/billing/status). A extensão é uma
// funcionalidade paga: sem acesso, o popup explica-o em vez de deixar carregar
// num botão que o servidor vai recusar com 402.
// Numa falha de rede devolve null = "não sei", e nada é bloqueado no popup -
// quem manda é sempre o servidor no momento do import.
async function fetchSubscription(cfg) {
  if (!cfg.bettrackrToken) return null;
  try {
    const res = await fetch(`${cfg.bettrackrBase}/api/billing/status`, {
      headers: { Authorization: `Bearer ${cfg.bettrackrToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!data || typeof data.entitled !== "boolean") return null;
    return {
      entitled: data.entitled,
      source: data.source || "none",
      trialEndsAt: data.trialEndsAt || null,
    };
  } catch (_) {
    return null;
  }
}

// Função executada DENTRO da página betclic.pt: lê o username do estado SSR
// embebido no documento (<script id="ng-state" type="application/json"> com
// ...,"username":"ronkzinho","identity":{...}). É a fonte mais fiável - sem
// fetch, sem CORS, sem token. Corre no mundo ISOLATED (só precisa do DOM).
function betclicReadStateFn() {
  const specific = /"username"\s*:\s*"([^"\\]{1,64})"\s*,\s*"identity"/;
  const generic = /"username"\s*:\s*"([^"\\]{1,64})"/;

  // Sessão ativa? A betclic mostra um link para /login (botão "Aceder") no
  // cabeçalho APENAS quando não há sessão. Nem o cookie BC-TOKEN (existe também
  // para visitantes - é anónimo) nem o CacheServiceLogin (persiste após logout)
  // servem. O link /login é o sinal fiável de "sem sessão" -> sem conta.
  let loggedIn = true;
  try { if (document.querySelector('a[href*="/login"]')) loggedIn = false; } catch (_) {}
  if (!loggedIn) return { username: null, loggedIn: false };

  // 1) CacheServiceLogin: o username da sessão ATUAL, escrito pela betclic no
  //    login. É runtime, por isso atualiza ao trocar de conta SEM ser preciso
  //    navegar (ao contrário do ng-state, que fica congelado no load).
  let login = null;
  try {
    const raw = localStorage.getItem("CacheServiceLogin");
    if (raw) {
      const v = JSON.parse(raw);
      if (v && typeof v.value === "string" && v.value.trim()) login = v.value.trim();
    }
  } catch (_) {}

  // 2) Estado SSR embebido no documento (congelado no load) - fallback.
  let ngState = null;
  try {
    const scripts = document.querySelectorAll('script[type="application/json"], script[id*="state"]');
    for (const s of scripts) {
      const m = (s.textContent || "").match(specific) || (s.textContent || "").match(generic);
      if (m) { ngState = m[1]; break; }
    }
    if (!ngState) {
      const html = document.documentElement ? document.documentElement.innerHTML : "";
      const m = html.match(specific) || html.match(generic);
      if (m) ngState = m[1];
    }
  } catch (_) {}

  const username = login || ngState;
  return { username, login, ngState, loggedIn: true, error: username ? null : "sem sessão betclic (inicia sessão em betclic.pt)" };
}

// Função executada DENTRO da página betano.pt: lê a identidade da sessão atual.
// A Betano (plataforma Kaizen) tem um username/handle real - o customerCode
// (ex.: "ronkzinho") - mas ele NÃO vive no estado embebido (initial_state só
// tem customerId + email). A única fonte é GET /api/balance -> data.customerCode,
// obtido só com os cookies da sessão. Fazemos um fetch FRESCO a cada sondagem:
// é isso que apanha a troca de conta (logout+login) sem depender de estado
// congelado no load. O customerId (de initial_state) e o email ficam como
// identificadores secundários. Async: o chrome.scripting resolve a promise.
// Corre no mundo MAIN (precisa de window["initial_state"] e do fetch com cookies).
async function betanoReadStateFn() {
  let customerId = null;
  let email = null;
  let username = null; // customerCode - o handle mostrado ao utilizador
  let loggedIn = true;

  // 1) initial_state.user - traz customerId + email (secundários) e o sinal
  //    fiável de logout (isLoggedIn:false).
  try {
    const user = window["initial_state"] && window["initial_state"].user;
    if (user) {
      loggedIn = user.isLoggedIn !== false;
      const info = user.info || {};
      if (info.customerId != null) customerId = String(info.customerId);
      if (typeof info.email === "string") email = info.email;
    }
  } catch (_) {}

  // 2) /api/balance -> data.customerCode: o username real. Fetch fresco (cookies)
  //    => reflete a conta ATUAL mesmo após trocar de conta sem recarregar.
  try {
    const r = await fetch("/api/balance?_=" + Date.now(), {
      credentials: "include",
      headers: { Accept: "application/json, text/plain, */*" },
    });
    if (r.status === 401 || r.status === 403) {
      loggedIn = false; // sinal positivo de sessão terminada
    } else if (r.ok) {
      const j = await r.json().catch(() => null);
      const cc = j && j.data && j.data.customerCode;
      if (typeof cc === "string" && cc.trim()) username = cc.trim();
    }
  } catch (_) {}

  // loggedIn só é false com sinal POSITIVO (isLoggedIn:false ou /api/balance
  // 401/403). Sem identidade mas SEM esse sinal NÃO afirmamos logout: devolvemos
  // loggedIn:true para o probe recorrer ao fallback do storage (populado pelo
  // inject) em vez de o limpar.
  if (!loggedIn) return { username: null, loggedIn: false };
  // username preferido = customerCode (handle); cai para customerId/email só
  // quando o /api/balance não deu resposta utilizável.
  const primary = username || customerId || email || null;
  return {
    username: primary,
    customerId,
    email,
    loggedIn: true,
    error: primary ? null : "estado da sessão Betano indisponível na página (recarrega betano.pt)",
  };
}

// Sondas de identidade por casa: tabs a consultar, função a correr na página e
// a chave de cache. betclic e betano partilham a mesma lógica de sondagem.
const IDENTITY_PROBES = {
  betclic: {
    urls: ["https://www.betclic.pt/*"],
    readFn: betclicReadStateFn,
    cacheKey: "betclicUsername",
    openHint: "abre betclic.pt numa tab",
  },
  betano: {
    urls: ["https://www.betano.pt/*", "https://betano.pt/*"],
    readFn: betanoReadStateFn,
    cacheKey: "betanoUsername",
    // Identidade rica {username, customerId, email} para o fallback sem tab
    // (auto-import) poder associar por qualquer campo, tal como a leitura live.
    identityKey: "betanoIdentity",
    openHint: "abre betano.pt numa tab",
    // MAIN world: preciso para ler window["initial_state"] e fazer o fetch a
    // /api/balance com os cookies da página (o username real = customerCode).
    world: "MAIN",
  },
};

// Sonda a identidade da casa e devolve diagnóstico ({username, error}) para o
// popup poder mostrar o motivo quando falha.
async function probeBookmakerIdentity(source, _cfg) {
  const probe = IDENTITY_PROBES[source];
  if (!probe) return { username: null };

  // 1) Leitura live do estado da sessão nas tabs abertas da casa. O estado
  //    embebido é "congelado" no load, por isso lemos primeiro a tab ATIVA / a
  //    mais recente - a que reflete a sessão atual. Assim, mudar de conta
  //    (logout + login, que recarrega a página) passa a atualizar.
  let liveError = null;
  try {
    const tabs = (await chrome.tabs.query({ url: probe.urls }))
      .filter((t) => t.id !== undefined)
      .sort((a, b) =>
        (Number(Boolean(b.active)) - Number(Boolean(a.active))) ||
        ((b.lastAccessed || 0) - (a.lastAccessed || 0))
      );
    if (tabs.length === 0) {
      liveError = probe.openHint;
    } else {
      for (const tab of tabs) {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: probe.readFn,
          world: probe.world, // undefined -> ISOLATED (betclic); "MAIN" -> betano
        });
        const out = (results && results[0] && results[0].result) || null;
        if (out && out.username) {
          const toStore = { [probe.cacheKey]: out.username };
          if (probe.identityKey) {
            toStore[probe.identityKey] = {
              username: out.username || null,
              customerId: out.customerId || null,
              email: out.email || null,
            };
          }
          chrome.storage.local.set(toStore);
          return out;
        }
        // Sessão terminada numa tab aberta: a verdade é "sem conta". Limpa o
        // username em cache para não reaparecer stale e não recorras ao
        // fallback (que devolveria o último login memorizado).
        if (out && out.loggedIn === false) {
          chrome.storage.local.remove([probe.cacheKey, probe.identityKey].filter(Boolean));
          return { username: null, loggedIn: false };
        }
        liveError = (out && out.error) || "sem resposta da página";
      }
    }
  } catch (e) {
    liveError = String((e && e.message) || e);
  }

  // 2) Fallback: identidade guardada pelo content script num load anterior (para
  //    quando não há tab aberta agora - ex.: auto-import). A identidade rica
  //    permite associar por username/customerId/email; senão só o username.
  if (probe.identityKey) {
    const rich = (await chrome.storage.local.get([probe.identityKey]))[probe.identityKey];
    if (rich && (rich.username || rich.customerId || rich.email)) {
      return {
        username: rich.username || rich.customerId || rich.email,
        customerId: rich.customerId || null,
        email: rich.email || null,
      };
    }
  }
  const stored = await chrome.storage.local.get([probe.cacheKey]);
  if (stored[probe.cacheKey]) return { username: String(stored[probe.cacheKey]) };
  return { username: null, error: liveError };
}

async function fetchBettrackrAccounts(cfg) {
  try {
    const res = await fetch(`${cfg.bettrackrBase}/api/accounts`, {
      headers: { Authorization: `Bearer ${cfg.bettrackrToken}` },
    });
    if (!res.ok) return [];
    const data = await res.json().catch(() => ({}));
    return Array.isArray(data.accounts) ? data.accounts : [];
  } catch (_) {
    return [];
  }
}

function accountsForBookmaker(accounts, source) {
  const bookmaker = SOURCE_BOOKMAKER[source];
  return accounts.filter((account) => account && (!bookmaker || String(account.bookmaker) === bookmaker));
}

// Associa uma conta a uma identidade detetada {username, customerId, email}.
// Regras (iguais no popup e no background):
//   - o username (handle, ex.: customerCode "ronkzinho") bate certo com o campo
//     username da conta OU com o label (rede de segurança para quem nomeou a
//     conta como o handle sem preencher o campo dedicado);
//   - o customerId/email só batem certo com o campo username EXPLÍCITO da conta
//     (nunca com o label) - ou seja, o email só associa se o utilizador o tiver
//     posto na conta do BetTrackr. Assim evita-se associar por acaso.
function matchAccountByIdentity(candidates, identity) {
  const norm = (v) => (v == null ? "" : String(v).trim().toLowerCase());
  const handle = norm(identity && identity.username);
  const explicit = [handle, norm(identity && identity.customerId), norm(identity && identity.email)]
    .filter(Boolean);
  return (
    candidates.find((account) =>
      typeof account.username === "string" && explicit.includes(norm(account.username))
    ) ||
    (handle
      ? candidates.find((account) => norm(account.label) === handle)
      : null) ||
    null
  );
}

// Decide a que conta vão as apostas de uma casa. A ordem é a mesma no import
// manual e no automático - a deteção nunca depende do popup estar aberto:
//   1) username da sessão da casa (ex.: Betclic /me) que bate certo com o
//      username de uma conta -> desambigua várias contas na mesma casa;
//   2) escolha manual no dropdown do popup, quando existe;
//   3) uma única conta registada nessa casa -> associa-a automaticamente
//      (o caso comum: quem só tem uma conta por casa nunca precisa de escolher);
//   4) nada de fiável para decidir -> "sem conta".
async function resolveAccountId(source, cfg, accounts, manualAccountId) {
  const candidates = accountsForBookmaker(accounts, source);
  const label = SOURCE_BOOKMAKER[source] || source;

  try {
    const probe = await probeBookmakerIdentity(source, cfg);
    const username = probe && probe.username;
    if (username) {
      const match = matchAccountByIdentity(candidates, probe);
      if (match) {
        progress(`${label}: conta @${username} detetada automaticamente.`);
        return String(match.id);
      }
    }
  } catch (_) {
    // Falha a obter a identidade -> segue para o dropdown / conta única.
  }

  if (manualAccountId) return manualAccountId;

  if (candidates.length === 1) {
    progress(`${label}: conta "${candidates[0].label}" associada automaticamente.`);
    return String(candidates[0].id);
  }
  return null;
}

// Deteta o username da sessão de cada casa (para o popup pré-selecionar a conta
// certa). Só a Betclic tem endpoint de identidade conhecido; as outras devolvem
// null e ficam pela conta única / seleção manual.
async function detectBookmakerUsernames() {
  const cfg = await getConfig();
  const result = {};
  await Promise.all(SUPPORTED_SOURCES.map(async (source) => {
    try {
      result[source] = await probeBookmakerIdentity(source, cfg);
    } catch (e) {
      result[source] = { username: null, error: String((e && e.message) || e) };
    }
  }));
  return result;
}

async function runImportSources(source, cfg, accountIds, opts = {}) {
  if (!cfg.bettrackrToken) throw new Error("Sem sessão BetTrackr. Abre a app e inicia sessão.");
  // "all" importa só das casas ativas escolhidas no site (só aqui é preciso ir
  // buscar a seleção); um pedido explícito a uma casa é respeitado tal como veio
  // (o popup já só mostra casas ativas, e o auto-import filtra à parte).
  const sources = source === "all" ? await fetchEnabledBookmakers(cfg) : [source];
  if (sources.length === 0) throw new Error("Nenhuma casa de apostas ativa. Escolhe pelo menos uma nas definições.");
  const chosenAccounts = accountIds && typeof accountIds === "object" ? accountIds : {};
  // Contas do utilizador uma única vez - servem a deteção por username e a
  // regra de "conta única" para todas as casas deste import.
  const accounts = await fetchBettrackrAccounts(cfg);
  const results = {};
  for (const current of sources) {
    const manualAccountId = typeof chosenAccounts[current] === "string" && chosenAccounts[current]
      ? chosenAccounts[current]
      : null;
    const accountId = await resolveAccountId(current, cfg, accounts, manualAccountId);
    try {
      if (current === "betano") {
        results[current] = { ok: true, ...(await runBetanoImport(cfg, accountId, opts)) };
      } else if (current === "solverde") {
        results[current] = { ok: true, ...(await runSolverdeImport(cfg, accountId)) };
      } else {
        results[current] = { ok: true, ...(await runBetclicImport(cfg, accountId)) };
      }
    } catch (error) {
      results[current] = { ok: false, error: String(error && error.message || error) };
    }
  }
  const available = Object.values(results).some((result) => result.ok);
  if (!available) {
    const errors = Object.entries(results).map(([name, result]) => `${name}: ${result.error}`).join("; ");
    throw new Error(errors || "Nenhuma fonte disponível.");
  }
  const totals = Object.values(results).reduce((sum, result) => {
    if (!result.ok) return sum;
    for (const key of ["fetched", "imported", "updated", "skipped", "unsupported", "cashouts", "ignoredNew"]) sum[key] += result[key] || 0;
    return sum;
  }, { fetched: 0, imported: 0, updated: 0, skipped: 0, unsupported: 0, cashouts: 0, ignoredNew: 0 });
  return { ok: true, sourceResults: results, ...totals };
}

async function runImport(source, sessionSnapshot, accountIds, opts = {}) {
  const cfg = await configForImport(sessionSnapshot);
  return runAfterBettrackrVerification({
    token: cfg.bettrackrToken,
    baseUrl: cfg.bettrackrBase,
    expectedUserId: cfg.bettrackrUserId,
  }, async (identity) => {
    await chrome.storage.local.set({ bettrackrUserId: identity.userId });
    const resultado = await runImportSources(source, cfg, accountIds, opts);

    // Passagem oportunista da odd de fecho: a extensão já está a correr e já
    // tem sessão, por isso aproveita-se para fotografar os preços dos jogos
    // que aí vêm. É a rede para quando o Chrome estiver fechado ao apito.
    // Nunca deixa uma falha aqui estragar a importação, que é o que o
    // utilizador pediu.
    try {
      if (await closingOddsEnabled()) {
        const bets = await fetchBetsForClosingOdds(cfg);
        const r = await runClosingOddsPass(cfg, bets);
        console.info(
          `[BetTrackr][fecho] importação: ${r.pernas} perna(s), ${r.guardadas} leitura(s), ${r.escritas} escrita(s).`,
        );
      }
    } catch (error) {
      console.info("[BetTrackr][fecho] passagem falhou:", error && error.message);
    }

    return resultado;
  });
}

async function extensionStatus() {
  // O token/base vêm do storage; lê-o primeiro para que o fetch das casas ativas
  // corra em paralelo com as sondas de sessão (Betano/Solverde), não em série.
  const stored = await chrome.storage.local.get(["betclicToken", "bettrackrToken", "bettrackrBase", "bettrackrUser", "autoImport", "updateOnlyImport", "captureClosingOdds"]);
  const bettrackrBase = stored.bettrackrBase || DEFAULT_BETTRACKR_BASE;
  const [tabs, solverde, enabledBookmakers, subscription] = await Promise.all([
    chrome.tabs.query({ url: ["https://www.betano.pt/*", "https://betano.pt/*"] }),
    solverdeStatus(),
    // Casas ativas escolhidas no site, para o popup só mostrar essas. Sem sessão
    // BetTrackr assume-se todas (o popup mostra na mesma o pedido de login).
    fetchEnabledBookmakers({ bettrackrToken: stored.bettrackrToken || null, bettrackrBase }),
    fetchSubscription({ bettrackrToken: stored.bettrackrToken || null, bettrackrBase }),
  ]);
  return {
    betclic: Boolean(stored.betclicToken),
    // A Betano tab enables the action. The page bridge reports a useful
    // authentication error if the user is not logged in or needs a reload.
    betano: tabs.length > 0,
    // Solverde não precisa de tab aberta - sondamos a sessão diretamente.
    solverde,
    bettrackr: Boolean(stored.bettrackrToken),
    bettrackrBase,
    bettrackrUser: stored.bettrackrUser || null,
    autoImport: stored.autoImport === true,
    captureClosingOdds: stored.captureClosingOdds === true,
    updateOnly: stored.updateOnlyImport === true,
    enabledBookmakers,
    subscription,
  };
}

// ============================================================
// Login BetTrackr direto na extensão (E3). Deixa a extensão funcionar sem o
// site do BetTrackr aberto. Guardamos APENAS o JWT devolvido (expira em 7
// dias) - nunca a password. HTTPS via host_permissions.
// ============================================================
async function bettrackrLogin(email, password, base) {
  const origin = base || DEFAULT_BETTRACKR_BASE;
  // O "client" fica gravado no token: é assim que o servidor sabe que um
  // pedido veio da extensão (funcionalidade paga) e não do site.
  const res = await fetch(`${origin}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, client: "extension" }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) {
    throw new Error(data.error || "Não foi possível iniciar sessão no BetTrackr.");
  }
  await chrome.storage.local.set({
    bettrackrToken: data.token,
    bettrackrBase: origin,
    bettrackrUser: data.user && data.user.username ? String(data.user.username) : null,
  });
  return { ok: true, user: data.user || null };
}

async function bettrackrLogout() {
  await chrome.storage.local.remove(["bettrackrToken", "bettrackrUser"]);
  return { ok: true };
}

// ============================================================
// Auto-import (E3) - opt-in, desligado por defeito. Disparado pela captura do
// token de uma casa (Betclic guarda o token; Betano envia BETANO_SESSION).
// Debounce por casa para não repetir a cada navegação/refresh.
// ============================================================
const AUTO_IMPORT_DEBOUNCE_MS = 10 * 60 * 1000; // 10 min por casa
let autoImportRunning = false;

async function flashBadge(text, color) {
  try {
    await chrome.action.setBadgeBackgroundColor({ color });
    await chrome.action.setBadgeText({ text });
    setTimeout(() => { chrome.action.setBadgeText({ text: "" }).catch(() => {}); }, 8000);
  } catch (_) {}
}

async function maybeAutoImport(source) {
  const stored = await chrome.storage.local.get([
    "autoImport", "bettrackrToken", "importAccountChoices", "autoImportLast",
  ]);
  if (stored.autoImport !== true || !stored.bettrackrToken) return;

  // Só auto-importa de casas que o utilizador ativou no site.
  const enabled = await fetchEnabledBookmakers(await getConfig());
  if (!enabled.includes(source)) return;

  const now = Date.now();
  const last = stored.autoImportLast && typeof stored.autoImportLast === "object" ? stored.autoImportLast : {};
  if (last[source] && now - last[source] < AUTO_IMPORT_DEBOUNCE_MS) return;
  if (autoImportRunning) return;
  autoImportRunning = true;
  // Marca já o timestamp para evitar corridas entre gatilhos próximos.
  await chrome.storage.local.set({ autoImportLast: { ...last, [source]: now } });

  const accountIds = stored.importAccountChoices && typeof stored.importAccountChoices === "object"
    ? stored.importAccountChoices
    : {};
  try {
    // Sem snapshot da app: o auto-import é disparado pela sessão da casa, por
    // isso a sessão BetTrackr vem de uma tab aberta ou do storage.
    const result = await runImport(source, null, accountIds, { auto: true });
    const changed = (result.imported || 0) + (result.updated || 0);
    if (changed > 0) await flashBadge(String(changed), "#16a34a");
  } catch (_) {
    await flashBadge("!", "#dc2626");
  } finally {
    autoImportRunning = false;
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // A app do BetTrackr diz-nos qual e a sessao atual; a troca por token de
  // extensao acontece no storeBettrackrSession, nunca do lado da pagina.
  if (msg && msg.type === "BETTRACKR_SESSION") {
    storeBettrackrSession(msg.session || null)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: err && err.message ? err.message : String(err) }));
    return true;
  }
  if (msg && msg.type === "BETANO_SESSION") {
    const tokens = msg.tokens;
    if (tokens && tokens.token1 && tokens.token2) {
      betanoSessionTokens = {
        token1: String(tokens.token1),
        token2: String(tokens.token2),
        seontoken: tokens.seontoken ? String(tokens.seontoken) : "",
        apiOrigin: tokens.apiOrigin === "https://betano.pt" || tokens.apiOrigin === "https://www.betano.pt"
          ? tokens.apiOrigin
          : null,
      };
      for (const waiter of betanoTokenWaiters) {
        clearTimeout(waiter.timer);
        waiter.resolve();
      }
      betanoTokenWaiters.clear();
      // Sessão Betano capturada -> tenta auto-import (se ligado e com histórico
      // já aberto; caso contrário salta sem sequestrar o separador).
      maybeAutoImport("betano");
    }
    return false;
  }
  if (msg && msg.type === "AUTO_IMPORT_HINT") {
    // Enviado pelos content scripts das casas quando capturam um token novo.
    const source = msg.source === "betclic" || msg.source === "betano" ? msg.source : null;
    if (source) maybeAutoImport(source);
    return false;
  }
  if (msg && msg.type === "BETANO_PAGE_RESULT") {
    const pending = pendingBetanoRequests.get(msg.requestId);
    if (!pending) return false;
    pendingBetanoRequests.delete(msg.requestId);
    pending.resolve({ ok: msg.ok, status: msg.status, payload: msg.payload, error: msg.error });
    return false;
  }
  if (msg && msg.type === "GET_STATUS") {
    extensionStatus().then(sendResponse).catch(() => sendResponse({ betclic: false, betano: false, solverde: false, bettrackr: false }));
    return true;
  }
  if (msg && msg.type === "DETECT_USERNAMES") {
    detectBookmakerUsernames()
      .then(sendResponse)
      .catch(() => sendResponse({}));
    return true;
  }
  if (msg && msg.type === "IMPORT") {
    const source = ["betclic", "betano", "solverde", "all"].includes(msg.source) ? msg.source : "all";
    runImport(source, msg.bettrackrSession, msg.accountIds)
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: String(error && error.message || error) }));
    return true;
  }
  if (msg && msg.type === "LOGIN") {
    bettrackrLogin(String(msg.email || ""), String(msg.password || ""), msg.base)
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: String(error && error.message || error) }));
    return true;
  }
  if (msg && msg.type === "LOGOUT") {
    bettrackrLogout()
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: String(error && error.message || error) }));
    return true;
  }
  if (msg && msg.type === "SET_AUTO_IMPORT") {
    chrome.storage.local.set({ autoImport: msg.enabled === true })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error && error.message || error) }));
    return true;
  }
  if (msg && msg.type === "SET_CAPTURE_CLOSING_ODDS") {
    chrome.storage.local.set({ captureClosingOdds: msg.enabled === true })
      .then(async () => {
        // Ao ligar, agenda já; ao desligar, cancela o alarme e larga as
        // fotografias - não faz sentido guardar leituras que ninguém vai usar.
        if (msg.enabled === true) {
          try {
            const cfg = await getConfig();
            if (cfg.bettrackrToken) {
              await scheduleClosingOddsAlarm(await fetchBetsForClosingOdds(cfg));
            }
          } catch (_) {}
        } else {
          await chrome.alarms.clear(CLOSING_ALARM);
          await chrome.storage.local.remove(SNAPSHOT_STORE);
        }
        sendResponse({ ok: true });
      })
      .catch((error) => sendResponse({ ok: false, error: String(error && error.message || error) }));
    return true;
  }
  if (msg && msg.type === "SET_UPDATE_ONLY") {
    chrome.storage.local.set({ updateOnlyImport: msg.enabled === true })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error && error.message || error) }));
    return true;
  }
  return false;
});
