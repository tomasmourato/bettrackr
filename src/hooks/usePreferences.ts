// src/hooks/usePreferences.ts
// Preferências gerais da aplicação. Este é um dos poucos dados que
// continua a ser guardado em localStorage (chave "g_prefs").

import { useEffect, useState } from "react";
import { Language, Preferences } from "../types";

const PREFS_KEY = "g_prefs";

// Mantém-se determinístico: é isto que o SSR usa, por isso não pode depender
// do browser. A deteção de idioma acontece só no loadPreferences (cliente).
export const DEFAULT_PREFERENCES: Preferences = {
  currency: "€",
  defaultBookmaker: "Betano",
  defaultStake: 10,
  theme: "system",
  language: "pt",
};

// Primeiro arranque: segue o idioma do browser em vez de assumir português.
// Só é chamada quando não há preferências guardadas - quem já usa a app nunca
// vê o idioma mudar sozinho.
function detectLanguage(): Language {
  if (typeof navigator === "undefined") return DEFAULT_PREFERENCES.language;
  const candidates = [...(navigator.languages ?? []), navigator.language];
  for (const tag of candidates) {
    const base = tag?.toLowerCase().split("-")[0];
    if (base === "pt" || base === "en") return base;
  }
  return DEFAULT_PREFERENCES.language;
}

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    }
  } catch {
    // Ignora JSON inválido e usa os valores por omissão.
  }
  return { ...DEFAULT_PREFERENCES, language: detectLanguage() };
}

export function usePreferences(initialPreferences?: Preferences) {
  const [preferences, setPreferences] = useState<Preferences>(() => initialPreferences ?? loadPreferences());

  // SSR starts with deterministic defaults. Read browser-only preferences after
  // hydration so the server and first client render stay byte-for-byte aligned.
  useEffect(() => {
    if (initialPreferences) setPreferences(loadPreferences());
  }, [initialPreferences]);

  const updatePreferences = (prefs: Preferences) => {
    setPreferences(prefs);
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  };

  return { preferences, updatePreferences };
}
