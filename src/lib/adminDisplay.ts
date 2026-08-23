// src/lib/adminDisplay.ts
// Etiquetas do painel de gestão. Está à parte dos componentes para a versão
// desktop e a mobile dizerem o mesmo - e para as chaves de tradução serem
// verificadas pelo tipo TKey num sítio só.

import type { AdminAuditEntry, AdminUser, AdminUserFilter } from "./adminApi";
import type { TFn, TKey } from "./i18n";

export const ACCESS_KEY: Record<AdminUser["accessSource"], TKey> = {
  admin: "admin.access.admin",
  subscription: "admin.access.subscription",
  trial: "admin.access.trial",
  none: "admin.access.none",
};

export const FILTERS: ReadonlyArray<{ value: AdminUserFilter; key: TKey }> = [
  { value: "all", key: "admin.filter.all" },
  { value: "entitled", key: "admin.filter.entitled" },
  { value: "blocked", key: "admin.filter.blocked" },
  { value: "paying", key: "admin.filter.paying" },
  { value: "granted", key: "admin.filter.granted" },
  { value: "trial", key: "admin.filter.trial" },
  { value: "admins", key: "admin.filter.admins" },
];

// As ações que o servidor grava no admin_audit_log (ver routes/adminRoutes.ts).
const AUDIT_KEYS: Record<string, TKey> = {
  "role.update": "admin.audit.action.role.update",
  "trial.update": "admin.audit.action.trial.update",
  "subscription.grant": "admin.audit.action.subscription.grant",
  "subscription.revoke": "admin.audit.action.subscription.revoke",
  "user.delete": "admin.audit.action.user.delete",
};

/** Frase legível para uma linha do registo de alterações. */
export function auditLine(entry: AdminAuditEntry, t: TFn): string {
  const vars = {
    admin: entry.adminUsername ?? "-",
    user: entry.targetUsername ?? "-",
    action: entry.action,
  };
  // Uma ação que ainda não tenha frase própria continua a aparecer, com o
  // nome cru - é melhor uma linha feia do que uma alteração invisível.
  return t(AUDIT_KEYS[entry.action] ?? "admin.audit.action.unknown", vars);
}

/** O cargo de fundador é intocável pela API - o painel também não o oferece. */
export function isProtected(user: AdminUser): boolean {
  return user.role === "founder";
}

export function accessTone(user: AdminUser): "ok" | "warn" | "off" {
  if (!user.entitled) return "off";
  return user.accessSource === "trial" ? "warn" : "ok";
}
