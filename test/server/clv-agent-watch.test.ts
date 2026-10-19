import { describe, expect, test } from "bun:test";
import { CLV_AGENT_STALL_AFTER_MS, clvAgentSilent, lastCaptureRun } from "../../lib/clvAgentHealth";
import {
  CLV_AGENT_FAILING_AFTER_MS,
  clvAgentAlertText,
  stallState,
  type BotActivity,
} from "../../lib/botWatch";

// O vigia do agente de CLV. O caso que o fez nascer: a 11/10/2026 às 03:35 o
// agente deixou de reportar e ficou uma semana calado - nenhuma aposta teve odd
// de fecho, e o painel continuava a mostrar a última passagem com um «OK» verde.

const NOW = Date.parse("2026-10-18T07:22:00Z");
const ago = (minutes: number) => new Date(NOW - minutes * 60_000);
const activity = (over: Partial<BotActivity>): BotActivity => ({
  lastRunAt: null,
  lastOkAt: null,
  firstRunAt: null,
  lastError: null,
  ...over,
});

describe("clvAgentSilent (o painel e o vigia respondem igual)", () => {
  test("o caso real: a última passagem foi a 11/10 às 03:35 de Lisboa", () => {
    expect(clvAgentSilent("2026-10-11T02:35:01Z", NOW)).toBe(true);
  });

  test("o agente corre de 5 em 5 minutos: dez minutos sem nada não é paragem", () => {
    expect(clvAgentSilent(ago(10).toISOString(), NOW)).toBe(false);
  });

  test("meia hora certa ainda não é; um minuto a mais já é", () => {
    expect(clvAgentSilent(new Date(NOW - CLV_AGENT_STALL_AFTER_MS), NOW)).toBe(false);
    expect(clvAgentSilent(ago(31), NOW)).toBe(true);
  });

  test("sem passagem nenhuma, ou com uma data que não se lê, não há o que vigiar", () => {
    expect(clvAgentSilent(null, NOW)).toBe(false);
    expect(clvAgentSilent(undefined, NOW)).toBe(false);
    expect(clvAgentSilent("ontem", NOW)).toBe(false);
  });
});

describe("lastCaptureRun", () => {
  test("a passagem de madrugada não prova que a captura está viva", () => {
    const runs = [
      { id: "d", kind: "daily" },
      { id: "c1", kind: "capture" },
      { id: "c2", kind: "capture" },
    ];
    expect(lastCaptureRun(runs)?.id).toBe("c1");
  });

  test("só passagens de madrugada: não há captura para vigiar", () => {
    expect(lastCaptureRun([{ kind: "daily" }])).toBeUndefined();
    expect(lastCaptureRun([])).toBeUndefined();
  });
});

describe("stallState com os limites do agente", () => {
  const clv = (a: BotActivity, now = NOW) =>
    stallState(a, now, CLV_AGENT_STALL_AFTER_MS, CLV_AGENT_FAILING_AFTER_MS);

  test("o caso real dá 'silent': o agente nem reporta", () => {
    const real = activity({
      lastRunAt: new Date("2026-10-11T02:35:01Z"),
      lastOkAt: new Date("2026-10-11T02:35:01Z"),
      firstRunAt: new Date("2026-10-04T02:40:00Z"),
    });
    expect(clv(real)).toBe("silent");
  });

  test("calado há 35 minutos já é 'silent': o limite do silêncio continua meia hora", () => {
    expect(clv(activity({ lastRunAt: ago(35), lastOkAt: ago(35), firstRunAt: ago(3000) }))).toBe("silent");
  });

  test("a correr de 5 em 5 minutos mas a falhar há mais de uma hora dá 'failing'", () => {
    const aFalhar = activity({ lastRunAt: ago(3), lastOkAt: ago(65), firstRunAt: ago(3000), lastError: "x" });
    expect(clv(aFalhar)).toBe("failing");
  });

  test("um jogo que não se lê faz falhar a janela dele toda (30 min) - não é agente parado", () => {
    // As passagens boas antes e depois da janela distam meia hora; o vigia pode
    // olhar mesmo antes de chegar a segunda, e um pouco depois dos 30 minutos.
    const janela = activity({ lastRunAt: ago(5), lastOkAt: ago(31), firstRunAt: ago(3000), lastError: "x" });
    expect(clv(janela)).toBeNull();
  });

  test("os limites por omissão (os do bot) não mudam: uma hora para tudo", () => {
    const aFalhar = activity({ lastRunAt: ago(3), lastOkAt: ago(50), firstRunAt: ago(3000), lastError: "x" });
    expect(stallState(aFalhar, NOW)).toBeNull();
    expect(stallState({ ...aFalhar, lastOkAt: ago(61) }, NOW)).toBe("failing");
    expect(stallState(activity({ lastRunAt: ago(61), lastOkAt: ago(61), firstRunAt: ago(3000) }), NOW)).toBe(
      "silent",
    );
  });
});

describe("clvAgentAlertText", () => {
  test("calado: há quanto tempo, e o que isso custa", () => {
    const text = clvAgentAlertText(
      "silent",
      activity({ lastRunAt: new Date("2026-10-11T02:35:01Z"), lastOkAt: new Date("2026-10-11T02:35:01Z") }),
      NOW,
      "pt",
    );
    expect(text.title).toBe("O agente de CLV parou");
    expect(text.body).toBe("O agente não reporta há 7 dias. Nenhuma aposta está a receber odd de fecho.");
  });

  test("a falhar: há quanto tempo e o último erro, no idioma de quem recebe", () => {
    const text = clvAgentAlertText(
      "failing",
      activity({ lastRunAt: ago(3), lastOkAt: ago(95), lastError: "nenhuma leitura conseguida - nada enviado" }),
      NOW,
      "en",
    );
    expect(text.title).toBe("The CLV agent stopped");
    expect(text.body).toBe(
      "No successful pass for 1 h 35 min. Last error: nenhuma leitura conseguida - nada enviado",
    );
  });
});
