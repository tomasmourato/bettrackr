// sync.ts - uma passagem do bot: login por passkey -> ler apostas novas da
// Betclic -> mapear -> enviar ao BetTrackr (ou so imprimir, em dry-run).
//
// So le da Betclic. So escreve no BetTrackr (a conta do proprio dono). Nunca
// aposta, nunca toca na carteira.

import { SoftCredential } from "./softAuthenticator.js";
import { requestLoginOptions, submitLogin } from "./betclicAuth.js";
import { fetchBetclicBets } from "./betclicBets.js";
import { mapBets, refOf } from "./mapper.js";
import { knownImportKeys, pushBets, BettrackrConfig } from "./bettrackr.js";

export interface SyncDeps {
  cred: SoftCredential;
  userHandle: Buffer;
  // Token begmedia valido para servir de CONTEXTO ao login por passkey. Em
  // regime, e o access_token da passagem anterior; no arranque, um dado pelo
  // admin. (Ver session.ts / index.ts.)
  contextToken: string;
  // Destino no BetTrackr. Omitir => dry-run (so imprime, nao envia, nao lista).
  bettrackr?: BettrackrConfig;
  log?: (msg: string) => void;
}

export interface SyncResult {
  accessToken: string; // o novo access_token, para servir de contexto ao proximo
  refreshToken: string | null;
  lidasBetclic: number;
  novas: number;
  enviadas: number;
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

  // 2. Deduplicacao: o que ja esta no BetTrackr. Em dry-run nao lista.
  let known = new Set<string>();
  if (deps.bettrackr) {
    known = await knownImportKeys(deps.bettrackr);
    log(`${known.size} aposta(s) ja no BetTrackr`);
  }

  // 3. Ler da Betclic com paragem antecipada: para na primeira aposta cuja
  //    referencia ja conhecemos (topo -> baixo). Sem BetTrackr (dry-run) le so
  //    a primeira pagina, para nao varrer o historico inteiro a toa.
  const ended = await fetchBetclicBets(login.token, "ended", {
    maxPages: dryRun ? 1 : 250,
    stopWhen: deps.bettrackr
      ? (bet) => {
          const ref = refOf(bet);
          return ref ? known.has(`betclic:${ref}`) : false;
        }
      : undefined,
    onPage: ({ lidas, parou }) => log(`  lidas ${lidas}${parou ? " (parou numa ja conhecida)" : ""}`),
  });
  log(`${ended.length} aposta(s) lidas da Betclic`);

  // 4. Mapear e filtrar as que ja existem (rede extra alem da paragem).
  const mapped = mapBets(ended);
  const novas = mapped.filter((b: any) => {
    const key = b?.metadata?.importKey;
    return key ? !known.has(String(key)) : true;
  });
  log(`${novas.length} aposta(s) novas`);

  // 5. Enviar (ou imprimir, em dry-run).
  let enviadas = 0;
  if (dryRun) {
    for (const b of novas.slice(0, 5)) {
      const legs = Array.isArray(b.selections) ? b.selections.length : 0;
      log(`  [dry] ${b.metadata?.importKey}  ${b.stake}@${b.odd}  ${b.status}  ${legs} perna(s)`);
    }
    if (novas.length > 5) log(`  [dry] ... e mais ${novas.length - 5}`);
  } else if (novas.length > 0) {
    // Em lotes de 500, como a extensao, para nao passar o limite de 1000.
    for (let i = 0; i < novas.length; i += 500) {
      const lote = novas.slice(i, i + 500);
      const r = await pushBets(deps.bettrackr!, lote);
      if (!r.ok) throw new Error(`envio ao BetTrackr falhou (${r.status}): ${r.body.slice(0, 200)}`);
      enviadas += lote.length;
    }
    log(`${enviadas} aposta(s) enviadas ao BetTrackr`);
  }

  return {
    accessToken: login.token,
    refreshToken: login.refreshToken,
    lidasBetclic: ended.length,
    novas: novas.length,
    enviadas,
    dryRun,
  };
}
