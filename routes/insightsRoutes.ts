// routes/insightsRoutes.ts
// AI Insights diários: dicas de picks para os jogos DO DIA, geradas pelo
// Gemini com grounding no Google Search (o modelo pesquisa os jogos e odds
// reais antes de escrever - sem grounding alucinaria jogos inexistentes).
//
// Custo controlado: gera-se UMA vez por dia e guarda-se em daily_insights;
// todos os utilizadores leem a mesma linha. Pedidos concorrentes no primeiro
// acesso do dia são resolvidos pelo UNIQUE(insight_date) + ON CONFLICT.
//
// A geração é pré-aquecida por um cron diário (ver vercel.json + /cron aqui),
// para nenhum utilizador apanhar a espera da geração.

import { Router } from "express";
import pool from "../db/pool.js";
import { authenticateToken, AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { requireSubscription } from "../middleware/accessMiddleware.js";
import { getGeminiClient, extractJson } from "../lib/gemini.js";

const router = Router();

// O modelo é imposto pelo plano, não por preferência: no free tier o grounding
// do Google Search só tem quota no gemini-2.5-flash - os modelos mais recentes
// (3.x) devolvem 429 assim que a pesquisa é ativada, e sem pesquisa o modelo
// inventaria jogos. Reavaliar se/quando houver faturação ativa.
const MODEL = "gemini-2.5-flash";
const MAX_PICKS = 12;

// Uma chamada estabiliza em ~13s; com maxDuration=60 na Vercel, três
// tentativas cabem com folga. O orçamento trava tentativas que arrisquem
// passar do limite da função.
const MAX_ATTEMPTS = 3;
const TIME_BUDGET_MS = 40_000;

/** Data de "hoje" em Lisboa (o dia desportivo do utilizador, não UTC). */
// Idiomas com dicionário na app (espelha src/lib/i18n e o settingsRoutes).
// A instrução de língua entra no prompt e o idioma entra na chave da cache,
// senão o primeiro pedido do dia fixava a língua das dicas para toda a gente.
const SUPPORTED_LANGS = ["pt", "en"] as const;
type Lang = (typeof SUPPORTED_LANGS)[number];

function cleanLang(raw: unknown): Lang {
  const key = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return (SUPPORTED_LANGS as readonly string[]).includes(key) ? (key as Lang) : "pt";
}

const LANG_INSTRUCTION: Record<Lang, string> = {
  pt: "a escrever em português de Portugal",
  en: "writing in English",
};

// Bloco que força o idioma de TODOS os campos de texto do JSON. Só a frase de
// papel ("a escrever em X") não chegava: os exemplos do esquema estão em
// português e o modelo copiava-os, devolvendo "Futebol"/"Resultado Final" a um
// utilizador inglês. Aqui nomeiam-se os campos, um a um.
function outputLanguageBlock(lang: Lang, fields: string[]): string {
  const list = fields.map((f) => `"${f}"`).join(", ");
  return lang === "en"
    ? `\n\nOUTPUT LANGUAGE (CRITICAL): every piece of text inside the JSON MUST be written in English, including ${list}. The examples in the schema below are written in Portuguese only to illustrate the FORMAT - translate those values into English. Do not output Portuguese words such as "Futebol", "Resultado Final" or "Handicap Asiático"; use "Football", "Full Time Result", "Asian Handicap" and so on. Proper nouns (team and competition names) keep their official name.`
    : `\n\nIDIOMA DA RESPOSTA: todo o texto dentro do JSON tem de estar em português de Portugal, incluindo ${list}. Nomes próprios (equipas e competições) mantêm o nome oficial.`;
}

// Etiqueta do veredito: é o SERVIDOR que a escreve (não o modelo), por isso
// tem de existir nos dois idiomas - senão um utilizador inglês recebia
// "Valor esperado positivo".
const VERDICT_LABELS: Record<Lang, Record<"VALOR" | "JUSTA" | "SEM_VALOR", string>> = {
  pt: {
    VALOR: "Valor esperado positivo",
    JUSTA: "Perto do valor justo",
    SEM_VALOR: "Valor esperado negativo",
  },
  en: {
    VALOR: "Positive expected value",
    JUSTA: "Close to fair value",
    SEM_VALOR: "Negative expected value",
  },
};

function todayInLisbon(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(new Date());
}

interface Pick {
  sport: string;
  competition: string;
  match: string;
  kickoffLisbon: string;
  market: string;
  selection: string;
  // O preco a que se pode MESMO apostar. Vem da tabela daily_odds quando ha
  // captura do dia; so cai no que o modelo diz quando nao ha. Ver resolvePicks.
  approxOdd: number | null;
  /** O mesmo preco sem a margem da casa. null quando nao houve captura. */
  /** Id da seleccao na Betclic, quando a escolha veio da ementa de odds reais. */
  selectionId?: string;
  noVigOdd?: number | null;
  /** Margem do mercado, em percentagem. E a vantagem verificavel desta lista. */
  marginPct?: number | null;
  confidence: number;
  rationale: string;
}

// ============================================================
// Odds reais em vez de odds plausiveis
//
// Ate aqui o modelo devolvia `approxOdd` - "aproximada", e o nome nao mentia.
// O prompt chegava a pedir-lhe uma "variedade" de odds, o que e pedir numeros
// plausiveis: uma dica com um preco que nao existe em lado nenhum nao serve
// para nada, porque o utilizador vai a casa e o preco e outro.
//
// Agora, quando ha captura do dia, o modelo recebe a lista de jogos e precos
// REAIS e devolve o ID da seleccao que escolheu. O numero e preenchido AQUI,
// a partir da base de dados. E o mesmo principio que o analisador de apostas
// ja segue: o modelo julga, o codigo calcula. Assim ele nao pode inventar um
// preco nem por acidente.
//
// Sem captura (agente parado, migracao 020 por aplicar) volta tudo ao que era.
// ============================================================

interface OpcaoDoDia {
    selectionId: string;
    selection: string;
    odd: number;
    noVig: number;
    marginPct: number;
    market: string;
    match: string;
    competition: string | null;
    kickoffLisbon: string;
}

/** As seleccoes capturadas para hoje, por id. Vazio quando nao houve captura. */
async function loadDailyOdds(date: string): Promise<Map<string, OpcaoDoDia>> {
    const out = new Map<string, OpcaoDoDia>();
    let rows: any[];
    try {
        const r = await pool.query(
            `SELECT event, competition, kickoff_utc, markets
               FROM daily_odds WHERE odds_date = $1
              ORDER BY kickoff_utc NULLS LAST LIMIT 60`,
            [date],
        );
        rows = r.rows;
    } catch (error: any) {
        // 42P01 = a tabela nao existe: a migracao 020 e aplicada a mao. Nesse
        // caso as dicas continuam a funcionar como antes, sem odds reais.
        if (error?.code !== "42P01") console.error("[insights] daily_odds:", error);
        return out;
    }

    for (const row of rows) {
        const hora = row.kickoff_utc
            ? new Date(row.kickoff_utc).toLocaleTimeString("pt-PT", {
                  timeZone: "Europe/Lisbon",
                  hour: "2-digit",
                  minute: "2-digit",
              })
            : "";
        for (const m of Array.isArray(row.markets) ? row.markets : []) {
            for (const sel of Array.isArray(m?.selections) ? m.selections : []) {
                if (!sel?.id) continue;
                out.set(String(sel.id), {
                    selectionId: String(sel.id),
                    selection: String(sel.name ?? ""),
                    odd: Number(sel.odd),
                    noVig: Number(sel.noVig),
                    marginPct: Number(m.marginPct),
                    market: String(m.name ?? ""),
                    match: String(row.event ?? ""),
                    competition: row.competition,
                    kickoffLisbon: hora,
                });
            }
        }
    }
    return out;
}

/** A ementa que vai no prompt: jogos, mercados e precos reais. */
function menuDoDia(opcoes: Map<string, OpcaoDoDia>): string {
    const porJogo = new Map<string, OpcaoDoDia[]>();
    for (const o of opcoes.values()) {
        const chave = `${o.kickoffLisbon}|${o.match}|${o.competition ?? ""}|${o.market}`;
        const g = porJogo.get(chave);
        if (g) g.push(o);
        else porJogo.set(chave, [o]);
    }

    const linhas: string[] = [];
    for (const [chave, sels] of porJogo) {
        const [hora, jogo, comp, mercado] = chave.split("|");
        linhas.push(`${hora} ${jogo}${comp ? ` (${comp})` : ""} - ${mercado} [margem ${sels[0].marginPct}%]`);
        for (const s of sels) linhas.push(`    ${s.selectionId}  ${s.selection} @ ${s.odd}`);
    }
    return linhas.join("\n");
}

// Normaliza/valida o JSON devolvido pelo modelo. Campos em falta não rebentam
// a resposta - o pick é descartado se lhe faltar o essencial.
function sanitizeContent(raw: any): { summary: string; picks: Pick[] } {
  const clip = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
  const picks: Pick[] = (Array.isArray(raw?.picks) ? raw.picks : [])
    .map((p: any): Pick => ({
      sport: clip(p?.sport, 40),
      competition: clip(p?.competition, 80),
      match: clip(p?.match, 120),
      kickoffLisbon: clip(p?.kickoffLisbon, 20),
      market: clip(p?.market, 80),
      selection: clip(p?.selection, 120),
      // O id da seleccao escolhida quando ha ementa de odds reais. Tem de
      // sobreviver a esta normalizacao, senao o resolvePicks nao teria por onde
      // ir buscar o preco verdadeiro.
      selectionId: clip(p?.selectionId, 40) || undefined,
      approxOdd: Number.isFinite(Number(p?.approxOdd)) && Number(p?.approxOdd) > 1
        ? Number(Number(p.approxOdd).toFixed(2))
        : null,
      confidence: Math.min(5, Math.max(1, Math.round(Number(p?.confidence) || 3))),
      rationale: clip(p?.rationale, 400),
    }))
    // Com ementa, o jogo e a seleccao sao preenchidos a partir da base de
    // dados pelo resolvePicks - exigi-los aqui deitava fora picks validas em
    // que o modelo se limitou a devolver o id, que e o que lhe pedimos.
    .filter((p: Pick) => (p.selectionId ? Boolean(p.sport) : p.match && p.selection && p.sport))
    .slice(0, MAX_PICKS);

  if (picks.length === 0) throw new Error("O modelo não devolveu picks válidos.");
  return { summary: clip(raw?.summary, 600), picks };
}

function buildPrompt(dateLisbon: string, insistOnJson: boolean, lang: Lang, menu: string) {
  // Nas repetições reforçamos a instrução de formato: a falha mais comum é o
  // modelo devolver só a prosa da pesquisa, sem o JSON.
  const insist = insistOnJson
    ? `\n\nATENÇÃO: a tua resposta anterior não continha JSON válido. Responde SÓ com o objeto JSON, a começar em { e a terminar em }. Sem texto antes ou depois, sem blocos de código.`
    : "";

  return `
Hoje é ${dateLisbon}. És um analista de apostas desportivas experiente e prudente, ${LANG_INSTRUCTION[lang]}.

${menu
    ? `ESCOLHE APENAS da lista abaixo. São jogos e ODDS REAIS da Betclic, capturados hoje de madrugada. Cada linha de seleção começa pelo ID que tens de devolver em "selectionId".

NÃO inventes jogos, equipas, mercados nem odds, e NÃO uses seleções que não estejam nesta lista - qualquer pick com um ID que não conste aqui é descartada pelo sistema. NÃO escrevas odds: o preço é preenchido a partir do ID.

USA A PESQUISA GOOGLE apenas para o CONTEXTO de cada jogo: forma recente, lesões, castigos, onze provável, motivação e calendário.

${menu}`
    : `USA A PESQUISA GOOGLE para descobrires jogos REAIS que se realizam HOJE (${dateLisbon}) e as odds aproximadas atuais nas casas europeias. NÃO inventes jogos, equipas nem odds - inclui apenas eventos que confirmaste na pesquisa.`}

Escolhe entre 3 e 8 picks para hoje. Se hoje não houver 3 que prestem, devolve MENOS - uma lista curta e boa vale mais do que uma lista cheia por obrigação.

Como escolher:
- Pelo MÉRITO de cada aposta, uma a uma. Não há quota de desportos nem de odds: não escolhas nada para "variar", nem para incluir um azarão, nem para cobrir um desporto que hoje não tem nada de jeito.${menu ? `
- Entre duas escolhas de mérito parecido, prefere a do mercado com MENOR margem (vem indicada em cada linha da lista). É onde o preço é melhor, e é a única vantagem que não depende de acertares mais do que a casa.` : `
- Mercados concretos (resultado final, over/under golos ou pontos, ambas marcam, handicap, vencedor do encontro...).`}
- Justificação curta (1-2 frases) baseada em forma recente, confrontos, lesões ou contexto - factual, sem promessas.

"confidence" é de 1 a 5 e tem de significar isto: 1 = palpite fraco; 2 = ligeira preferência; 3 = fundamentada mas equilibrada; 4 = forte, vários sinais independentes a apontar no mesmo sentido; 5 = muito forte, e deve ser raro. Não uses 5 mais do que uma vez.

Responde APENAS com JSON válido, sem texto fora do JSON, neste formato:
{
  "summary": "2-3 frases sobre o dia desportivo de hoje e o racional geral das escolhas",
  "picks": [
    {
      "sport": "Futebol",
      "competition": "nome da competição",
      "match": "Equipa A vs Equipa B",
      "kickoffLisbon": "HH:MM",
      "market": "mercado",
      "selection": "a escolha concreta",
      ${menu ? `"selectionId": "o ID exato da linha escolhida na lista acima",` : `"approxOdd": 1.85,`}
      "confidence": 3,
      "rationale": "justificação curta"
    }
  ]
}
"confidence" é um inteiro de 1 (arriscado) a 5 (forte). "kickoffLisbon" é a hora em Lisboa.${outputLanguageBlock(lang, ["summary", "sport", "competition", "market", "selection", "rationale"])}${insist}`;
}

/** Uma chamada ao modelo. Devolve o texto bruto. */
async function callModel(prompt: string): Promise<string> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.4,
      // Sem "thinking" de propósito: medido no free tier, o raciocínio ligado
      // devolve 503 ("high demand") de forma consistente com o grounding
      // ativo, enquanto sem ele a chamada estabiliza em ~13s. A folga dos 60s
      // é gasta em REPETIÇÕES, que valem mais aqui do que thinking.
      thinkingConfig: { thinkingBudget: 0 },
    },
  });
  return String((response as any).text ?? "");
}

/**
 * Troca os IDs escolhidos pelo modelo pelos precos REAIS da base de dados.
 *
 * O modelo nunca escreve um preco: escolhe uma seleccao e o numero vem daqui.
 * Uma pick com um ID que nao esteja na ementa e DESCARTADA - e a unica forma
 * de garantir que nada inventado chega ao utilizador. E a mesma disciplina do
 * analisador de apostas, onde o modelo estima a probabilidade e o codigo faz
 * as contas.
 */
function resolvePicks(
  conteudo: { summary: string; picks: Pick[] },
  opcoes: Map<string, OpcaoDoDia>,
) {
  const picks: Pick[] = [];
  let descartadas = 0;

  for (const pick of conteudo.picks) {
    const id = String((pick as any).selectionId ?? "").trim();
    const real = opcoes.get(id);
    if (!real) {
      descartadas++;
      continue;
    }
    picks.push({
      ...pick,
      // Tudo o que e facto vem da captura; do modelo fica so o julgamento.
      competition: real.competition ?? pick.competition,
      match: real.match,
      kickoffLisbon: real.kickoffLisbon || pick.kickoffLisbon,
      market: real.market,
      selection: real.selection,
      approxOdd: real.odd,
      noVigOdd: real.noVig,
      marginPct: real.marginPct,
    });
  }

  if (descartadas > 0) {
    console.warn(`[insights] ${descartadas} pick(s) descartada(s) por ID desconhecido.`);
  }
  if (picks.length === 0) {
    throw new Error("Nenhuma pick com seleção real - o modelo ignorou a lista.");
  }
  return { summary: conteudo.summary, picks };
}

/**
 * Gera as dicas com repetições. Cobre as duas falhas reais e observadas:
 * o 503 "high demand" da API, e a resposta sem JSON (o grounding impede
 * responseSchema, por isso o formato nunca é garantido no pedido).
 */
async function generateInsights(dateLisbon: string, lang: Lang) {
  const started = Date.now();
  let lastError: unknown = new Error("Falha desconhecida ao gerar insights.");

  // As odds reais do dia, quando o agente as capturou. Sem elas o prompt volta
  // ao que era e o modelo procura os jogos sozinho.
  const opcoes = await loadDailyOdds(dateLisbon);
  const menu = opcoes.size > 0 ? menuDoDia(opcoes) : "";
  console.info(
    `[insights] ${dateLisbon}: ${opcoes.size} selecao(oes) real(is) disponivel(eis)` +
      (opcoes.size === 0 ? " - o modelo vai procurar os jogos sozinho" : ""),
  );

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // Nunca começar uma tentativa que arrisque estourar o limite da função.
    if (attempt > 1 && Date.now() - started > TIME_BUDGET_MS) break;

    try {
      const text = await callModel(buildPrompt(dateLisbon, attempt > 1, lang, menu));
      const conteudo = sanitizeContent(extractJson(text));
      return opcoes.size > 0 ? resolvePicks(conteudo, opcoes) : conteudo;
    } catch (err) {
      lastError = err;
      console.warn(
        `[insights] tentativa ${attempt}/${MAX_ATTEMPTS} falhou:`,
        (err as Error)?.message
      );
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
  }

  throw lastError;
}

// ============================================================
// Avaliação de apostas (print e/ou texto) -> Valor Esperado
// O modelo pesquisa e estima a PROBABILIDADE justa; os números (EV, prob.
// implícita, edge, odd justa, Kelly) são calculados AQUI, deterministicamente,
// porque os modelos erram aritmética. Sem cache - cada aposta é única.
// ============================================================
const EVAL_MAX_ATTEMPTS = 2;
const EVAL_TIME_BUDGET_MS = 45_000;
const EVAL_MAX_BETS = 8;

interface EvaluatedLeg {
  event: string;
  selection: string;
  estimatedProbability: number;
}

function buildEvalPrompt(dateLisbon: string, userText: string, hasImage: boolean, insistOnJson: boolean, lang: Lang): string {
  const langBlock = outputLanguageBlock(lang, ["sport", "competition", "market", "selection", "justification", "keyFactors", "risks"]);
  const insist = insistOnJson
    ? `\n\nATENÇÃO: a resposta anterior não continha JSON válido. Responde SÓ com o objeto JSON, a começar em { e a terminar em }. Sem texto antes ou depois, sem blocos de código.`
    : "";

  const sources =
    hasImage && userText
      ? "no print do boletim (imagem) e na descrição escrita abaixo"
      : hasImage
        ? "no print do boletim fornecido (imagem)"
        : "na descrição escrita abaixo";

  const textBlock = userText ? `\n\nDescrição do utilizador:\n"""\n${userText}\n"""` : "";

  return `Hoje é ${dateLisbon} (fuso Europe/Lisbon). És um analista quantitativo de apostas desportivas - rigoroso, calibrado e prudente - ${LANG_INSTRUCTION[lang]}.

TAREFA: avaliar a(s) aposta(s) descrita(s) ${sources} e determinar se têm VALOR ESPERADO positivo (se a odd oferecida é generosa face à probabilidade real).${textBlock}

PASSO 1: IDENTIFICAR. Para cada aposta extrai: desporto, competição, evento (equipas/atletas), mercado, a seleção escolhida, a casa de apostas e a ODD DECIMAL oferecida.${hasImage ? " Lê estes dados diretamente do boletim na imagem." : ""} Se a odd não estiver indicada, estima a odd de mercado atual a partir da pesquisa. Se a aposta juntar várias seleções (acumulador/múltipla), classifica-a como "MULTIPLA" e lista cada perna em "legs".

PASSO 2: PESQUISAR (USA A PESQUISA GOOGLE, obrigatório). Para cada evento, reúne informação ATUAL e factual: se o jogo ainda não começou (data/hora); forma recente; confrontos diretos (H2H); lesões, castigos e ausências; onze/rotação provável; casa vs fora; motivação (classificação, objetivos, calendário/fadiga); condições relevantes (piso, clima); e as ODDS DE MERCADO atuais em várias casas europeias para aferires o consenso. Usa apenas o que confirmares na pesquisa - NÃO inventes jogos, equipas, lesões nem odds. Se o evento já terminou ou não existe, di-lo na justificação e baixa a confiança.

PASSO 3: ESTIMAR A PROBABILIDADE justa da seleção ("estimatedProbability", decimal entre 0.02 e 0.98), com honestidade e calibração:
- Ancora na probabilidade implícita do consenso de mercado (a odd de mercado, já descontada a margem da casa) e ajusta com a tua análise. Afasta-te do mercado apenas quando a pesquisa o justificar claramente.
- Quando a informação é escassa, aproxima-te da probabilidade implícita e baixa a confiança.
- Evita excesso de confiança. Para múltiplas, estima a probabilidade combinada tendo em conta a correlação entre pernas.

REGRA CRÍTICA: NÃO EMITAS VEREDITO DE VALOR. Não calcules nem menciones o Valor Esperado, a probabilidade implícita, a odd justa, "edge", nem afirmes que a aposta "tem valor", "é boa", "vale a pena" ou o contrário. Esses números são calculados pelo sistema a partir da "offeredOdd" e da tua "estimatedProbability" - se opinares sobre valor, entras em contradição com o cálculo. Limita-te a reportar os factos e a fundamentar a PROBABILIDADE que estimaste.

Para cada aposta escreve ainda: uma "justification" clara e honesta (2 a 4 frases) que explique COMO chegaste à probabilidade (forma, H2H, ausências, contexto, consenso de mercado) e termine aí, sem juízo de valor; 2 a 5 "keyFactors" (os fatores que mais pesam) e 1 a 4 "risks" (incertezas ou cenários adversos).

Responde SÓ com JSON válido, a começar em { e a terminar em }, sem texto à volta nem blocos de código, neste formato:
{
  "bets": [
    {
      "type": "SIMPLES",
      "sport": "Futebol",
      "competition": "Liga Portugal",
      "event": "Equipa A vs Equipa B",
      "market": "Resultado Final",
      "selection": "Equipa A",
      "bookmaker": "Betano",
      "offeredOdd": 2.10,
      "estimatedProbability": 0.50,
      "confidence": 3,
      "justification": "...",
      "keyFactors": ["...", "..."],
      "risks": ["..."],
      "legs": [{ "event": "Equipa A vs Equipa B", "selection": "Equipa A", "estimatedProbability": 0.50 }]
    }
  ]
}
"confidence" é um inteiro de 1 (muito incerto) a 5 (muito seguro). Inclui "legs" apenas em múltiplas.${insist}`;
}

async function callEvalModel(prompt: string, imageBase64?: string): Promise<string> {
  const ai = getGeminiClient();
  const parts: any[] = [];
  if (imageBase64) {
    const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
    parts.push({
      inlineData: {
        mimeType: match ? match[1] : "image/png",
        data: match ? match[2] : imageBase64,
      },
    });
  }
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts }],
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.3,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });
  return String((response as any).text ?? "");
}

const clampProb = (p: number) => Math.min(0.98, Math.max(0.02, p));

/**
 * Normaliza o JSON do modelo e calcula os números no servidor a partir de
 * (offeredOdd, estimatedProbability): EV por unidade, prob. implícita, edge,
 * odd justa, Kelly e um veredito. Nada de aritmética confiada ao modelo.
 */
function sanitizeEvaluation(raw: any, lang: Lang): { summary: string; bets: any[] } {
  const clip = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
  const clipArr = (v: unknown, maxItems: number, maxLen: number) =>
    (Array.isArray(v) ? v : [])
      .map((x) => clip(x, maxLen))
      .filter(Boolean)
      .slice(0, maxItems);

  const bets = (Array.isArray(raw?.bets) ? raw.bets : [])
    .map((b: any) => {
      const offeredOdd = Number(b?.offeredOdd);
      const prob = clampProb(Number(b?.estimatedProbability));
      if (!Number.isFinite(offeredOdd) || offeredOdd <= 1 || !Number.isFinite(prob)) return null;

      const impliedProbability = 1 / offeredOdd;
      const fairOdd = 1 / prob;
      const expectedValue = prob * offeredOdd - 1; // lucro médio por 1 unidade apostada
      const edge = prob - impliedProbability; // vantagem sobre o mercado
      // Kelly completo: fração do banco que maximiza o crescimento (só se +EV).
      const kelly = offeredOdd > 1 ? (prob * offeredOdd - 1) / (offeredOdd - 1) : 0;

      let verdict: "VALOR" | "JUSTA" | "SEM_VALOR";
      if (expectedValue >= 0.05) {
        verdict = "VALOR";
      } else if (expectedValue >= -0.02) {
        verdict = "JUSTA";

      } else {
        verdict = "SEM_VALOR";
      }

      const legs: EvaluatedLeg[] = (Array.isArray(b?.legs) ? b.legs : [])
        .map((l: any) => ({
          event: clip(l?.event, 120),
          selection: clip(l?.selection, 120),
          estimatedProbability: clampProb(Number(l?.estimatedProbability)),
        }))
        .filter((l: EvaluatedLeg) => l.event || l.selection)
        .slice(0, 12);

      return {
        type: b?.type === "MULTIPLA" ? "MULTIPLA" : "SIMPLES",
        sport: clip(b?.sport, 40),
        competition: clip(b?.competition, 90),
        event: clip(b?.event, 140),
        market: clip(b?.market, 90),
        selection: clip(b?.selection, 140),
        bookmaker: clip(b?.bookmaker, 40),
        offeredOdd: Number(offeredOdd.toFixed(2)),
        estimatedProbability: Number(prob.toFixed(4)),
        impliedProbability: Number(impliedProbability.toFixed(4)),
        fairOdd: Number(fairOdd.toFixed(2)),
        expectedValue: Number(expectedValue.toFixed(4)),
        expectedValuePct: Number((expectedValue * 100).toFixed(1)),
        edgePct: Number((edge * 100).toFixed(1)),
        kellyFraction: Number(Math.max(0, kelly).toFixed(3)),
        verdict,
        verdictLabel: VERDICT_LABELS[lang][verdict],
        confidence: Math.min(5, Math.max(1, Math.round(Number(b?.confidence) || 3))),
        justification: clip(b?.justification, 700),
        keyFactors: clipArr(b?.keyFactors, 5, 200),
        risks: clipArr(b?.risks, 4, 200),
        legs: legs.length > 0 ? legs : undefined,
      };
    })
    .filter((b: any) => b && b.selection && b.event)
    .slice(0, EVAL_MAX_BETS);

  if (bets.length === 0) throw new Error("O modelo não conseguiu avaliar nenhuma aposta.");
  // O resumo é DERIVADO dos números calculados, nunca copiado do modelo: a
  // prosa do modelo já afirmou "valor positivo" numa aposta que o cálculo dava
  // como -EV, contradizendo o cartão. Assim o veredito tem uma única fonte.
  return { summary: buildEvalSummary(bets, lang), bets };
}

/** Resumo determinístico, coerente por construção com os vereditos calculados. */
function buildEvalSummary(bets: any[], lang: Lang): string {
  const evStr = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

  if (bets.length === 1) {
    const b = bets[0];
    const above = b.offeredOdd >= b.fairOdd;
    if (lang === "en") {
      const polarity =
        b.verdict === "VALOR" ? "positive" : b.verdict === "SEM_VALOR" ? "negative" : "practically neutral";
      const comparison = above
        ? `The offered odds (${b.offeredOdd.toFixed(2)}) are above the estimated fair odds (${b.fairOdd.toFixed(2)}).`
        : `The offered odds (${b.offeredOdd.toFixed(2)}) are below the estimated fair odds (${b.fairOdd.toFixed(2)}).`;
      return `${polarity.charAt(0).toUpperCase()}${polarity.slice(1)} expected value: ${evStr(b.expectedValuePct)} per unit staked. ${comparison}`;
    }
    const polarity =
      b.verdict === "VALOR" ? "positivo" : b.verdict === "SEM_VALOR" ? "negativo" : "praticamente neutro";
    const comparison = above
      ? `A odd oferecida (${b.offeredOdd.toFixed(2)}) está acima da odd justa estimada (${b.fairOdd.toFixed(2)}).`
      : `A odd oferecida (${b.offeredOdd.toFixed(2)}) está abaixo da odd justa estimada (${b.fairOdd.toFixed(2)}).`;
    return `Valor esperado ${polarity}: ${evStr(b.expectedValuePct)} por unidade apostada. ${comparison}`;
  }

  const pos = bets.filter((b) => b.verdict === "VALOR").length;
  const neg = bets.filter((b) => b.verdict === "SEM_VALOR").length;
  const neutral = bets.length - pos - neg;
  const parts: string[] = [];
  if (lang === "en") {
    if (pos) parts.push(`${pos} with positive expected value`);
    if (neutral) parts.push(`${neutral} close to fair value`);
    if (neg) parts.push(`${neg} with negative expected value`);
    return `${bets.length} bets evaluated: ${parts.join(", ")}.`;
  }
  if (pos) parts.push(`${pos} com valor esperado positivo`);
  if (neutral) parts.push(`${neutral} perto do valor justo`);
  if (neg) parts.push(`${neg} com valor esperado negativo`);
  return `${bets.length} apostas avaliadas: ${parts.join(", ")}.`;
}

async function evaluateBet(input: { imageBase64?: string; text: string; lang: Lang }) {
  const started = Date.now();
  let lastError: unknown = new Error("Falha desconhecida ao avaliar a aposta.");

  for (let attempt = 1; attempt <= EVAL_MAX_ATTEMPTS; attempt++) {
    if (attempt > 1 && Date.now() - started > EVAL_TIME_BUDGET_MS) break;
    try {
      const prompt = buildEvalPrompt(todayInLisbon(), input.text, Boolean(input.imageBase64), attempt > 1, input.lang);
      const text = await callEvalModel(prompt, input.imageBase64);
      return sanitizeEvaluation(extractJson(text), input.lang);
    } catch (err) {
      lastError = err;
      console.warn(`[insights] avaliação tentativa ${attempt}/${EVAL_MAX_ATTEMPTS} falhou:`, (err as Error)?.message);
      if (attempt < EVAL_MAX_ATTEMPTS) await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  throw lastError;
}

/**
 * Devolve a linha de hoje, gerando-a se ainda não existir. Partilhada pelo
 * pedido do utilizador e pelo cron - o cron aquece a cache de madrugada e o
 * utilizador normal só lê; se o cron falhar, o primeiro pedido ainda gera.
 */
async function ensureInsightsForDate(date: string, lang: Lang) {
  const cached = await pool.query(
    "SELECT content, created_at FROM daily_insights WHERE insight_date = $1 AND lang = $2",
    [date, lang]
  );
  if (cached.rows.length > 0) {
    return { row: cached.rows[0], generated: false };
  }

  const content = await generateInsights(date, lang);

  // Corrida entre instâncias serverless: o UNIQUE decide; quem perde relê.
  await pool.query(
    `INSERT INTO daily_insights (insight_date, lang, content, model)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (insight_date, lang) DO NOTHING`,
    [date, lang, JSON.stringify(content), MODEL]
  );
  const final = await pool.query(
    "SELECT content, created_at FROM daily_insights WHERE insight_date = $1 AND lang = $2",
    [date, lang]
  );
  return {
    row: final.rows[0] ?? { content, created_at: new Date().toISOString() },
    generated: true,
  };
}

// ============================================================
// GET /api/insights/cron -> pré-gera as dicas do dia (Vercel Cron)
// Fica ANTES do authenticateToken: não há utilizador, a autenticação é o
// segredo partilhado que a Vercel envia em Authorization: Bearer.
// ============================================================
router.get("/cron", async (req, res) => {
  const secret = process.env.CRON_SECRET;
  // Fail closed: sem segredo configurado, ninguém dispara a geração.
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: "Não autorizado." });
    return;
  }

  const date = todayInLisbon();
  try {
    // O cron aquece a cache de TODOS os idiomas suportados: caso contrário o
    // primeiro utilizador do dia na outra língua pagava a geração na hora.
    const generatedLangs: string[] = [];
    for (const lang of SUPPORTED_LANGS) {
      const { generated } = await ensureInsightsForDate(date, lang);
      if (generated) generatedLangs.push(lang);
    }
    res.json({ date, generated: generatedLangs.length > 0, langs: generatedLangs, model: MODEL });
  } catch (error: any) {
    console.error("[insights] cron falhou:", error);
    res.status(503).json({ date, error: error?.message || "Falha ao gerar." });
  }
});

// Daqui para baixo é tudo funcionalidade paga: primeiro identifica-se quem
// pede, depois confirma-se que tem subscrição (ou período experimental).
// O /cron fica acima de propósito - não tem utilizador nem subscrição.
router.use(authenticateToken);
router.use(requireSubscription);

// ============================================================
// GET /api/insights -> dicas de hoje (lê a cache; gera se o cron não correu)
// ============================================================
router.get("/", async (req: AuthenticatedRequest, res) => {
  const date = todayInLisbon();
  const lang = cleanLang(req.query.lang);
  try {
    const { row } = await ensureInsightsForDate(date, lang);
    res.json({
      date,
      lang,
      generatedAt: row?.created_at ?? new Date().toISOString(),
      ...row?.content,
    });
  } catch (error: any) {
    console.error("Erro ao gerar insights:", error);
    res.status(503).json({
      error: "Não foi possível gerar as dicas de hoje. Tenta novamente dentro de momentos.",
    });
  }
});

// ============================================================
// POST /api/insights/evaluate -> avalia uma aposta (print e/ou texto)
// Sem cache: cada aposta é única. Rate limit herdado de /api/insights.
// ============================================================
router.post("/evaluate", async (req: AuthenticatedRequest, res) => {
  const { imageBase64, text } = req.body ?? {};
  const lang = cleanLang(req.body?.lang);
  const hasImage = typeof imageBase64 === "string" && imageBase64.trim().length > 0;
  const cleanText = typeof text === "string" ? text.trim().slice(0, 2000) : "";

  if (!hasImage && !cleanText) {
    res.status(400).json({ error: "Fornece um print do boletim ou uma descrição da aposta." });
    return;
  }

  try {
    const result = await evaluateBet({ imageBase64: hasImage ? imageBase64 : undefined, text: cleanText, lang });
    res.json({ evaluatedAt: new Date().toISOString(), ...result });
  } catch (error: any) {
    console.error("[insights] avaliação falhou:", error?.message);
    res.status(503).json({
      error: "Não foi possível avaliar a aposta agora. Tenta novamente dentro de momentos.",
    });
  }
});

export default router;
