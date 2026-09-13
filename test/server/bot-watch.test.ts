import { describe, expect, test } from "bun:test";
import {
  alertTabFor,
  botAlertText,
  formatDuration,
  stallState,
  summarizeBotError,
  type BotActivity,
} from "../../lib/botWatch";
import { buildFcmMessage, isDeadToken, parseServiceAccount, PUSH_CHANNEL_ID } from "../../lib/push";

// O vigia do bot da Betclic. O que aqui se fixa é a pergunta "está parado?" - e
// a razão de ser "sem SUCESSO há mais de 1 hora" e não "sem passagens": a
// 12/09/2026 o bot correu de 30 em 30 minutos, a falhar em todas, e só a
// primeira regra o apanhava.

const NOW = Date.parse("2026-09-13T14:56:00Z");
const ago = (minutes: number) => new Date(NOW - minutes * 60_000);
const activity = (over: Partial<BotActivity>): BotActivity => ({
  lastRunAt: null,
  lastOkAt: null,
  firstRunAt: null,
  lastError: null,
  ...over,
});

const SEM_TOKEN =
  "99276a88: sem token de contexto valido (ativa no painel /bot) | e64ba1fa: sem token de contexto valido (ativa no painel /bot)";

describe("stallState", () => {
  test("o caso real: corre de 30 em 30 min, mas falha desde a noite anterior", () => {
    const real = activity({ lastRunAt: ago(26), lastOkAt: ago(15 * 60 + 56), firstRunAt: ago(7 * 24 * 60), lastError: SEM_TOKEN });
    expect(stallState(real, NOW)).toBe("failing");
  });

  test("calado há mais de 1 hora: o telemóvel ou o cron pararam", () => {
    expect(stallState(activity({ lastRunAt: ago(90), lastOkAt: ago(90), firstRunAt: ago(3000) }), NOW)).toBe("silent");
  });

  test("uma passagem boa há menos de 1 hora chega, mesmo que a última tenha falhado", () => {
    expect(stallState(activity({ lastRunAt: ago(5), lastOkAt: ago(35), firstRunAt: ago(3000), lastError: "x" }), NOW)).toBeNull();
  });

  test("exatamente em cima do limite ainda não é paragem", () => {
    expect(stallState(activity({ lastRunAt: ago(60), lastOkAt: ago(60), firstRunAt: ago(3000) }), NOW)).toBeNull();
  });

  test("um bot acabado de instalar, a falhar há 10 minutos, ainda não é um bot parado", () => {
    expect(stallState(activity({ lastRunAt: ago(1), firstRunAt: ago(10), lastError: "x" }), NOW)).toBeNull();
    expect(stallState(activity({ lastRunAt: ago(1), firstRunAt: ago(70), lastError: "x" }), NOW)).toBe("failing");
  });

  test("sem passagens não há nada a vigiar", () => {
    expect(stallState(activity({}), NOW)).toBeNull();
  });
});

describe("summarizeBotError", () => {
  test("tira os ids das contas e as repetições", () => {
    expect(summarizeBotError(SEM_TOKEN)).toBe("sem token de contexto valido (ativa no painel /bot)");
  });

  test("erros diferentes ficam os dois", () => {
    expect(summarizeBotError("99276a88: fetch failed | e64ba1fa: enrolment falhou: 403")).toBe(
      "fetch failed; enrolment falhou: 403",
    );
  });

  test("corta o que é comprido", () => {
    const curto = summarizeBotError("x".repeat(500), 20)!;
    expect(curto).toHaveLength(20);
    expect(curto.endsWith("…")).toBe(true);
  });

  test("sem erro não há texto", () => {
    expect(summarizeBotError(null)).toBeNull();
    expect(summarizeBotError("")).toBeNull();
  });
});

describe("formatDuration", () => {
  test("minutos, horas com minutos enquanto interessam, horas, dias", () => {
    expect(formatDuration(45 * 60_000, "pt")).toBe("45 min");
    expect(formatDuration(80 * 60_000, "pt")).toBe("1 h 20 min");
    expect(formatDuration(62 * 60_000, "pt")).toBe("1 h");
    expect(formatDuration((15 * 60 + 56) * 60_000, "pt")).toBe("15 h");
    expect(formatDuration(3 * 24 * 60 * 60_000, "pt")).toBe("3 dias");
    expect(formatDuration(3 * 24 * 60 * 60_000, "en")).toBe("3 days");
  });
});

describe("botAlertText", () => {
  test("a falhar: há quanto tempo e o último erro, sem os ids", () => {
    const text = botAlertText(
      "failing",
      activity({ lastRunAt: ago(26), lastOkAt: ago(15 * 60 + 56), lastError: SEM_TOKEN }),
      NOW,
      "pt",
    );
    expect(text.title).toBe("O bot da Betclic parou");
    expect(text.body).toBe(
      "Sem importações com sucesso há 15 h. Último erro: sem token de contexto valido (ativa no painel /bot)",
    );
  });

  test("calado: aponta para o telemóvel, no idioma do dono", () => {
    const text = botAlertText("silent", activity({ lastRunAt: ago(95), lastOkAt: ago(95) }), NOW, "en");
    expect(text.title).toBe("The Betclic bot stopped");
    expect(text.body).toBe("The bot hasn't reported for 1 h 35 min. The phone may have stopped Termux.");
  });
});

describe("alertTabFor", () => {
  test("staff abre na Gestão; o botuser, que não a vê, no painel do bot", () => {
    expect(alertTabFor("founder")).toBe("ADMIN");
    expect(alertTabFor("admin")).toBe("ADMIN");
    expect(alertTabFor("botuser")).toBe("BOT");
  });
});

describe("push (FCM)", () => {
  const conta = {
    type: "service_account",
    project_id: "bettrackr-app",
    client_email: "fcm@bettrackr-app.iam.gserviceaccount.com",
    private_key: "-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----\n",
  };

  test("lê a conta de serviço em JSON e em base64", () => {
    const json = JSON.stringify(conta);
    const lida = parseServiceAccount(json)!;
    expect(lida).toEqual({
      projectId: "bettrackr-app",
      clientEmail: "fcm@bettrackr-app.iam.gserviceaccount.com",
      privateKey: conta.private_key,
    });
    expect(parseServiceAccount(Buffer.from(json).toString("base64"))).toEqual(lida);
  });

  test("uma chave colada com os \\n como texto volta a ter quebras de linha", () => {
    const colada = JSON.stringify({ ...conta, private_key: conta.private_key.replace(/\n/g, "\\n") });
    expect(parseServiceAccount(colada)!.privateKey).toBe(conta.private_key);
  });

  test("sem configuração, ou com lixo, não há push", () => {
    expect(parseServiceAccount(undefined)).toBeNull();
    expect(parseServiceAccount("")).toBeNull();
    expect(parseServiceAccount("{isto não é json")).toBeNull();
    expect(parseServiceAccount("lixo")).toBeNull();
    expect(parseServiceAccount(JSON.stringify({ project_id: "x" }))).toBeNull();
  });

  test("a mensagem vai para o canal dos alertas, com os dados como texto", () => {
    const data = { kind: "bot_stalled", notificationId: "n1", tab: "ADMIN" };
    const { message } = buildFcmMessage("tok", { title: "t", body: "b", data });
    expect(message.token).toBe("tok");
    expect(message.notification).toEqual({ title: "t", body: "b" });
    expect(message.android.notification.channel_id).toBe(PUSH_CHANNEL_ID);
    expect(message.data).toEqual(data);
  });

  test("só se esquecem os tokens que o FCM dá como mortos", () => {
    expect(isDeadToken(404, {})).toBe(true);
    expect(isDeadToken(403, { error: { details: [{ errorCode: "UNREGISTERED" }] } })).toBe(true);
    expect(
      isDeadToken(400, { error: { message: "The registration token is not a valid FCM registration token" } }),
    ).toBe(true);
    // Um erro nosso (mensagem mal feita, credenciais) não apaga o telemóvel de ninguém.
    expect(isDeadToken(400, { error: { message: "Invalid JSON payload received." } })).toBe(false);
    expect(isDeadToken(401, {})).toBe(false);
    expect(isDeadToken(500, {})).toBe(false);
  });
});
