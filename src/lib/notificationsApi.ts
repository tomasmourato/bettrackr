// src/lib/notificationsApi.ts
// Cliente da rota /api/notifications: a lista da página de notificações e o
// registo do telemóvel para push. Ver routes/notificationsRoutes.ts.

import { apiError } from "./apiError";
import { authFetch, parseJsonResponse } from "./authApi";

/** failing = o bot corre mas falha; silent = o bot nem reporta. Ver lib/botWatch.ts. */
export type BotStallState = "failing" | "silent";

/** Os dados de uma notificação "bot_stalled", tal como o vigia os grava. */
export interface BotStalledData {
  state: BotStallState;
  lastSuccessAt: string | null;
  lastRunAt: string | null;
  lastError: string | null;
}

export interface AppNotification {
  id: string;
  kind: string;
  data: Record<string, unknown>;
  createdAt: string;
  readAt: string | null;
  resolvedAt: string | null;
  pushedAt: string | null;
}

export interface NotificationsPage {
  notifications: AppNotification[];
  unread: number;
  /** O servidor sabe mandar push (FCM_SERVICE_ACCOUNT definida)? */
  pushConfigured: boolean;
  /** Quantos telemóveis de quem pede estão registados para push. */
  devices: number;
}

export async function fetchNotifications(): Promise<NotificationsPage> {
  const res = await authFetch("/api/notifications");
  const data = await parseJsonResponse(res);
  if (!res.ok) throw apiError(data, res, "notif.loadError");
  return data as NotificationsPage;
}

/** Sem ids, marca todas. */
export async function markNotificationsRead(ids?: string[]): Promise<void> {
  const res = await authFetch("/api/notifications/read", {
    method: "POST",
    body: JSON.stringify(ids ? { ids } : {}),
  });
  if (!res.ok) throw apiError(await parseJsonResponse(res), res, "notif.loadError");
}

export async function registerPushDevice(token: string): Promise<void> {
  const res = await authFetch("/api/notifications/devices", {
    method: "POST",
    body: JSON.stringify({ token, platform: "android" }),
  });
  if (!res.ok) throw apiError(await parseJsonResponse(res), res, "notif.loadError");
}

export async function unregisterPushDevice(token: string): Promise<void> {
  const res = await authFetch("/api/notifications/devices", {
    method: "DELETE",
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw apiError(await parseJsonResponse(res), res, "notif.loadError");
}
