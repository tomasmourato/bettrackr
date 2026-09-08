// sync.ts - uma passagem do bot: login por passkey -> ler apostas da Betclic
// (liquidadas E pendentes) -> reconciliar com o BetTrackr -> inserir as novas e
// ATUALIZAR as que mudaram de estado (pendente -> liquidada) ou que ganharam a
// odd de antes do boost. Como uma extensao sem browser.
//
// So le da Betclic. So escreve no BetTrackr (a conta do proprio dono). Nunca
// aposta, nunca toca na carteira. Nunca envia closingOdd, por isso o CLV fica
// intacto (o servidor preserva a odd de fecho num PUT sem closingOdd).

import { SoftCredential } from "./softAuthenticator.js";
import { requestLoginOptions, submitLogin } from "./betclicAuth.js";
import { fetchBetclicBets } from "./betclicBets.js";
import { mapBets } from "./mapper.js";
import {
  knownBets,
  pushBets,
  updateBet,
  temOddOriginal,
  BettrackrConfig,
  KnownBet,
} from "./bettrackr.js";

/**
 * Esta aposta mapeada precisa de ir para o BetTrackr?
 *
 * Duas razoes: mudou de estado (o caso normal - pendente -> liquidada), ou traz
 * a odd de antes do boost que a gravada ainda nao tem. A segunda e a passagem
 * de recuperacao das turbinadas antigas, e esgota-se sozinha: assim que a
 * aposta e reescrita com a odd original deixa de reaparecer aqui.
 */
export function precisaDeAtualizar(atual: KnownBet | undefined, mapeada: any): boolean {
  if (!atual) return true; // nova
  if (atual.status !== mapeada?.status) return true;
  return !atual.temOddOriginal && temOddOriginal(mapeada);
}

export interface SyncDeps {
  cred: SoftCredential;
  userHandle: Buffer;
  // Token begmedia valido para servir de CONTEXTO ao login por passkey. Em
  // regime, e o access_token da passagem anterior; no arranque, um dado pelo
  // admin. (Ver index.ts.)
  contextToken: string;
  // Destino no BetTrackr. Omitir => dry-run (so imprime, nao envia, nao lista).
  bettrackr?: BettrackrConfig;
  // A bookie_account a que esta conta Betclic pertence. Etiqueta as apostas
  // importadas na conta certa (multi-conta). Ausente = "sem conta".
  accountId?: string | null;
  log?: (msg: string) => void;
}

export interface SyncResult {
  accessToken: string; // o novo access_token, para servir de contexto ao proximo
  refreshToken: string | null;
  lidasBetclic: number;
  novas: number;
  enviadas: number;
  atualizadas: number;
  dryRun: boolean;
}

export async function syncOnce(deps: SyncDeps): Promise<SyncResult> {
  const log = deps.log || (() => {});
  const dryRun = !deps.bettrackr;

  // 1. Login por passkey (usa o token de contexto).
  const options = await requestLoginOptions(deps.contextToken);
  const login = await submitLogin(deps.cred, deps.userHandle, options, deps.contextToken);
  if (!login.ok || !login.token) {
    throw new Error(`login por passkey falhou (${login.status}): ${login.body.slice(0, 200)}`);
  }
  log(`login OK (status=${login.status_field})`);

  // 2. O que ja esta no BetTrackr: importKey -> { id, status }. Em dry-run nao lista.
  let known = new Map<string, KnownBet>();
  if (deps.bettrackr) {
    known = await knownBets(deps.bettrackr);
    log(`${known.size} aposta(s) ja no BetTrackr`);
  }

  // Uma aposta mapeada e "nova ou mudada" se nao a conhecemos, ou se a
  // conhecemos com um status diferente (tipicamente pendente -> liquidada).
  const isNewOrChanged = (mapped: any): boolean => {
    const key = mapped?.metadata?.importKey;
    if (!key) return false;
    return precisaDeAtualizar(known.get(String(key)), mapped);
  };

  // 3. Ler da Betclic. LIQUIDADAS com paragem por pagina: para na primeira
  //    pagina que ja nao traz nada novo nem mudado (apanha apostas que
  //    liquidaram "no meio" da lista, ao contrario da paragem na 1a conhecida).
  //    PENDENTES: le-as todas (sao poucas) para as importar e reconciliar.
  //    Em dry-run le so a 1a pagina de cada.
  const ended = await fetchBetclicBets(login.token, "ended", {
    maxPages: dryRun ? 1 : 250,
    shouldContinue: deps.bettrackr ? (page) => mapBets(page).some(isNewOrChanged) : undefined,
    onPage: ({ lidas, parou }) => log(`  ended: lidas ${lidas}${parou ? " (parou)" : ""}`),
  });
  const ongoing = await fetchBetclicBets(login.token, "ongoing", {
    maxPages: dryRun ? 1 : 50,
    shouldContinue: deps.bettrackr ? () => true : undefined,
    onPage: ({ lidas }) => log(`  ongoing: lidas ${lidas}`),
  });
  const lidasBetclic = ended.length + ongoing.length;
  log(`${lidasBetclic} aposta(s) lidas da Betclic`);

  // 4. Reconciliar: novo => inserir; conhecido com status diferente => atualizar.
  const mapped = mapBets([...ended, ...ongoing]);
  const inserts: any[] = [];
  const updates: { id: string; bet: any }[] = [];
  const seen = new Set<string>();
  for (const b of mapped) {
    const key = b?.metadata?.importKey;
    if (!key || seen.has(String(key))) continue; // ignora sem ref e duplicados
    seen.add(String(key));
    const cur = known.get(String(key));
    if (!cur) inserts.push(b);
    else if (precisaDeAtualizar(cur, b)) updates.push({ id: cur.id, bet: b });
  }
  log(`${inserts.length} nova(s), ${updates.length} a atualizar`);

  // 5. Escrever (ou imprimir, em dry-run).
  let enviadas = 0;
  let atualizadas = 0;
  if (dryRun) {
    for (const b of inserts.slice(0, 5)) {
      const legs = Array.isArray(b.selections) ? b.selections.length : 0;
      log(`  [dry][nova] ${b.metadata?.importKey}  ${b.stake}@${b.odd}  ${b.status}  ${legs} perna(s)`);
    }
    if (inserts.length > 5) log(`  [dry] ... e mais ${inserts.length - 5} nova(s)`);
    for (const u of updates.slice(0, 5)) {
      log(`  [dry][muda] ${u.bet.metadata?.importKey}  -> ${u.bet.status}`);
    }
    if (updates.length > 5) log(`  [dry] ... e mais ${updates.length - 5} a atualizar`);
  } else {
    // Inserir em lotes de 500 (limite de 1000 no bulk), como a extensao. Cada
    // aposta vai etiquetada com a conta que se esta a importar.
    for (let i = 0; i < inserts.length; i += 500) {
      const lote = inserts.slice(i, i + 500);
      const r = await pushBets(deps.bettrackr!, lote, deps.accountId);
      if (!r.ok) throw new Error(`envio ao BetTrackr falhou (${r.status}): ${r.body.slice(0, 200)}`);
      enviadas += lote.length;
    }
    // Atualizar uma a uma (PUT /:id). CLV preservado (sem closingOdd no corpo);
    // o accountId vai no corpo para nao apagar a conta no update.
    for (const u of updates) {
      const r = await updateBet(deps.bettrackr!, u.id, u.bet, deps.accountId);
      if (!r.ok) throw new Error(`atualizacao de ${u.id} falhou (${r.status}): ${r.body.slice(0, 200)}`);
      atualizadas += 1;
    }
    if (enviadas) log(`${enviadas} aposta(s) enviadas ao BetTrackr`);
    if (atualizadas) log(`${atualizadas} aposta(s) atualizadas no BetTrackr`);
  }

  return {
    accessToken: login.token,
    refreshToken: login.refreshToken,
    lidasBetclic,
    novas: inserts.length,
    enviadas,
    atualizadas,
    dryRun,
  };
}
