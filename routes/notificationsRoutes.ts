// routes/notificationsRoutes.ts
// A página de notificações e o registo dos telemóveis para push.
//
//   GET    /api/notifications          -> as mais recentes + quantas por ler
//   POST   /api/notifications/read     -> marca como lidas (todas, ou { ids })
//   POST   /api/notifications/devices  -> regista o token FCM deste telemóvel
//   DELETE /api/notifications/devices  -> esquece-o (ao sair da conta)
//
// Cada um só vê e mexe no que é seu: a identidade vem do JWT, nunca do corpo.
// Quem CRIA as notificações é o servidor (lib/botWatch.ts), não esta rota.

import { Router } from "express";
import pool from "../db/pool.js";
import { authenticateToken, AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { pushConfigured } from "../lib/push.js";

const router = Router();
router.use(authenticateToken);

const LIST_LIMIT = 50;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A migração 025 aplica-se à mão: até lá as tabelas não existem, e isso diz-se
// com todas as letras em vez de um 500 genérico.
const MISSING_TABLE = "42P01";
const MISSING_MIGRATION = "Falta aplicar a migração db/migrations/025_notificacoes.sql.";

function fail(res: any, error: any, message: string) {
  if (error?.code === MISSING_TABLE) {
    res.status(503).json({ error: MISSING_MIGRATION });
    return;
  }
  console.error(`[notifications] ${message}`, error);
  res.status(500).json({ error: message });
}

function present(row: any) {
  return {
    id: row.id,
    kind: row.kind,
    data: row.data ?? {},
    createdAt: row.created_at,
    readAt: row.read_at ?? null,
    resolvedAt: row.resolved_at ?? null,
    pushedAt: row.pushed_at ?? null,
  };
}

// ------------------------------------------------------------
// GET / - a lista da página, e o que ela precisa de saber sobre o push.
// ------------------------------------------------------------
router.get("/", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  try {
    const [list, unread, devices] = await Promise.all([
      pool.query(
        `SELECT id, kind, data, created_at, read_at, resolved_at, pushed_at
           FROM notifications WHERE user_id = $1
          ORDER BY created_at DESC LIMIT ${LIST_LIMIT}`,
        [userId],
      ),
      pool.query("SELECT COUNT(*)::int AS n FROM notifications WHERE user_id = $1 AND read_at IS NULL", [userId]),
      pool.query("SELECT COUNT(*)::int AS n FROM push_devices WHERE user_id = $1", [userId]),
    ]);
    res.json({
      notifications: list.rows.map(present),
      unread: unread.rows[0]?.n ?? 0,
      pushConfigured: pushConfigured(),
      devices: devices.rows[0]?.n ?? 0,
    });
  } catch (error) {
    fail(res, error, "Erro ao ler as notificações.");
  }
});

// ------------------------------------------------------------
// POST /read - { ids?: string[] }. Sem ids, marca todas.
// ------------------------------------------------------------
router.post("/read", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.filter((id: unknown): id is string => typeof id === "string" && UUID_RE.test(id))
    : null;
  try {
    if (ids) {
      await pool.query(
        "UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL AND id = ANY($2::uuid[])",
        [userId, ids],
      );
    } else {
      await pool.query("UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL", [userId]);
    }
    res.json({ success: true });
  } catch (error) {
    fail(res, error, "Erro ao marcar as notificações.");
  }
});

// Um token FCM tem ~150 a 300 caracteres; os limites só travam lixo.
function readDeviceToken(body: any): string | null {
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  return token.length >= 20 && token.length <= 4096 ? token : null;
}

// ------------------------------------------------------------
// POST /devices - { token, platform? }. Um telemóvel é de quem entrou por
// último nele: o mesmo token noutra conta muda de dono.
// ------------------------------------------------------------
router.post("/devices", async (req: AuthenticatedRequest, res) => {
  const token = readDeviceToken(req.body);
  if (!token) {
    res.status(400).json({ error: "Token de dispositivo inválido." });
    return;
  }
  const platform = req.body?.platform === "ios" ? "ios" : "android";
  try {
    await pool.query(
      `INSERT INTO push_devices (token, user_id, platform)
       VALUES ($1, $2, $3)
       ON CONFLICT (token) DO UPDATE
         SET user_id = EXCLUDED.user_id,
             platform = EXCLUDED.platform,
             last_seen_at = NOW()`,
      [token, req.user!.id, platform],
    );
    res.status(201).json({ success: true });
  } catch (error) {
    fail(res, error, "Erro ao registar o dispositivo.");
  }
});

// ------------------------------------------------------------
// DELETE /devices - { token }. Só apaga se o telemóvel for de quem pede.
// ------------------------------------------------------------
router.delete("/devices", async (req: AuthenticatedRequest, res) => {
  const token = readDeviceToken(req.body);
  if (!token) {
    res.status(400).json({ error: "Token de dispositivo inválido." });
    return;
  }
  try {
    await pool.query("DELETE FROM push_devices WHERE token = $1 AND user_id = $2", [token, req.user!.id]);
    res.json({ success: true });
  } catch (error) {
    fail(res, error, "Erro ao esquecer o dispositivo.");
  }
});

export default router;
