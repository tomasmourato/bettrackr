// index.ts - o daemon do bot. A cada passagem: uma sincronizacao completa de
// TODAS as contas Betclic ativadas pelo dono (um dono pode ter varias).
//
// MULTI-CONTA (ver db/migrations/024): a ativacao na app e por conta. O bot puxa
// a lista de ativacoes (fetchActivations) e trata cada conta em separado, com o
// seu proprio cofre e sessao no disco: passkey-<accountId>.enc e
// session-<accountId>.enc. Cada conta importa para a bookie_account certa
// (etiqueta accountId nas apostas).
//
// Encadeamento do token: cada login por passkey devolve um access_token (~2h);
// como o ciclo corre com frequencia, esse token esta sempre fresco para servir
// de contexto ao login seguinte. So o ARRANQUE de cada conta precisa de um token
// de contexto dado de fora - e esse vem da ativacao na app (painel /bot).
//
// Enrolment AUTOMATICO por conta: se nao houver passkey local para uma conta, ou
// se a passkey tiver sido apagada na Betclic (o login falha) e houver ativacao,
// o bot cria/recria a passkey sozinho. A chave privada nasce e fica no
// dispositivo - nunca passa pelo servidor.
//
// Regras de disciplina (ver o plano):
//   - So leitura na Betclic; escrita so na conta do proprio dono no BetTrackr.
//   - ISOLAMENTO DE FALHAS: um erro (incl. 401/403) numa conta pausa SO essa
//     conta nesta passagem; o ciclo segue para as outras e o daemon nao sai.
//   - Backoff exponencial so quando a passagem inteira rebenta (ex.: rede).
//   - Corre em casa (telemovel/Raspberry Pi/PC), nunca na nuvem - ver README.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { SoftCredential, fromB64any } from "./softAuthenticator.js";
import { loadVault, vaultToCredential, saveVault, credentialToVault, saveSession, loadSession } from "./vault.js";
import { syncOnce } from "./sync.js";
import { isUsable } from "./jwt.js";
import { enrolPasskey } from "./enrol.js";
import { BettrackrConfig, heartbeat, fetchActivations, fetchFreshToken, deleteContextToken } from "./bettrackr.js";

interface Config {
  botDir: string; // pasta onde vivem os cofres/sessoes por conta
  keyfilePath: string; // credencial em claro (so dry-run/teste)
  legacyVaultPath: string; // passkey.enc antigo (so dry-run)
  bettrackr?: BettrackrConfig;
  bootstrapToken: string | null; // BETCLIC_CONTEXT_TOKEN (so dry-run)
  intervalSec: number;
  once: boolean;
}

type Credential = { cred: SoftCredential; userHandle: Buffer };

function loadConfig(): Config {
  const base = process.env.BETTRACKR_BASE;
  const token = process.env.BETTRACKR_TOKEN;
  const botDir = process.env.BOT_DIR || join(import.meta.dirname, "..");
  return {
    botDir,
    keyfilePath: process.env.BOT_KEYFILE || join(botDir, "marco0-key.json"),
    legacyVaultPath: process.env.BOT_VAULT || join(botDir, "passkey.enc"),
    bettrackr: base && token ? { base, token } : undefined,
    bootstrapToken: process.env.BETCLIC_CONTEXT_TOKEN || null,
    intervalSec: Number(process.env.BOT_INTERVAL_SEC) || 1800,
    once: process.argv.includes("--once"),
  };
}

// Caminhos por conta na pasta do bot.
const vaultPathFor = (dir: string, accountId: string) => join(dir, `passkey-${accountId}.enc`);
const sessionPathFor = (dir: string, accountId: string) => join(dir, `session-${accountId}.enc`);

// Persistir a sessao e a passkey precisa da passphrase do cofre. No modo de teste
// (chave em claro, sem BETCLIC_BOT_KEY) a persistencia fica desligada.
function hasPassphrase(): boolean {
  const p = process.env.BETCLIC_BOT_KEY;
  return !!p && p.length >= 16;
}

// Contas com cofre local (passkey-<id>.enc) - as que ja foram enroladas alguma
// vez. Continuam a andar pela sessao guardada mesmo sem ativacao fresca.
function discoverLocalAccounts(dir: string): string[] {
  try {
    return readdirSync(dir)
      .map((f) => /^passkey-(.+)\.enc$/.exec(f)?.[1])
      .filter((x): x is string => !!x);
  } catch {
    return [];
  }
}

// Recupera um token do BetTrackr fresco guardado numa sessao anterior (qualquer
// conta serve - o token e do dono, nao da conta). Permite arrancar mesmo que o
// BETTRACKR_TOKEN do ambiente ja tenha envelhecido, desde que uma passagem tenha
// corrido dentro dos 7 dias.
function recoverBettrackrToken(dir: string, accountIds: string[]): string | null {
  if (!hasPassphrase()) return null;
  for (const id of accountIds) {
    try {
      const s = loadSession(sessionPathFor(dir, id));
      if (s?.bettrackrToken && isUsable(s.bettrackrToken, 300)) return s.bettrackrToken;
    } catch {
      // sessao ilegivel - tenta a proxima
    }
  }
  return null;
}

// Cria a passkey na Betclic com o token de contexto e guarda-a no cofre da conta.
// O nome do dispositivo leva um pedaco do accountId para distinguir as passkeys
// em betclic.pt/account/security quando ha varias contas.
async function enrolAndSave(cfg: Config, accountId: string, contextToken: string): Promise<Credential> {
  const deviceName = `BetTrackr Bot (${accountId.slice(0, 8)})`;
  const enrolled = await enrolPasskey(contextToken, deviceName);
  saveVault(vaultPathFor(cfg.botDir, accountId), credentialToVault(enrolled.cred, enrolled.userHandle));
  return enrolled;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();

// Estado por conta guardado em memoria entre passagens (evita reler/decifrar o
// cofre a cada ciclo e mantem o access_token encadeado).
interface AccountRuntime {
  cred: Credential;
  context: string | null; // access_token encadeado da passagem anterior
}

interface PassOutcome {
  accountId: string;
  ok: boolean;
  read: number;
  imported: number;
  error?: string;
}

// Trata UMA conta numa passagem. Nunca atira: devolve o resultado (ok/erro) para
// a passagem agregar. Um erro aqui nao pode parar as outras contas.
async function processAccount(
  cfg: Config,
  accountId: string,
  activationToken: string | undefined,
  runtimes: Map<string, AccountRuntime>,
  log: (m: string) => void,
): Promise<PassOutcome> {
  const tag = accountId.slice(0, 8);
  let rt = runtimes.get(accountId);

  // Contexto para o login: sessao encadeada em memoria, senao a guardada no
  // disco, senao o token da ativacao (arranque frio).
  let context = rt?.context && isUsable(rt.context) ? rt.context : null;
  if (!context) {
    try {
      const saved = loadSession(sessionPathFor(cfg.botDir, accountId));
      if (saved && isUsable(saved.accessToken)) context = saved.accessToken;
    } catch {
      // sessao ilegivel - segue para a ativacao
    }
  }
  if (!context && activationToken && isUsable(activationToken)) context = activationToken;

  // Credencial: memoria -> cofre -> enrolment automatico (se houver ativacao).
  let cred = rt?.cred ?? null;
  if (!cred) {
    const vp = vaultPathFor(cfg.botDir, accountId);
    if (existsSync(vp)) {
      cred = vaultToCredential(loadVault(vp));
    }
  }
  if (!cred) {
    if (!hasPassphrase()) {
      return { accountId, ok: false, read: 0, imported: 0, error: "sem BETCLIC_BOT_KEY para criar/guardar a passkey" };
    }
    if (!activationToken || !isUsable(activationToken)) {
      // Sem passkey e sem ativacao: nada a fazer nesta conta (ainda por ativar).
      return { accountId, ok: false, read: 0, imported: 0, error: "sem passkey local e sem ativacao (ativa no painel /bot)" };
    }
    try {
      log(`[${tag}] sem passkey local - a criar uma automaticamente (enrolment)...`);
      cred = await enrolAndSave(cfg, accountId, activationToken);
      context = activationToken;
      log(`[${tag}] passkey criada e guardada (aparece em betclic.pt/account/security).`);
    } catch (e: any) {
      return { accountId, ok: false, read: 0, imported: 0, error: `enrolment falhou: ${e?.message || e}` };
    }
  }
  if (!context || !isUsable(context)) {
    return { accountId, ok: false, read: 0, imported: 0, error: "sem token de contexto valido (ativa no painel /bot)" };
  }
  if (!cred) {
    // Defensivo: os ramos acima ou atribuem cred ou saem. Guarda para o TS e
    // para nao rebentar caso algo mude.
    return { accountId, ok: false, read: 0, imported: 0, error: "sem passkey (estado inesperado)" };
  }

  // Daqui para baixo o contexto e sempre uma string valida (ctx). Reatribui-se
  // no re-enrolment; o access_token de cada sync passa a ser o contexto seguinte.
  let ctx: string = context;
  runtimes.set(accountId, { cred, context: ctx });

  let reenrolled = false;
  for (;;) {
    try {
      const r = await syncOnce({
        cred: cred.cred,
        userHandle: cred.userHandle,
        contextToken: ctx,
        bettrackr: cfg.bettrackr,
        accountId,
        log: (m) => log(`[${tag}] ${m}`),
      });
      // O access_token novo serve de contexto ao proximo ciclo desta conta.
      runtimes.set(accountId, { cred, context: r.accessToken });
      if (hasPassphrase()) {
        try {
          saveSession(sessionPathFor(cfg.botDir, accountId), {
            accessToken: r.accessToken,
            refreshToken: r.refreshToken,
            savedAt: new Date().toISOString(),
            bettrackrToken: cfg.bettrackr?.token ?? null,
          });
        } catch {
          // persistencia e conveniencia, nao critica
        }
      }
      log(
        `[${tag}] OK: lidas=${r.lidasBetclic} novas=${r.novas} enviadas=${r.enviadas} atualizadas=${r.atualizadas}` +
          (r.dryRun ? " (dry-run)" : ""),
      );
      return { accountId, ok: true, read: r.lidasBetclic, imported: r.enviadas + r.atualizadas };
    } catch (err: any) {
      const msg = String(err?.message || err);
      // Re-enrolment automatico: se o LOGIN falhou e ha ativacao, a passkey pode
      // ter sido apagada na Betclic. Recria-a e repete - uma vez por passagem.
      // Consome a ativacao (DELETE) para nao repetir o registo em ciclo.
      if (!reenrolled && cfg.bettrackr && hasPassphrase() && /login por passkey falhou/.test(msg)) {
        const t: string | undefined = isUsable(ctx) ? ctx : activationToken;
        if (t && isUsable(t)) {
          try {
            log(`[${tag}] login por passkey falhou; a recriar a passkey...`);
            cred = await enrolAndSave(cfg, accountId, t);
            ctx = t;
            reenrolled = true;
            runtimes.set(accountId, { cred, context: ctx });
            await deleteContextToken(cfg.bettrackr, accountId); // consome a ativacao
            log(`[${tag}] passkey recriada; a repetir.`);
            continue;
          } catch (e2: any) {
            return { accountId, ok: false, read: 0, imported: 0, error: `re-enrolment falhou: ${e2?.message || e2}` };
          }
        }
      }
      // Qualquer outro erro (incl. 401/403): pausa SO esta conta nesta passagem.
      return { accountId, ok: false, read: 0, imported: 0, error: msg };
    }
  }
}

// Dry-run: sem destino BetTrackr. Corre uma passagem que so imprime, usando o
// cofre/keyfile legado e o BETCLIC_CONTEXT_TOKEN do ambiente. Serve para testar
// o mapeamento localmente, sem multi-conta.
async function runDryRun(cfg: Config, log: (m: string) => void): Promise<void> {
  let credential: Credential | null = null;
  if (existsSync(cfg.legacyVaultPath) && hasPassphrase()) {
    credential = vaultToCredential(loadVault(cfg.legacyVaultPath));
  } else if (existsSync(cfg.keyfilePath)) {
    const d = JSON.parse(readFileSync(cfg.keyfilePath, "utf8"));
    credential = {
      cred: {
        credentialId: fromB64any(d.credentialId),
        privateKeyPem: d.privateKeyPem,
        publicKeyCose: fromB64any(d.publicKeyCose),
      },
      userHandle: fromB64any(d.userHandle),
    };
  }
  if (!credential) {
    console.error("[bot] dry-run: sem cofre/keyfile local para testar.");
    process.exit(1);
  }
  if (!cfg.bootstrapToken || !isUsable(cfg.bootstrapToken)) {
    console.error("[bot] dry-run: define BETCLIC_CONTEXT_TOKEN com um token valido.");
    process.exit(1);
  }
  const r = await syncOnce({
    cred: credential.cred,
    userHandle: credential.userHandle,
    contextToken: cfg.bootstrapToken,
    log,
  });
  log(`dry-run OK: lidas=${r.lidasBetclic} novas=${r.novas}`);
}

async function main() {
  const cfg = loadConfig();
  const log = (m: string) => console.log(`[bot] ${stamp()} ${m}`);

  if (!cfg.bettrackr) {
    await runDryRun(cfg, log);
    return;
  }

  // Recupera um token do BetTrackr fresco de uma sessao anterior, se o do
  // ambiente ja tiver envelhecido.
  const recovered = recoverBettrackrToken(cfg.botDir, discoverLocalAccounts(cfg.botDir));
  if (recovered) {
    cfg.bettrackr.token = recovered;
    log("token do BetTrackr reutilizado de uma sessao guardada (auto-renovado).");
  }

  log(`arranque multi-conta. destino: ${cfg.bettrackr.base}`);
  log(`intervalo: ${cfg.intervalSec}s | modo: ${cfg.once ? "uma passagem" : "continuo"}`);

  const runtimes = new Map<string, AccountRuntime>();
  let backoffSec = 60;

  for (;;) {
    const startedAt = new Date().toISOString();
    const t0 = Date.now();
    try {
      // 1. Renova o token do BetTrackr para toda a passagem (best-effort).
      const fresh = await fetchFreshToken(cfg.bettrackr);
      if (fresh) cfg.bettrackr.token = fresh;

      // 2. Ativacoes por conta + contas com cofre local = conjunto a processar.
      const activations = await fetchActivations(cfg.bettrackr);
      const activationByAccount = new Map(activations.map((a) => [a.accountId, a.token]));
      const accountIds = new Set<string>([
        ...discoverLocalAccounts(cfg.botDir),
        ...activationByAccount.keys(),
      ]);

      if (accountIds.size === 0) {
        log("sem contas ativadas nem cofres locais. Ativa o bot no painel /bot (uma vez por conta).");
        if (cfg.once) process.exit(2);
        await sleep(cfg.intervalSec * 1000);
        continue;
      }

      // 3. Cada conta em separado, com isolamento de falhas.
      const outcomes: PassOutcome[] = [];
      for (const accountId of accountIds) {
        outcomes.push(
          await processAccount(cfg, accountId, activationByAccount.get(accountId), runtimes, log),
        );
      }

      // 4. Um heartbeat agregado da passagem.
      const okCount = outcomes.filter((o) => o.ok).length;
      const read = outcomes.reduce((s, o) => s + o.read, 0);
      const imported = outcomes.reduce((s, o) => s + o.imported, 0);
      const errors = outcomes.filter((o) => !o.ok).map((o) => `${o.accountId.slice(0, 8)}: ${o.error}`);
      log(`passagem: ${okCount}/${outcomes.length} conta(s) OK · lidas=${read} escritas=${imported}` + (errors.length ? ` · falhas: ${errors.join(" | ")}` : ""));
      await heartbeat(cfg.bettrackr, {
        ok: errors.length === 0,
        startedAt,
        durationMs: Date.now() - t0,
        read,
        imported,
        error: errors.length ? errors.join(" | ").slice(0, 1000) : undefined,
      });

      backoffSec = 60; // passagem completou (mesmo com falhas por conta): reset
    } catch (err: any) {
      // So chega aqui um erro da passagem INTEIRA (ex.: rede a puxar ativacoes).
      const msg = String(err?.message || err);
      await heartbeat(cfg.bettrackr, { ok: false, startedAt, durationMs: Date.now() - t0, error: msg });
      log(`passagem falhou (nivel geral): ${msg}`);
      if (cfg.once) process.exit(1);
      log(`backoff ${backoffSec}s`);
      await sleep(backoffSec * 1000);
      backoffSec = Math.min(backoffSec * 2, cfg.intervalSec);
      continue;
    }

    if (cfg.once) break;
    await sleep(cfg.intervalSec * 1000);
  }
}

main().catch((e) => {
  console.error("[bot] erro fatal:", e?.message || e);
  process.exit(1);
});
