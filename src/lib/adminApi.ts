// src/lib/adminApi.ts
// Cliente das rotas /api/admin. Todas exigem role = 'admin' no servidor —
// nada aqui dá permissões, só apresenta o que o servidor deixa fazer.

import { authFetch, parseJsonResponse } from "./authApi";
import type { SubscriptionSnapshot } from "./billingApi";
import { mapBetFromApi } from "./betsApi";
import type { Bet } from "../types";

export type AdminUserFilter =
  | "all"
  | "entitled"
  | "blocked"
  | "paying"
  | "granted"
  | "trial"
  | "admins";

export interface AdminUser {
  id: string;
  username: string | null;
  email: string;
  role: "user" | "admin" | "founder";
  language: string | null;
  createdAt: string;
  betsCount: number;
  hasStripeCustomer: boolean;
  entitled: boolean;
  accessSource: "admin" | "subscription" | "trial" | "none";
  trialEndsAt: string | null;
  trialActive: boolean;
  subscription: SubscriptionSnapshot | null;
}

export interface AdminOverview {
  users: number;
  admins: number;
  new_users_30d: number;
  entitled: number;
  paying: number;
  granted: number;
  past_due: number;
  on_trial: number;
  mrr_cents: number;
  bets: number;
  currency: string;
}

export interface AdminAuditEntry {
  id: string;
  adminUsername: string | null;
  action: string;
  targetUsername: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface AdminUsersPage {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

async function call<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await authFetch(path, options);
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data as T;
}

export function fetchOverview(): Promise<AdminOverview> {
  return call<AdminOverview>("/api/admin/overview");
}

export function fetchUsers(params: {
  search?: string;
  filter?: AdminUserFilter;
  page?: number;
  pageSize?: number;
}): Promise<AdminUsersPage> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.filter && params.filter !== "all") query.set("filter", params.filter);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  const suffix = query.toString();
  return call<AdminUsersPage>(`/api/admin/users${suffix ? `?${suffix}` : ""}`);
}

export function fetchAuditLog(limit = 30): Promise<{ entries: AdminAuditEntry[] }> {
  return call<{ entries: AdminAuditEntry[] }>(`/api/admin/audit?limit=${limit}`);
}

function post<T>(path: string, method: string, body?: unknown): Promise<T> {
  return call<T>(path, { method, body: JSON.stringify(body ?? {}) });
}

export function setUserRole(id: string, role: "user" | "admin"): Promise<{ user: AdminUser | null }> {
  return post(`/api/admin/users/${id}/role`, "PATCH", { role });
}

// ------------------------------------------------------------
// Perfil de um membro: as apostas dele, para o fundador ver as mesmas
// estatísticas que o social dá de um amigo. Só o fundador — o servidor
// responde 403 a um administrador (ver requireFounder).
// ------------------------------------------------------------
export interface MemberProfileData {
  user: { id: string; username: string | null; email: string; created_at: string };
  bets: Bet[];
}

export async function fetchMemberBets(id: string): Promise<MemberProfileData> {
  const res = await authFetch(`/api/admin/users/${id}/bets`);
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data?.error || "Erro ao obter o perfil do membro.");
  return {
    user: data.user,
    bets: (data.bets as any[]).map(mapBetFromApi),
  };
}

/** days = 0 termina o período experimental já. */
export function setUserTrial(id: string, days: number): Promise<{ user: AdminUser | null }> {
  return post(`/api/admin/users/${id}/trial`, "PATCH", { days });
}

/** months = 0 concede acesso sem data de fim. */
export function grantSubscription(
  id: string,
  months: number,
  note?: string,
): Promise<{ user: AdminUser | null }> {
  return post(`/api/admin/users/${id}/subscription`, "PUT", { months, note });
}

export function revokeSubscription(id: string): Promise<{ user: AdminUser | null }> {
  return post(`/api/admin/users/${id}/subscription`, "DELETE");
}

export function deleteUser(id: string): Promise<{ success: boolean }> {
  return post(`/api/admin/users/${id}`, "DELETE");
}
