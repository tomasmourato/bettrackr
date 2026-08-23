// src/lib/i18n/index.tsx
// i18n leve, sem dependências: dicionários por idioma (pt.ts / en.ts), um
// Provider que recebe o idioma das preferências e o hook useI18n().
//
// O que o `t()` faz além de procurar a chave:
//   - interpolação:  t("settings.defaultStake.label", { currency: "€" })
//   - plural:        t("settings.accounts.count", { n: accounts.length })
//   - fallback:      chave sem tradução no idioma atual cai para o português
//                    (e, se nem lá existir, devolve a própria chave).
//
// As chaves são tipadas (TKey), por isso um erro de escrita numa chave é um
// erro de compilação. A completude do inglês é garantida pelo tipo de EN
// (ver en.ts) e verificada também por `node scripts/check-i18n.mjs`.

import React, { createContext, useContext, useEffect, useMemo } from "react";
import type { Language } from "../../types";
import { PT, type Entry, type TKey } from "./pt";
import { EN } from "./en";
import {
  formatDate,
  formatMoney,
  formatNumber,
  formatSignedMoney,
  formatTime,
  localeFor,
} from "./locale";

export type { Language, TKey, Entry };
export * from "./locale";

const DICTS: Record<Language, Record<TKey, Entry>> = { pt: PT, en: EN };

export type TVars = Record<string, string | number>;
export type TFn = (key: TKey, vars?: TVars) => string;

// Escolhe singular/plural a partir de `n` (ou `count`). Sem `n`, uma entrada
// plural cai no "other" - a forma neutra.
function pick(entry: Entry, vars?: TVars): string {
  if (typeof entry === "string") return entry;
  const n = Number(vars?.n ?? vars?.count ?? 0);
  return n === 1 ? entry.one : entry.other;
}

function interpolate(text: string, vars?: TVars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match
  );
}

export function translate(lang: Language, key: TKey, vars?: TVars): string {
  const entry = DICTS[lang]?.[key] ?? PT[key];
  if (entry === undefined) return key;
  return interpolate(pick(entry, vars), vars);
}

export interface I18nValue {
  lang: Language;
  /** Locale BCP-47 correspondente ao idioma ("pt-PT", "en-GB"). */
  locale: string;
  t: TFn;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatMoney: (value: number, currency: string) => string;
  formatSignedMoney: (value: number, currency: string) => string;
  formatDate: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (value: Date | string | number) => string;
}

function buildValue(lang: Language): I18nValue {
  return {
    lang,
    locale: localeFor(lang),
    t: (key, vars) => translate(lang, key, vars),
    formatNumber: (value, options) => formatNumber(lang, value, options),
    formatMoney: (value, currency) => formatMoney(lang, value, currency),
    formatSignedMoney: (value, currency) => formatSignedMoney(lang, value, currency),
    formatDate: (value, options) => formatDate(lang, value, options),
    formatTime: (value) => formatTime(lang, value),
  };
}

const I18nContext = createContext<I18nValue>(buildValue("pt"));

export function I18nProvider({
  lang,
  children,
}: {
  lang: Language;
  children: React.ReactNode;
}) {
  // O valor só muda quando o idioma muda - evita re-render de toda a árvore
  // a cada render do App (o Provider está agora na raiz).
  const value = useMemo(() => buildValue(lang), [lang]);

  // O documento também tem de seguir o idioma: o <html lang> é o que os
  // leitores de ecrã e os motores de busca leem, e o <title> aparece no
  // separador do browser e no histórico. O index.html arranca em "pt" (ver o
  // script inline que também trata do tema) e aqui corrige-se após montar.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = value.locale;
    document.title = `BetTrackr - ${value.t("app.brandTagline")}`;
  }, [value]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}
