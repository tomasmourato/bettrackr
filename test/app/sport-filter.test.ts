import { describe, expect, test } from "bun:test";
import type { Bet } from "../../src/types";
import { hasBetsWithoutSport, listSports, matchesSportFilter, NO_SPORT } from "../../src/lib/sportFilter";

const bet = (...sports: Array<string | undefined>): Bet =>
  ({
    id: sports.join("|"),
    selections: sports.map((sport, i) => ({ id: `s${i}`, event: "A - B", market: "", choice: "", odd: 2, sport })),
  }) as Bet;

describe("o filtro de desporto", () => {
  test("oferece um futebol, por mais que as fontes o escrevam de maneiras diferentes", () => {
    expect(listSports([bet("FUTEBOL"), bet("Football"), bet("Futebol", "TÉNIS")])).toEqual(["Futebol", "Ténis"]);
  });

  test("um URL antigo com ?sport=FUTEBOL continua a apanhar o futebol", () => {
    expect(matchesSportFilter(bet("Futebol"), "FUTEBOL")).toBe(true);
    expect(matchesSportFilter(bet("Ténis"), "FUTEBOL")).toBe(false);
  });

  test("basta uma perna do desporto para a múltipla entrar", () => {
    expect(matchesSportFilter(bet("Ténis", "Futebol"), "Futebol")).toBe(true);
  });

  test("'Sem desporto' acha as apostas com alguma perna sem desporto", () => {
    expect(matchesSportFilter(bet(undefined), NO_SPORT)).toBe(true);
    expect(matchesSportFilter(bet("Futebol", undefined), NO_SPORT)).toBe(true);
    expect(matchesSportFilter(bet("Futebol"), NO_SPORT)).toBe(false);
  });

  test("'Sem desporto' só aparece quando há apostas assim", () => {
    expect(hasBetsWithoutSport([bet("Futebol")])).toBe(false);
    expect(hasBetsWithoutSport([bet("Futebol"), bet(undefined)])).toBe(true);
  });

  test("'ALL' deixa passar tudo", () => {
    expect(matchesSportFilter(bet(undefined), "ALL")).toBe(true);
  });
});
