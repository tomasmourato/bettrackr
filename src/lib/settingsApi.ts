// src/lib/settingsApi.ts
// Camada de API para as definições do utilizador (/api/settings). Gere:
//   - "casas ativas": quais das casas suportadas (betclic/betano/solverde) o
//     utilizador quer usar. A extensão lê o mesmo endpoint para só
//     mostrar/importar dessas casas.
//   - "idioma": o idioma da interface, guardado no servidor para seguir o
//     utilizador entre dispositivos (ver src/hooks/useLanguageSync.ts).
//
// O PUT do servidor é parcial: cada função envia só o campo que muda.

import { authFetch, parseJsonResponse } from "./authApi";
import type { Language } from "../types";

// Casas suportadas pela app (chaves minúsculas, ordem canónica). Espelha o
// SUPPORTED_BOOKMAKERS do servidor; serve de fallback quando /api/settings ainda
// não respondeu (ou o servidor não foi reiniciado com a rota nova).
export const SUPPORTED_BOOKMAKERS = ["betclic", "betano", "solverde"] as const;

// Idiomas com dicionário (espelha o SUPPORTED_LANGUAGES do servidor).
export const SUPPORTED_LANGUAGES = ["pt", "en"] as const;

export interface UserSettings {
  // Casas ativas já resolvidas pelo servidor (NULL na BD -> todas as suportadas).
  enabledBookmakers: string[];
  // Todas as casas que a app suporta, em ordem canónica.
  supportedBookmakers: string[];
  // Idioma guardado no servidor, ou null se o utilizador nunca o definiu.
  language: Language | null;
}

function normalizeLanguage(raw: unknown): Language | null {
  return typeof raw === "string" && (SUPPORTED_LANGUAGES as readonly string[]).includes(raw)
    ? (raw as Language)
    : null;
}

function normalizeSettings(data: any): UserSettings {
  return {
    enabledBookmakers: Array.isArray(data.enabledBookmakers) ? data.enabledBookmakers : [],
    supportedBookmakers: Array.isArray(data.supportedBookmakers) ? data.supportedBookmakers : [],
    language: normalizeLanguage(data.language),
  };
}

export async function fetchSettings(): Promise<UserSettings> {
  const res = await authFetch("/api/settings");
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao obter as definições.");
  return normalizeSettings(data);
}

export async function updateEnabledBookmakers(enabledBookmakers: string[]): Promise<UserSettings> {
  const res = await authFetch("/api/settings", {
    method: "PUT",
    body: JSON.stringify({ enabledBookmakers }),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao guardar as definições.");
  return normalizeSettings(data);
}

export async function updateLanguage(language: Language): Promise<UserSettings> {
  const res = await authFetch("/api/settings", {
    method: "PUT",
    body: JSON.stringify({ language }),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao guardar as definições.");
  return normalizeSettings(data);
}
