// src/lib/i18n/locale.ts
// Formatação sensível ao idioma (datas, números, dinheiro). Substitui os
// "pt-PT" fixos espalhados pelos ecrãs: quem formata passa a receber o locale
// do idioma escolhido em vez de o assumir.
//
// Nota sobre dinheiro: nesta app `currency` é um SÍMBOLO escolhido pelo
// utilizador ("€", "$", "£", "R$") e não um código ISO, por isso é colado como
// sufixo em vez de ser passado ao Intl com style:"currency" - assim o valor
// apresentado continua exatamente igual ao de hoje, só muda o separador
// decimal/de milhares quando o idioma muda.

import type { Language } from "../../types";

export const LOCALES: Record<Language, string> = {
  pt: "pt-PT",
  en: "en-GB",
};

export function localeFor(lang: Language): string {
  return LOCALES[lang] ?? LOCALES.pt;
}

export function formatNumber(
  lang: Language,
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return value.toLocaleString(localeFor(lang), options);
}

// Valor monetário com 2 casas decimais + símbolo, como o resto da app já faz.
export function formatMoney(lang: Language, value: number, currency: string): string {
  const amount = formatNumber(lang, value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount}${currency}`;
}

// Como formatMoney, mas com o sinal explícito para lucros/prejuízos.
export function formatSignedMoney(lang: Language, value: number, currency: string): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${formatMoney(lang, value, currency)}`;
}

// Preço da subscrição. Ao contrário de formatMoney(), aqui a moeda é mesmo um
// código ISO vindo do Stripe ("eur"), por isso vale a pena deixar o Intl
// colocar o símbolo no sítio certo de cada idioma ("3,99 €" vs "€3.99").
export function formatPrice(lang: Language, cents: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat(localeFor(lang), {
      style: "currency",
      currency: currencyCode.toUpperCase(),
    }).format(cents / 100);
  } catch {
    // Código de moeda desconhecido - melhor mostrar o número do que rebentar.
    return `${formatNumber(lang, cents / 100, { minimumFractionDigits: 2 })} ${currencyCode.toUpperCase()}`;
  }
}

export function formatDate(
  lang: Language,
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(localeFor(lang), options).format(date);
}

export function formatTime(lang: Language, value: Date | string | number): string {
  return formatDate(lang, value, { hour: "2-digit", minute: "2-digit" });
}
