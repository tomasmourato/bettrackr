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

import pool from "../db/pool.js";
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

/** O estado do bot, ou null se está bem (ou ainda é cedo para o dizer). */
export function stallState(activity: BotActivity, now: number, limitMs = STALL_AFTER_MS): StallState | null {
  const desde = semSucessoDesde(activity);
  if (!activity.lastRunAt || !desde) return null;
  // Um bot acabado de instalar e a falhar há 10 minutos ainda não é um bot parado.
  if (now - desde.getTime() <= limitMs) return null;
  return now - activity.lastRunAt.getTime() <= limitMs ? "failing" : "silent";
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
  if (!pushConfigured()) return 0;
  const devices = await pool.query("SELECT token FROM push_devices WHERE user_id = $1", [row.user_id]);
  if (devices.rows.length === 0) return 0;

  const lang: Lang = row.language === "en" ? "en" : "pt";
  const result = await sendPush(
    devices.rows.map((device) => String(device.token)),
    {
      ...botAlertText(state, activity, now, lang),
      data: { kind: "bot_stalled", notificationId: String(notificationId), tab: alertTabFor(row.role) },
    },
  );
  if (result.dead.length > 0) {
    await pool.query("DELETE FROM push_devices WHERE token = ANY($1::text[])", [result.dead]);
  }
  return result.sent;
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
