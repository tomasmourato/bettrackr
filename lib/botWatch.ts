// lib/botWatch.ts
// O vigia do bot da Betclic: descobre quem está sem passagens COM SUCESSO há
// mais de 1 hora, abre-lhe UM alerta (a página de notificações) e manda-lhe o
// push. Corre no servidor, chamado de 10 em 10 minutos pelo pg_cron
// (db/cron/bot-watch.sql) - o bot parado é justamente quem não pode avisar.
//
// Porquê "sem sucesso" e não "sem passagens": a 12/09/2026 o bot continuou a
// correr de 30 em 30 minutos, a falhar em todas com "sem token de contexto
// valido" - o telemóvel estava bem, a sessão da Betclic é que tinha caducado.
// Um vigia que só contasse passagens nunca teria avisado.
//
// Um alerta por PARAGEM: o índice único parcial da migração 025 deixa haver no
// máximo um em aberto por utilizador, por isso as passagens seguintes do vigia
// não repetem o push. O alerta fecha-se sozinho na primeira passagem com
// sucesso (POST /api/bot/heartbeat), e o vigia fecha-o também, por segurança.
//
// Na mesma passagem vigia também o agente de CLV (runClvAgentWatch, mais abaixo).

import pool from "../db/pool.js";
import { CLV_AGENT_STALL_AFTER_MS } from "./clvAgentHealth.js";
import { pushConfigured, sendPush } from "./push.js";

/** Sem sucesso há mais do que isto = bot parado. O bot corre de 30 em 30 min. */
export const STALL_AFTER_MS = 60 * 60 * 1000;

/** Só se vigia quem usou o bot nesta janela: quem o largou há semanas não quer alertas. */
const ACTIVE_WINDOW = "7 days";

/**
 * failing - o bot corre, mas nenhuma passagem acaba bem (sessão expirada, etc.).
 * silent  - o bot nem sequer reporta (telemóvel, Termux ou cron parados).
 */
export type StallState = "failing" | "silent";

export interface BotActivity {
  lastRunAt: Date | null;
  lastOkAt: Date | null;
  /** A primeira passagem dentro da janela vigiada. */
  firstRunAt: Date | null;
  /** O erro da última passagem, quando ela falhou. */
  lastError: string | null;
}

/** Desde quando não há sucesso: a última passagem boa, ou - para quem nunca teve nenhuma - a primeira. */
function semSucessoDesde(activity: BotActivity): Date | null {
  return activity.lastOkAt ?? activity.firstRunAt ?? activity.lastRunAt;
}

/**
 * O estado do bot, ou null se está bem (ou ainda é cedo para o dizer).
 * failingLimitMs é quanto tempo a falhar, ainda a reportar, conta como parado;
 * por omissão o mesmo limite do silêncio.
 */
export function stallState(
  activity: BotActivity,
  now: number,
  limitMs = STALL_AFTER_MS,
  failingLimitMs = limitMs,
): StallState | null {
  const desde = semSucessoDesde(activity);
  if (!activity.lastRunAt || !desde) return null;
  const semSucesso = now - desde.getTime();
  if (now - activity.lastRunAt.getTime() > limitMs) return semSucesso > limitMs ? "silent" : null;
  // Um bot acabado de instalar e a falhar há 10 minutos ainda não é um bot parado.
  return semSucesso > failingLimitMs ? "failing" : null;
}

/**
 * O erro do bot sem os ids das contas e sem repetições:
 * "99276a88: sem token ... | e64ba1fa: sem token ..." -> "sem token ...".
 */
export function summarizeBotError(error: string | null | undefined, max = 160): string | null {
  if (!error) return null;
  const partes = error
    .split(" | ")
    .map((parte) => parte.replace(/^[0-9a-f]{8}: /i, "").trim())
    .filter(Boolean);
  const texto = [...new Set(partes)].join("; ");
  if (!texto) return null;
  return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
}

type Lang = "pt" | "en";

/** "45 min", "1 h 20 min", "5 h", "3 dias". */
export function formatDuration(ms: number, lang: Lang): string {
  const minutos = Math.max(1, Math.round(ms / 60_000));
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 48) {
    const resto = minutos % 60;
    return horas < 6 && resto >= 5 ? `${horas} h ${resto} min` : `${horas} h`;
  }
  const dias = Math.floor(horas / 24);
  return lang === "en" ? `${dias} days` : `${dias} dias`;
}

/**
 * O texto do PUSH, no idioma do dono. Vive aqui e não no dicionário do cliente
 * porque quem o escreve é o servidor, com a app fechada. A página de
 * notificações não o usa: forma a frase dela no cliente, a partir dos dados.
 */
export function botAlertText(state: StallState, activity: BotActivity, now: number, lang: Lang) {
  const desde = semSucessoDesde(activity);
  const semSucesso = formatDuration(desde ? now - desde.getTime() : 0, lang);
  const calado = formatDuration(activity.lastRunAt ? now - activity.lastRunAt.getTime() : 0, lang);
  const erro = summarizeBotError(activity.lastError);

  if (lang === "en") {
    return {
      title: "The Betclic bot stopped",
      body:
        state === "failing"
          ? `No successful import for ${semSucesso}.${erro ? ` Last error: ${erro}` : ""}`
          : `The bot hasn't reported for ${calado}. The phone may have stopped Termux.`,
    };
  }
  return {
    title: "O bot da Betclic parou",
    body:
      state === "failing"
        ? `Sem importações com sucesso há ${semSucesso}.${erro ? ` Último erro: ${erro}` : ""}`
        : `O bot não reporta há ${calado}. O telemóvel pode ter parado o Termux.`,
  };
}

/** O separador onde a app abre o alerta: a página de notificações vive na Gestão. */
export function alertTabFor(role: string): "ADMIN" | "BOT" {
  return role === "admin" || role === "founder" ? "ADMIN" : "BOT";
}

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

export interface WatchSummary {
  checked: number;
  alerted: number;
  resolved: number;
  pushed: number;
  pushConfigured: boolean;
}

/** Uma passagem do vigia. Atira só se a base de dados falhar. */
export async function runBotWatch(now = Date.now()): Promise<WatchSummary> {
  const { rows } = await pool.query(
    `SELECT r.user_id, u.role, u.language,
            MAX(r.started_at) AS last_run_at,
            MAX(r.started_at) FILTER (WHERE r.ok) AS last_ok_at,
            MIN(r.started_at) FILTER (WHERE r.started_at > NOW() - INTERVAL '${ACTIVE_WINDOW}') AS first_run_at,
            (SELECT r2.error FROM bot_runs r2
              WHERE r2.user_id = r.user_id ORDER BY r2.started_at DESC LIMIT 1) AS last_error,
            (SELECT n.id FROM notifications n
              WHERE n.user_id = r.user_id AND n.kind = 'bot_stalled' AND n.resolved_at IS NULL
              LIMIT 1) AS open_alert_id
       FROM bot_runs r
       JOIN users u ON u.id = r.user_id
      WHERE u.role IN ('admin', 'founder', 'botuser')
      GROUP BY r.user_id, u.role, u.language
     HAVING MAX(r.started_at) > NOW() - INTERVAL '${ACTIVE_WINDOW}'`,
  );

  const summary: WatchSummary = {
    checked: rows.length,
    alerted: 0,
    resolved: 0,
    pushed: 0,
    pushConfigured: pushConfigured(),
  };

  for (const row of rows) {
    const activity: BotActivity = {
      lastRunAt: toDate(row.last_run_at),
      lastOkAt: toDate(row.last_ok_at),
      firstRunAt: toDate(row.first_run_at),
      lastError: row.last_error ?? null,
    };
    const state = stallState(activity, now);

    if (!state) {
      if (row.open_alert_id) {
        await pool.query("UPDATE notifications SET resolved_at = NOW() WHERE id = $1 AND resolved_at IS NULL", [
          row.open_alert_id,
        ]);
        summary.resolved++;
      }
      continue;
    }
    // Já se avisou desta paragem.
    if (row.open_alert_id) continue;

    const data = {
      state,
      lastSuccessAt: activity.lastOkAt?.toISOString() ?? null,
      lastRunAt: activity.lastRunAt?.toISOString() ?? null,
      lastError: summarizeBotError(activity.lastError),
    };
    const inserted = await pool.query(
      `INSERT INTO notifications (user_id, kind, data)
       VALUES ($1, 'bot_stalled', $2::jsonb)
       ON CONFLICT (user_id) WHERE kind = 'bot_stalled' AND resolved_at IS NULL DO NOTHING
       RETURNING id`,
      [row.user_id, JSON.stringify(data)],
    );
    const notificationId = inserted.rows[0]?.id;
    // Outra passagem do vigia chegou primeiro.
    if (!notificationId) continue;
    summary.alerted++;

    try {
      const sent = await pushBotAlert(row, notificationId, state, activity, now);
      if (sent > 0) {
        summary.pushed++;
        await pool.query("UPDATE notifications SET pushed_at = NOW() WHERE id = $1", [notificationId]);
      }
    } catch (error: any) {
      // O alerta já está na página; um push que falha não o desfaz.
      console.warn("[bot-watch] push falhou:", error?.message);
    }
  }

  return summary;
}

async function pushBotAlert(
  row: { user_id: string; role: string; language: string | null },
  notificationId: string,
  state: StallState,
  activity: BotActivity,
  now: number,
): Promise<number> {
  const lang: Lang = row.language === "en" ? "en" : "pt";
  return pushToUser(row.user_id, {
    ...botAlertText(state, activity, now, lang),
    data: { kind: "bot_stalled", notificationId: String(notificationId), tab: alertTabFor(row.role) },
  });
}

/** Manda um alerta aos telemóveis de UM utilizador e esquece os que o FCM dá como mortos. */
async function pushToUser(
  userId: string,
  message: { title: string; body: string; data: Record<string, string> },
): Promise<number> {
  if (!pushConfigured()) return 0;
  const devices = await pool.query("SELECT token FROM push_devices WHERE user_id = $1", [userId]);
  if (devices.rows.length === 0) return 0;

  const result = await sendPush(
    devices.rows.map((device) => String(device.token)),
    message,
  );
  if (result.dead.length > 0) {
    await pool.query("DELETE FROM push_devices WHERE token = ANY($1::text[])", [result.dead]);
  }
  return result.sent;
}

// ============================================================
// O agente de CLV
//
// O mesmo vigia, a mesma pergunta, para o agente da odd de fecho
// (agent/clv-agent.ts). A 11/10/2026 às 03:35 o agente deixou de reportar e
// ficou uma semana calado sem ninguém saber: o bot tinha alerta, ele não.
//
// Diferenças em relação ao bot:
//  - há UM agente para o serviço todo, sem dono (clv_agent_runs não tem
//    user_id), por isso o alerta vai para o staff - é quem o pode religar;
//  - corre de 5 em 5 minutos e não de 30 em 30, por isso o limite do silêncio
//    é meia hora (CLV_AGENT_STALL_AFTER_MS, partilhado com o painel), e o de
//    passagens a falhar é uma hora (CLV_AGENT_FAILING_AFTER_MS);
//  - só conta a captura: a passagem de madrugada corre uma vez por dia.
//
// Sem a migração 026 não há passagens para vigiar e isto não faz nada.
// ============================================================

export const CLV_ALERT_KIND = "clv_agent_stalled";

/**
 * A reportar mas sem sucesso há mais do que isto = agente parado. É o dobro do
 * silêncio porque um jogo cuja página não se lê (adiado, retirado) faz falhar
 * todas as passagens da janela dele - de 30 a 5 minutos antes do apito, meia
 * hora certa entre duas passagens boas - sem que o agente tenha nada de errado.
 */
export const CLV_AGENT_FAILING_AFTER_MS = 60 * 60 * 1000;

/** O texto do PUSH do agente parado, no idioma de quem o recebe. */
export function clvAgentAlertText(state: StallState, activity: BotActivity, now: number, lang: Lang) {
  const desde = semSucessoDesde(activity);
  const semSucesso = formatDuration(desde ? now - desde.getTime() : 0, lang);
  const calado = formatDuration(activity.lastRunAt ? now - activity.lastRunAt.getTime() : 0, lang);
  const erro = summarizeBotError(activity.lastError);

  if (lang === "en") {
    return {
      title: "The CLV agent stopped",
      body:
        state === "failing"
          ? `No successful pass for ${semSucesso}.${erro ? ` Last error: ${erro}` : ""}`
          : `The agent hasn't reported for ${calado}. No bet is getting a closing odd.`,
    };
  }
  return {
    title: "O agente de CLV parou",
    body:
      state === "failing"
        ? `Sem passagens com sucesso há ${semSucesso}.${erro ? ` Último erro: ${erro}` : ""}`
        : `O agente não reporta há ${calado}. Nenhuma aposta está a receber odd de fecho.`,
  };
}

export interface ClvWatchSummary {
  /** null = sem passagens para vigiar (agente nunca ligado, ou sem a migração 026). */
  state: StallState | "ok" | null;
  alerted: number;
  resolved: number;
  pushed: number;
}

/** Uma passagem do vigia do agente. Atira só se a base de dados falhar. */
export async function runClvAgentWatch(now = Date.now()): Promise<ClvWatchSummary> {
  const summary: ClvWatchSummary = { state: null, alerted: 0, resolved: 0, pushed: 0 };

  let row: any;
  try {
    const result = await pool.query(
      `SELECT MAX(started_at) AS last_run_at,
              MAX(started_at) FILTER (WHERE ok) AS last_ok_at,
              MIN(started_at) AS first_run_at,
              (SELECT r2.error FROM clv_agent_runs r2
                WHERE r2.kind = 'capture' ORDER BY r2.started_at DESC LIMIT 1) AS last_error
         FROM clv_agent_runs
        WHERE kind = 'capture'`,
    );
    row = result.rows[0];
  } catch (error: any) {
    // 42P01: a migração 026 ainda não foi aplicada - o agente nem tem onde reportar.
    if (error?.code === "42P01") return summary;
    throw error;
  }

  const activity: BotActivity = {
    lastRunAt: toDate(row?.last_run_at),
    lastOkAt: toDate(row?.last_ok_at),
    firstRunAt: toDate(row?.first_run_at),
    lastError: row?.last_error ?? null,
  };
  if (!activity.lastRunAt) return summary;

  const state = stallState(activity, now, CLV_AGENT_STALL_AFTER_MS, CLV_AGENT_FAILING_AFTER_MS);
  if (!state) {
    summary.state = "ok";
    // Só fecha o alerta uma captura com sucesso posterior a ele. "Ainda é cedo
    // para o dizer" não chega: um agente que volta a falhar depois de uma
    // semana calado perdeu na poda a última passagem boa, e parecia acabado de
    // instalar.
    if (activity.lastOkAt) {
      const resolved = await pool.query(
        "UPDATE notifications SET resolved_at = NOW() WHERE kind = $1 AND resolved_at IS NULL AND created_at < $2",
        [CLV_ALERT_KIND, activity.lastOkAt],
      );
      summary.resolved = resolved.rowCount ?? 0;
    }
    return summary;
  }
  summary.state = state;

  const data = {
    state,
    lastSuccessAt: activity.lastOkAt?.toISOString() ?? null,
    lastRunAt: activity.lastRunAt.toISOString(),
    lastError: summarizeBotError(activity.lastError),
  };

  // Um alerta por paragem e por pessoa do staff. A migração 025 só tem índice
  // único para o 'bot_stalled', por isso a exclusão é feita aqui: o trinco
  // serializa duas passagens do vigia que se cruzem, e o NOT EXISTS só deixa
  // entrar quem ainda não tem o alerta em aberto.
  const client = await pool.connect();
  let inserted: Array<{ id: string; user_id: string; role: string; language: string | null }> = [];
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [CLV_ALERT_KIND]);
    const result = await client.query(
      `WITH novos AS (
         INSERT INTO notifications (user_id, kind, data)
         SELECT u.id, $1, $2::jsonb
           FROM users u
          WHERE u.role IN ('admin', 'founder')
            AND NOT EXISTS (
              SELECT 1 FROM notifications n
               WHERE n.user_id = u.id AND n.kind = $1 AND n.resolved_at IS NULL)
         RETURNING id, user_id
       )
       SELECT novos.id, novos.user_id, u.role, u.language
         FROM novos JOIN users u ON u.id = novos.user_id`,
      [CLV_ALERT_KIND, JSON.stringify(data)],
    );
    await client.query("COMMIT");
    inserted = result.rows;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
  summary.alerted = inserted.length;

  for (const alert of inserted) {
    try {
      const lang: Lang = alert.language === "en" ? "en" : "pt";
      const sent = await pushToUser(alert.user_id, {
        ...clvAgentAlertText(state, activity, now, lang),
        data: { kind: CLV_ALERT_KIND, notificationId: String(alert.id), tab: alertTabFor(alert.role) },
      });
      if (sent > 0) {
        summary.pushed++;
        await pool.query("UPDATE notifications SET pushed_at = NOW() WHERE id = $1", [alert.id]);
      }
    } catch (error: any) {
      // O alerta já está na página; um push que falha não o desfaz.
      console.warn("[clv-watch] push falhou:", error?.message);
    }
  }

  return summary;
}

/**
 * Uma passagem de captura com sucesso fecha o alerta do agente. Nunca atira: é
 * chamado do heartbeat do agente, que não pode falhar por causa disto.
 */
export async function resolveClvAgentAlert(): Promise<void> {
  try {
    await pool.query("UPDATE notifications SET resolved_at = NOW() WHERE kind = $1 AND resolved_at IS NULL", [
      CLV_ALERT_KIND,
    ]);
  } catch (error: any) {
    // 42P01: a migração 025 ainda não foi aplicada - sem tabela não há alertas.
    if (error?.code !== "42P01") console.warn("[clv-watch] não fechou o alerta:", error?.message);
  }
}

/**
 * A primeira passagem com sucesso fecha o alerta em aberto. Nunca atira: é
 * chamado do heartbeat do bot, que não pode falhar por causa disto.
 */
export async function resolveBotAlert(userId: string): Promise<void> {
  try {
    await pool.query(
      "UPDATE notifications SET resolved_at = NOW() WHERE user_id = $1 AND kind = 'bot_stalled' AND resolved_at IS NULL",
      [userId],
    );
  } catch (error: any) {
    // 42P01: a migração 025 ainda não foi aplicada - sem tabela não há alertas.
    if (error?.code !== "42P01") console.warn("[bot-watch] não fechou o alerta:", error?.message);
  }
}
