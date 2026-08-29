// extension/src/closing-odds.js
// Decide QUANDO ler a odd de fecho e O QUE gravar. Módulo puro - sem chrome.*
// e sem rede - para ser testado como os mappers já são (extension/test).
//
// O problema que resolve: a odd de fecho é a última antes de o jogo começar, e
// ninguém a vai escrever à mão para centenas de apostas. A extensão já tem
// sessão na Betclic; falta-lhe saber a que horas acordar e qual das leituras
// que fez é a boa.
//
// Três decisões que valem a pena estar escritas:
//
//  * Só se lê ANTES do apito. Depois do apito o mercado está suspenso e o
//    preço que viesse não seria linha de fecho nenhuma - seria lixo com ar de
//    dado. Por isso uma leitura tardia é deitada fora, não guardada.
//
//  * Guarda-se UMA leitura por perna, a mais recente. Como só entram leituras
//    de antes do apito, a mais recente é sempre a melhor - não é preciso um
//    histórico, que só encheria o chrome.storage.
//
//  * Regista-se quantos minutos antes do apito a leitura foi feita. Uma linha
//    apanhada a 2 minutos vale muito mais do que uma de 6 horas antes, e o
//    utilizador tem direito a saber qual das duas está a ver - sobretudo
//    porque o Chrome pode estar fechado à hora do jogo.

/** Quantos minutos antes do apito queremos acordar. */
export const SNAPSHOT_LEAD_MINUTES = 2;

/** Até onde olhamos para a frente. Mais do que isto é ruído. */
export const SNAPSHOT_WINDOW_HOURS = 48;

/** Chave de uma perna no armazenamento: a aposta mais o índice. */
export function legKeyOf(importKey, index) {
  return `${importKey}#${index}`;
}

/**
 * Aceita ISO ("2026-08-29T20:45:00Z") e o formato da app
 * ("2026-08-29 20:45"). O replace do espaço por "T" é o mesmo remendo que a
 * app usa - sem ele o Safari devolve Invalid Date. Devolve null no que não dá.
 */
export function toEpoch(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = new Date(value.trim().replace(" ", "T")).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * As pernas que ainda vale a pena vigiar: aposta por liquidar, jogo ainda por
 * começar e dentro da janela. Uma perna que já tenha odd de fecho está feita.
 */
export function pendingLegsFrom(bets, now = Date.now()) {
  const horizon = now + SNAPSHOT_WINDOW_HOURS * 60 * 60 * 1000;
  const legs = [];

  for (const bet of bets || []) {
    if (!bet || bet.status !== "POR_LIQUIDAR" || bet.isIgnored) continue;
    const importKey = bet.importKey || bet.metadata?.importKey;
    if (!importKey) continue;

    const selections = bet.selections || [];
    selections.forEach((selection, index) => {
      if (!selection) return;
      if (selection.closingOdd) return; // já está
      const startsAt = toEpoch(selection.startsAt);
      if (startsAt === null) return; // sem apito não se sabe quando ler
      if (startsAt <= now || startsAt > horizon) return;

      legs.push({
        importKey,
        betId: bet.id,
        index,
        startsAt,
        oddTaken: Number(selection.odd) || 0,
        event: selection.event || "",
        // Ids da Betclic: o do jogo constrói o URL, o da seleção encontra o
        // preço lá dentro. Sem eles não há como ler nada.
        matchId: selection.sourceRef?.matchId,
        selectionId: selection.sourceRef?.selectionId,
      });
    });
  }

  return legs;
}

/** Rota SSR atual da página de jogo da Betclic. */
export function betclicMatchPath(matchId, event) {
  const slug = String(event || "evento")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "evento";
  return `/futebol-sfootball/evento-c0/${slug}-m${encodeURIComponent(matchId)}`;
}

/**
 * Quando acordar: o apito mais próximo menos SNAPSHOT_LEAD_MINUTES. Devolve
 * null quando não há nada a vigiar.
 *
 * Um jogo cujo instante de leitura já passou (o Chrome esteve fechado) não
 * puxa o alarme para o passado - vale a pena ler já, por isso devolve `now`.
 */
export function nextWakeUp(legs, now = Date.now()) {
  const lead = SNAPSHOT_LEAD_MINUTES * 60 * 1000;
  let earliest = null;

  for (const leg of legs || []) {
    if (leg.startsAt <= now) continue;
    const at = Math.max(leg.startsAt - lead, now);
    if (earliest === null || at < earliest) earliest = at;
  }

  return earliest;
}

/** Minutos entre a leitura e o apito. null quando falta uma das datas. */
export function leadMinutes(capturedAt, startsAt) {
  const captured = toEpoch(capturedAt);
  const kickoff = toEpoch(startsAt);
  if (captured === null || kickoff === null) return null;
  return Math.round((kickoff - captured) / 60000);
}

/**
 * A leitura nova entra? Só se for ANTES do apito e mais recente do que a que
 * já lá está. Guardar uma leitura de depois do apito seria guardar lixo com ar
 * de dado; guardar uma mais antiga só pioraria a que já temos.
 */
export function acceptSnapshot(existing, candidate, startsAt) {
  const kickoff = toEpoch(startsAt);
  const at = toEpoch(candidate?.at);
  const odd = Number(candidate?.odd);

  if (kickoff === null || at === null) return false;
  if (!Number.isFinite(odd) || odd <= 1) return false;
  if (at >= kickoff) return false;

  const previous = toEpoch(existing?.at);
  if (previous !== null && previous >= at) return false;

  return true;
}

/**
 * A aposta já pode ser escrita no BetTrackr? Só quando TODAS as pernas têm
 * leitura e todos os jogos já começaram - antes disso ainda pode aparecer uma
 * leitura melhor. Faltando uma perna devolve null: meia múltipla não dá meia
 * linha de fecho, e o boletim fica para preenchimento à mão.
 *
 * Devolve o corpo do PATCH /api/bets/:id/closing-odd, com a marca de qualidade
 * da leitura mais antiga - a pior perna manda, que é o honesto.
 */
export function readyToWrite(bet, snapshots, now = Date.now()) {
  const importKey = bet?.importKey || bet?.metadata?.importKey;
  const selections = bet?.selections || [];
  if (!importKey || selections.length === 0) return null;

  const legs = [];
  let worstLead = null;
  let capturedAt = null;

  for (let index = 0; index < selections.length; index++) {
    const selection = selections[index];
    const startsAt = toEpoch(selection?.startsAt);
    if (startsAt === null || startsAt > now) return null; // ainda pode melhorar

    const snapshot = snapshots?.[legKeyOf(importKey, index)];
    const odd = Number(snapshot?.odd);
    if (!Number.isFinite(odd) || odd <= 1) return null; // perna sem leitura

    const lead = leadMinutes(snapshot.at, selection.startsAt);
    if (lead !== null && (worstLead === null || lead > worstLead)) {
      worstLead = lead;
      capturedAt = snapshot.at;
    }

    legs.push({ index, closingOdd: odd });
  }

  return {
    legs,
    source: "betclic",
    ...(capturedAt ? { capturedAt } : {}),
    ...(worstLead !== null ? { leadMinutes: worstLead } : {}),
  };
}

/**
 * Colhe os preços de um `ng-state` da Betclic: o JSON que a página do jogo
 * traz embebido no HTML (o transfer state do Angular), já com as respostas
 * gRPC descodificadas lá dentro.
 *
 * É a razão de não precisarmos de gRPC nem de raspar o DOM: as odds estão ali
 * em JSON, indexadas pelo MESMO id de seleção que a API de apostas devolve.
 * Os botões de odd da página não têm id nenhum, por isso ler o DOM obrigaria a
 * casar por texto do mercado - frágil e dependente do idioma.
 *
 * Devolve um Map de id-da-seleção (texto) -> odd.
 */
export function collectSelectionOdds(state) {
  const out = new Map();

  const visita = (node, depth) => {
    // O estado é grande e fundo; o limite evita um ciclo patológico se a
    // Betclic mudar a forma sem avisar.
    if (!node || typeof node !== "object" || depth > 14) return;
    if (Array.isArray(node)) {
      for (const item of node) visita(item, depth + 1);
      return;
    }
    const odd = Number(node.odds);
    if (node.id != null && Number.isFinite(odd) && odd > 1) {
      out.set(String(node.id), odd);
    }
    for (const key of Object.keys(node)) visita(node[key], depth + 1);
  };

  visita(state, 0);
  return out;
}

/** Extrai o bloco ng-state do HTML da página do jogo. null se não estiver lá. */
export function parseNgState(html) {
  if (typeof html !== "string") return null;
  const match = html.match(
    /<script\b[^>]*\bid=["']ng-state["'][^>]*>([\s\S]*?)<\/script>/i,
  );
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch (_) {
    return null;
  }
}
