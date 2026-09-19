// src/lib/bookmakers.ts
// Registo de casas de apostas com os seus defaults de freebet.
//
// IMPORTANTE: os tipos de freebet por casa são DEFAULTS, não verdades absolutas.
// Vieram de uma pesquisa de julho de 2026 em sites de afiliados, pouco fiáveis e
// misturados PT/BR. As únicas fontes com autoridade são os T&C de cada casa e o
// pagamento real de uma freebet já liquidada.
//
//   SNR (Stake Not Returned): na vitória só se recebe o lucro. 10€ @ 3.0 -> 20€.
//       É o padrão da indústria e o fallback seguro para uma casa desconhecida.
//   SR (Stake Returned): paga como dinheiro, stake incluída. 10€ @ 3.0 -> 30€.
//
// A Betclic, a Betano e a Solverde são SR por decisão/dados reais. As apostas
// importadas e liquidadas nem dependem disto: valem pelo que a casa pagou de
// facto. O tipo serve a entrada manual e o retorno potencial das pendentes, e o
// utilizador pode sempre corrigi-lo em cada aposta. "Aposta sem risco" não é um
// tipo de pagamento: é uma aposta a dinheiro reembolsada em freebet.

import { FreebetType } from "../types";

export interface Bookmaker {
  id: string;
  name: string;
  /** Tipo de freebet por omissão desta casa. */
  defaultFreebetType: FreebetType;
  /** Se as freebets desta casa permitem cashout (Placard, por ex., não). */
  allowsFreebetCashout: boolean;
}

export const BOOKMAKERS: Bookmaker[] = [
  { id: "betano", name: "Betano", defaultFreebetType: "SR", allowsFreebetCashout: true },
  { id: "betclic", name: "Betclic", defaultFreebetType: "SR", allowsFreebetCashout: true },
  { id: "placard", name: "Placard", defaultFreebetType: "SNR", allowsFreebetCashout: false },
  { id: "bwin", name: "Bwin", defaultFreebetType: "SNR", allowsFreebetCashout: true },
  { id: "solverde", name: "Solverde", defaultFreebetType: "SR", allowsFreebetCashout: true },
  { id: "nossa-aposta", name: "Nossa Aposta", defaultFreebetType: "SNR", allowsFreebetCashout: true },
  { id: "casino-portugal", name: "Casino Portugal", defaultFreebetType: "SNR", allowsFreebetCashout: true },
  { id: "placard-pt", name: "Placard.pt", defaultFreebetType: "SNR", allowsFreebetCashout: false },
  { id: "outra", name: "Outra", defaultFreebetType: "SNR", allowsFreebetCashout: true },
];

/** Nomes para dropdowns (mantém compatibilidade com AVAILABLE_BOOKMAKERS). */
export const AVAILABLE_BOOKMAKERS = BOOKMAKERS.map((b) => b.name);

/** Nome apresentável de uma casa a partir do seu id (ex.: "betclic" -> "Betclic"). */
export function bookmakerLabel(id: string): string {
  return BOOKMAKERS.find((b) => b.id === id)?.name ?? id;
}

export function bookmakerByName(name: string | undefined): Bookmaker | undefined {
  if (!name) return undefined;
  const n = name.trim().toLowerCase();
  return BOOKMAKERS.find((b) => b.name.toLowerCase() === n);
}

/** Tipo de freebet por omissão para uma casa (SNR se desconhecida). */
export function defaultFreebetTypeFor(name: string | undefined): FreebetType {
  return bookmakerByName(name)?.defaultFreebetType ?? "SNR";
}
