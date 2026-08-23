// routes/settingsRoutes.ts
// Definições do utilizador lidas tanto pelo site como pela extensão. Guarda:
//   - "casas ativas": quais das casas suportadas (betclic/betano/solverde) o
//     utilizador quer usar. A extensão consulta /api/settings para só
//     mostrar/importar dessas.
//   - "idioma": o idioma da interface, para seguir o utilizador entre
//     dispositivos (o localStorage sozinho não o fazia).
//
// O PUT aceita atualizações parciais: quem envia só `enabledBookmakers` (a
// extensão) não mexe no idioma, e vice-versa.

import { Router } from "express";
import pool from "../db/pool.js";
import { authenticateToken, AuthenticatedRequest } from "../middleware/authMiddleware.js";

const router = Router();
router.use(authenticateToken);

// Casas suportadas pela importação (chaves em minúsculas, iguais às da extensão).
export const SUPPORTED_BOOKMAKERS = ["betclic", "betano", "solverde"] as const;

// Idiomas com dicionário na app (espelha src/lib/i18n).
export const SUPPORTED_LANGUAGES = ["pt", "en"] as const;

// Normaliza a lista enviada: só chaves suportadas, sem duplicados, minúsculas.
function cleanEnabled(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const key = item.trim().toLowerCase();
    if ((SUPPORTED_BOOKMAKERS as readonly string[]).includes(key)) seen.add(key);
  }
  // Mantém a ordem canónica das suportadas.
  return SUPPORTED_BOOKMAKERS.filter((k) => seen.has(k));
}

// Devolve o idioma normalizado, ou null se não for um dos suportados.
function cleanLanguage(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const key = raw.trim().toLowerCase();
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(key) ? key : null;
}

// ============================================================
// GET /api/settings -> { enabledBookmakers, supportedBookmakers, language, supportedLanguages }
// enabledBookmakers já resolvido: NULL na BD (não configurado) -> todas.
// language: NULL na BD (nunca configurado) -> null, e o cliente decide.
// ============================================================
router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await pool.query(
      "SELECT enabled_bookmakers, language FROM users WHERE id = $1",
      [req.user!.id]
    );
    const stored = result.rows[0]?.enabled_bookmakers ?? null;
    const enabledBookmakers = Array.isArray(stored)
      ? SUPPORTED_BOOKMAKERS.filter((k) => stored.includes(k))
      : [...SUPPORTED_BOOKMAKERS];
    res.json({
      enabledBookmakers,
      supportedBookmakers: [...SUPPORTED_BOOKMAKERS],
      language: cleanLanguage(result.rows[0]?.language),
      supportedLanguages: [...SUPPORTED_LANGUAGES],
    });
  } catch (error) {
    console.error("Erro ao obter definições:", error);
    res.status(500).json({ error: "Erro ao obter as definições." });
  }
});

// ============================================================
// PUT /api/settings -> guarda { enabledBookmakers?: string[], language?: string }
// Atualização parcial: só os campos presentes no corpo são escritos.
// Array de casas vazio = nenhuma casa ativa (permitido).
// ============================================================
router.put("/", async (req: AuthenticatedRequest, res) => {
  const wantsBookmakers = req.body?.enabledBookmakers !== undefined;
  const wantsLanguage = req.body?.language !== undefined;

  if (!wantsBookmakers && !wantsLanguage) {
    res.status(400).json({ error: "Nada para atualizar." });
    return;
  }

  let enabled: string[] | null = null;
  if (wantsBookmakers) {
    enabled = cleanEnabled(req.body.enabledBookmakers);
    if (enabled === null) {
      res.status(400).json({ error: "enabledBookmakers tem de ser uma lista." });
      return;
    }
  }

  let language: string | null = null;
  if (wantsLanguage) {
    language = cleanLanguage(req.body.language);
    if (language === null) {
      res.status(400).json({ error: "language tem de ser 'pt' ou 'en'." });
      return;
    }
  }

  try {
    // Só escreve as colunas enviadas - um PUT parcial não pode apagar a outra.
    const sets: string[] = [];
    const values: unknown[] = [];
    if (wantsBookmakers) {
      values.push(enabled);
      sets.push(`enabled_bookmakers = $${values.length}`);
    }
    if (wantsLanguage) {
      values.push(language);
      sets.push(`language = $${values.length}`);
    }
    values.push(req.user!.id);

    const result = await pool.query(
      `UPDATE users SET ${sets.join(", ")} WHERE id = $${values.length}
       RETURNING enabled_bookmakers, language`,
      values
    );

    const stored = result.rows[0]?.enabled_bookmakers ?? null;
    res.json({
      success: true,
      enabledBookmakers: Array.isArray(stored)
        ? SUPPORTED_BOOKMAKERS.filter((k) => stored.includes(k))
        : [...SUPPORTED_BOOKMAKERS],
      supportedBookmakers: [...SUPPORTED_BOOKMAKERS],
      language: cleanLanguage(result.rows[0]?.language),
      supportedLanguages: [...SUPPORTED_LANGUAGES],
    });
  } catch (error) {
    console.error("Erro ao guardar definições:", error);
    res.status(500).json({ error: "Erro ao guardar as definições." });
  }
});

export default router;
