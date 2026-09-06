// index.ts - o daemon do bot. De hora a hora: uma passagem de sincronizacao.
//
// Encadeamento do token: cada login por passkey devolve um access_token (~2h);
// como o ciclo corre de hora a hora, esse token esta sempre fresco para servir
// de contexto ao login seguinte. So o ARRANQUE precisa de um token de contexto
// dado de fora (BETCLIC_CONTEXT_TOKEN) - depois auto-sustenta-se.
//
// Regras de disciplina (ver o plano):
//   - So leitura na Betclic; escrita so na conta do proprio dono no BetTrackr.
//   - Falha fechada: 401/403 param o daemon (nao repetem em ciclo apertado).
//   - Backoff exponencial nos outros erros.
//   - Corre em casa (Raspberry Pi/PC), nunca na nuvem - ver README.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SoftCredential, fromB64any } from "./softAuthenticator.js";
import { loadVault, vaultToCredential, saveSession, loadSession } from "./vault.js";
import { syncOnce } from "./sync.js";
import { isUsable } from "./jwt.js";
import { BettrackrConfig, heartbeat, fetchContextToken, fetchFreshToken } from "./bettrackr.js";

interface Config {
  vaultPath: string;
  keyfilePath: string;
  sessionPath: string;
  bettrackr?: BettrackrConfig;
  bootstrapToken: string | null;
  intervalSec: number;
  once: boolean;
}

function loadConfig(): Config {
  const base = process.env.BETTRACKR_BASE;
  const token = process.env.BETTRACKR_TOKEN;
  return {
    vaultPath: process.env.BOT_VAULT || join(import.meta.dirname, "..", "passkey.enc"),
    keyfilePath: process.env.BOT_KEYFILE || join(import.meta.dirname, "..", "marco0-key.json"),
    sessionPath: process.env.BOT_SESSION || join(import.meta.dirname, "..", "session.enc"),
    bettrackr: base && token ? { base, token } : undefined,
    bootstrapToken: process.env.BETCLIC_CONTEXT_TOKEN || null,
    intervalSec: Number(process.env.BOT_INTERVAL_SEC) || 1800,
    once: process.argv.includes("--once"),
  };
}

// Persistir a sessao precisa da passphrase do cofre. No modo de teste (chave em
// claro, sem BETCLIC_BOT_KEY) a persistencia fica simplesmente desligada.
function hasPassphrase(): boolean {
  const p = process.env.BETCLIC_BOT_KEY;
  return !!p && p.length >= 16;
}

// Carrega a credencial: preferencia ao cofre cifrado (passkey.enc); em falta,
// aceita o marco0-key.json em claro (so para testes), com aviso.
function loadCredential(cfg: Config): { cred: SoftCredential; userHandle: Buffer } {
  if (existsSync(cfg.vaultPath)) {
    return vaultToCredential(loadVault(cfg.vaultPath));
  }
  if (existsSync(cfg.keyfilePath)) {
    console.warn(`[bot] AVISO: a usar ${cfg.keyfilePath} em claro (teste). Em producao usa o cofre cifrado.`);
    const d = JSON.parse(readFileSync(cfg.keyfilePath, "utf8"));
    return {
      cred: {
        credentialId: fromB64any(d.credentialId),
        privateKeyPem: d.privateKeyPem,
        publicKeyCose: fromB64any(d.publicKeyCose),
      },
      userHandle: fromB64any(d.userHandle),
    };
  }
  throw new Error(`sem credencial: nem ${cfg.vaultPath} nem ${cfg.keyfilePath} existem. Corre o enrolment primeiro.`);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();

async function main() {
  const cfg = loadConfig();
  const { cred, userHandle } = loadCredential(cfg);

  // O token de contexto que vai sendo encadeado. Comeca no de arranque, mas se
  // houver uma sessao guardada de uma execucao anterior e o access ainda for
  // valido, arranca sozinho com ela - sem precisar do BETCLIC_CONTEXT_TOKEN.
  let contextToken = cfg.bootstrapToken;
  if (hasPassphrase()) {
    try {
      const saved = loadSession(cfg.sessionPath);
      if (saved && isUsable(saved.accessToken)) {
        contextToken = saved.accessToken;
        console.log(`[bot] sessao anterior reutilizada (guardada em ${saved.savedAt}).`);
      } else if (saved) {
        console.log("[bot] sessao guardada expirou; a tentar a ativacao da app.");
      }
      // Token do BetTrackr rotacionado: se guardado e ainda valido, usa-o em vez
      // do BETTRACKR_TOKEN do ambiente (que so serve de arranque). Assim o env
      // pode envelhecer sem parar o bot, desde que ele corra dentro dos 7 dias.
      if (saved?.bettrackrToken && cfg.bettrackr && isUsable(saved.bettrackrToken, 300)) {
        cfg.bettrackr.token = saved.bettrackrToken;
        console.log("[bot] token do BetTrackr reutilizado da sessao (auto-renovado).");
      }
    } catch {
      // sessao ilegivel - segue para os outros arranques
    }
  }

  // Arranque frio sem token valido: em vez de exigir o BETCLIC_CONTEXT_TOKEN a
  // mao, puxa o que o admin ativou no painel /bot da app. So funciona com um
  // destino real (o token do BetTrackr autentica o pedido).
  if ((!contextToken || !isUsable(contextToken)) && cfg.bettrackr) {
    const pulled = await fetchContextToken(cfg.bettrackr);
    if (pulled && isUsable(pulled)) {
      contextToken = pulled;
      console.log("[bot] token de contexto obtido da ativacao na app (painel /bot).");
    }
  }

  console.log(`[bot] arranque. destino: ${cfg.bettrackr ? cfg.bettrackr.base : "(dry-run, so imprime)"}`);
  console.log(`[bot] intervalo: ${cfg.intervalSec}s | modo: ${cfg.once ? "uma passagem" : "continuo"}`);

  let backoffSec = 60;

  for (;;) {
    // Ultima tentativa antes de desistir: o admin pode ter (re)ativado o bot na
    // app enquanto ele estava sem token (ex.: parado > 2h). Puxa a ativacao.
    if ((!contextToken || !isUsable(contextToken)) && cfg.bettrackr) {
      const pulled = await fetchContextToken(cfg.bettrackr);
      if (pulled && isUsable(pulled)) {
        contextToken = pulled;
        console.log(`[bot] ${stamp()} token de contexto renovado pela ativacao na app.`);
      }
    }
    if (!contextToken || !isUsable(contextToken)) {
      console.error(
        `[bot] ${stamp()} sem token de contexto valido. Ativa o bot no painel /bot da app ` +
          `(ou fornece BETCLIC_CONTEXT_TOKEN). A parar - o arranque precisa de bootstrap.`,
      );
      process.exit(cfg.once ? 1 : 2);
    }

    const startedAt = new Date().toISOString();
    const t0 = Date.now();
    try {
      const r = await syncOnce({
        cred,
        userHandle,
        contextToken,
        bettrackr: cfg.bettrackr,
        log: (m) => console.log(`[bot] ${stamp()} ${m}`),
      });
      // O access_token novo passa a ser o contexto do proximo ciclo.
      contextToken = r.accessToken;
      backoffSec = 60; // reset apos sucesso
      // Auto-renova o token do BetTrackr: pede um fresco (o atual ainda e valido)
      // e passa a usa-lo. Assim o BETTRACKR_TOKEN do bot.env so serve de arranque
      // e nunca "expira" enquanto o bot correr dentro dos 7 dias. Best-effort.
      if (cfg.bettrackr) {
        const fresh = await fetchFreshToken(cfg.bettrackr);
        if (fresh) cfg.bettrackr.token = fresh;
      }
      // Persiste a sessao (cifrada) para o bot rearrancar sozinho apos um
      // reinicio. Best-effort: se falhar, nao faz a passagem falhar.
      if (hasPassphrase()) {
        try {
          saveSession(cfg.sessionPath, {
            accessToken: r.accessToken,
            refreshToken: r.refreshToken,
            savedAt: new Date().toISOString(),
            bettrackrToken: cfg.bettrackr?.token ?? null,
          });
        } catch {
          // ignora - a persistencia e conveniencia, nao critica
        }
      }
      console.log(
        `[bot] ${stamp()} passagem OK: lidas=${r.lidasBetclic} novas=${r.novas} enviadas=${r.enviadas} atualizadas=${r.atualizadas}` +
          (r.dryRun ? " (dry-run)" : ""),
      );
      // Reporta ao painel (best-effort; so quando ha destino real, nao em dry-run).
      // "imported" no painel conta escritas: novas enviadas + atualizadas.
      if (cfg.bettrackr) {
        await heartbeat(cfg.bettrackr, {
          ok: true,
          startedAt,
          durationMs: Date.now() - t0,
          read: r.lidasBetclic,
          imported: r.enviadas + r.atualizadas,
        });
      }
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (cfg.bettrackr) {
        await heartbeat(cfg.bettrackr, { ok: false, startedAt, durationMs: Date.now() - t0, error: msg });
      }
      // Falha fechada em sessao invalida: nao repetir num ciclo apertado.
      if (/\b(401|403)\b/.test(msg) || /expirad/i.test(msg)) {
        console.error(`[bot] ${stamp()} sessao invalida, a parar: ${msg}`);
        process.exit(cfg.once ? 1 : 3);
      }
      console.error(`[bot] ${stamp()} passagem falhou: ${msg}`);
      if (cfg.once) process.exit(1);
      console.log(`[bot] backoff ${backoffSec}s`);
      await sleep(backoffSec * 1000);
      backoffSec = Math.min(backoffSec * 2, cfg.intervalSec);
      continue; // tenta outra vez sem esperar o intervalo inteiro
    }

    if (cfg.once) break;
    await sleep(cfg.intervalSec * 1000);
  }
}

main().catch((e) => {
  console.error("[bot] erro fatal:", e?.message || e);
  process.exit(1);
});
