// scripts/check-i18n.mjs
// Porteiro da tradução. Corre no `npm run lint` (a seguir ao tsc) e falha
// quando a i18n regride. Verifica três coisas:
//
//   1. COMPLETUDE   - toda a chave do pt.ts existe no en.ts e vice-versa.
//                     (o tipo Record<TKey, Entry> do en.ts já garante isto no
//                     tsc; aqui a mensagem de erro é legível e lista as chaves)
//   2. MARCADORES   - as duas línguas usam os mesmos {marcadores} por chave, e
//                     as entradas plurais são plurais em ambas.
//   3. REGRESSÕES   - os ficheiros já migrados (MIGRATED, abaixo) não voltam a
//                     ganhar texto em português fixo. É esta a rede que impede
//                     que uma funcionalidade nova reintroduza strings soltas
//                     num ecrã que já estava traduzido.
//
// Ao terminar cada fase, acrescenta os ficheiros dessa fase ao MIGRATED.
// Uso: node scripts/check-i18n.mjs

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const I18N_DIR = join(root, "src", "lib", "i18n");

// ----------------------------------------------------------------
// Ficheiros considerados traduzidos. Um ficheiro nesta lista não pode conter
// português fora de comentários. Cresce a cada fase.
// ----------------------------------------------------------------
const MIGRATED = [
  // Fase 1 - Configurações (desktop + mobile) e cartões partilhados
  "src/components/Settings.tsx",
  "src/components/EnabledBookmakersCard.tsx",
  "src/components/BookieAccountsCard.tsx",
  "src/components/BankrollCard.tsx",
  "src/mobile/screens/MobileSettings.tsx",

  // Fase 2 - Painel e histórico de apostas (desktop + mobile)
  "src/components/Dashboard.tsx",
  "src/mobile/screens/MobileDashboard.tsx",
  "src/components/BetsManager.tsx",
  "src/mobile/screens/MobileBets.tsx",
  "src/hooks/useBetForm.ts",

  // Fase 3 - Filtros, social, autenticação e ecrã de erro
  "src/components/TimeframeFilter.tsx",
  "src/components/FiltersBar.tsx",
  "src/components/Social.tsx",
  "src/mobile/screens/MobileSocial.tsx",
  "src/components/AuthPage.tsx",
  "src/components/ErrorBoundary.tsx",

  // Fase 4 - Importação e IA
  "src/components/ScreenshotImporter.tsx",
  "src/components/BetclicImport.tsx",
  "src/mobile/screens/MobileImport.tsx",
  "src/components/AIInsights.tsx",
  "src/mobile/screens/MobileInsights.tsx",
  "src/hooks/useLoadingSteps.ts",
  "src/lib/betEvaluation.ts",

  // CLV (odd de fecho) - componentes nascidos já traduzidos
  "src/components/ClosingOddsModal.tsx",
  "src/mobile/components/ClosingOddsSheet.tsx",

  // Merge do PR #8 - componente novo, traduzido ao integrar
  "src/components/FilteredBetsSummary.tsx",

  // Subscrição e painel de gestão - nascidos já traduzidos
  "src/components/SubscriptionCard.tsx",
  "src/components/PaywallNotice.tsx",
  "src/components/AdminDashboard.tsx",
  "src/mobile/components/MobileSubscription.tsx",
  "src/mobile/screens/MobileAdmin.tsx",
  "src/lib/subscriptionDisplay.ts",
  "src/lib/adminDisplay.ts",
  "src/hooks/useBillingActions.ts",
  "src/hooks/useAdminPanel.ts",

  // Fase 5 - camada de erros: a chave do cliente ganha ao texto do servidor
  "src/lib/apiError.ts",
  "src/lib/accountsApi.ts",
  "src/lib/adminApi.ts",
  "src/lib/authApi.ts",
  "src/lib/bankrollApi.ts",
  "src/lib/betEvaluation.ts",
  "src/lib/betsApi.ts",
  "src/lib/billingApi.ts",
  "src/lib/botApi.ts",
  "src/lib/dataTransfer.ts",
  "src/lib/settingsApi.ts",
  "src/lib/socialApi.ts",
  "src/hooks/useAccounts.ts",
  "src/hooks/useBankroll.ts",
  "src/hooks/useBets.ts",
  "src/hooks/useSubscription.ts",
  "src/hooks/useBetclicExtension.ts",

  // Fase 5 - registo de alterações da sessão (chave + variáveis)
  "src/App.tsx",
  "src/hooks/useAuditLog.ts",
  "src/lib/auditDisplay.ts",

  // Fase 5 - ficheiros que já estavam traduzidos e faltava registar
  "src/components/BotPanel.tsx",
  "src/components/MemberProfile.tsx",
  "src/components/AccountPanel.tsx",
  "src/components/PasswordCard.tsx",
  "src/components/ClvLock.tsx",
  "src/mobile/AccountSheet.tsx",
  "src/mobile/components/MobileMemberProfile.tsx",
  "src/hooks/useChangePassword.ts",
];

// Palavras inequivocamente portuguesas que não levam acento (as acentuadas são
// apanhadas pelo teste dos caracteres). Só palavras inteiras.
const PT_WORDS = [
  "aposta", "apostas", "conta", "contas", "casa", "casas", "dados", "ficheiro",
  "guardar", "apagar", "cancelar", "utilizador", "nenhum", "nenhuma", "todos",
  "todas", "escolhe", "repor", "moeda", "idioma",
  // Sem acento e sem colisão com inglês - o teste dos acentos não as apanha.
  "erro", "imagem", "ocorreu", "inesperado", "decorridos", "recorta", "novamente",
  "excede", "seleciona", "boletim", "sucesso", "gravada", "gravar", "atualizada",
  "amigo", "amigos", "procurar", "carregar", "jogo", "jogos", "dinheiro",
  "montante", "escolha", "mercado", "pedido", "pedidos", "tenta",
];
const PT_ACCENTS = /[áàâãéêíóôõúüç]/i;
const PT_WORD_RE = new RegExp(`\\b(${PT_WORDS.join("|")})\\b`, "i");

const errors = [];
const warnings = [];

// ----------------------------------------------------------------
// 1 + 2. Dicionários
// ----------------------------------------------------------------

// As entradas estão todas a 2 espaços de indentação, uma por chave.
function readKeys(file) {
  const source = readFileSync(join(I18N_DIR, file), "utf8");
  const entries = new Map();
  const re = /^ {2}"([^"]+)":\s*(\{)?/gm;
  let match;
  while ((match = re.exec(source)) !== null) {
    // Corpo da entrada: até à linha que fecha (chaveta ou vírgula final).
    const rest = source.slice(match.index + match[0].length);
    const end = rest.search(/\n {2}"|\n\} ?;?\s*$|\n\};/);
    entries.set(match[1], {
      body: end === -1 ? rest : rest.slice(0, end),
      plural: Boolean(match[2]),
    });
  }
  return entries;
}

const pt = readKeys("pt.ts");
const en = readKeys("en.ts");

if (pt.size === 0) errors.push("pt.ts: nenhuma chave encontrada - o formato mudou?");

for (const key of pt.keys()) {
  if (!en.has(key)) errors.push(`en.ts: falta a chave "${key}"`);
}
for (const key of en.keys()) {
  if (!pt.has(key)) errors.push(`pt.ts: chave "${key}" existe em en.ts mas não aqui`);
}

const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

for (const [key, ptEntry] of pt) {
  const enEntry = en.get(key);
  if (!enEntry) continue;

  if (ptEntry.plural !== enEntry.plural) {
    errors.push(`"${key}": é plural em ${ptEntry.plural ? "pt" : "en"} mas não em ${ptEntry.plural ? "en" : "pt"}`);
  }
  const a = placeholders(ptEntry.body).join(",");
  const b = placeholders(enEntry.body).join(",");
  if (a !== b) {
    errors.push(`"${key}": marcadores diferentes - pt {${a || "-"}} vs en {${b || "-"}}`);
  }
}

// ----------------------------------------------------------------
// 3. Regressões nos ficheiros migrados
// ----------------------------------------------------------------

// Ignora o que não é texto de interface:
//   - comentários (o código é comentado em português de propósito);
//   - chamadas console.* - diagnóstico para quem desenvolve, não para quem
//     usa a app, por isso não são traduzidas (mesma categoria dos comentários).
// Uma linha marcada com `// i18n-ignore` fica de fora. É para o português que
// NÃO é interface: heurísticas que fazem match em dados de entrada
// portugueses, e tokens de formatos de ficheiro que têm de continuar iguais
// para os ficheiros antigos continuarem a entrar.
const IGNORE_RE = /\/\/\s*i18n-ignore/;

function stripNoise(source) {
  return source
    // O bloco vira linhas em branco em vez de desaparecer: os números de linha
    // dos erros têm de bater certo com o ficheiro.
    .replace(/\/\*[\s\S]*?\*\//g, (bloco) => bloco.replace(/[^\n]/g, ""))
    // `[^\n]` e não `.`: os ficheiros estão em CRLF, e um `.*$` com o `\s*`
    // à frente engolia as mudanças de linha à volta dos comentários - 47
    // linhas a menos só no dataTransfer, e todos os números de linha errados.
    .replace(/^[ \t]*\/\/[^\n]*/gm, "")
    .replace(/\/\/[^\n]*/g, "")
    // Só a chamada que cabe numa linha. Com [\s\S] apagava tudo entre um
    // console.* e o `);` seguinte - e o código que estivesse pelo meio deixava
    // de ser verificado. Era um ponto cego a sério: um "Erro ao obter as
    // apostas." no betsApi ficou fora de uma medição por causa disto.
    .replace(/console\.\w+\(.*\);?/g, "");
}

for (const file of MIGRATED) {
  let source;
  try {
    source = readFileSync(join(root, file), "utf8");
  } catch {
    warnings.push(`MIGRATED aponta para um ficheiro que não existe: ${file}`);
    continue;
  }
  const originais = source.split("\n");
  const cleaned = stripNoise(source);
  cleaned.split("\n").forEach((line, index) => {
    if (!PT_ACCENTS.test(line) && !PT_WORD_RE.test(line)) return;
    // A marca está na linha original: o stripNoise já lhe tirou o comentário.
    if (IGNORE_RE.test(originais[index] ?? "")) return;
    errors.push(`${file}:${index + 1}: português fixo num ficheiro já traduzido - ${line.trim().slice(0, 90)}`);
  });
}

// ----------------------------------------------------------------
// Aviso: chaves declaradas que ninguém usa
// ----------------------------------------------------------------

function collectSources(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (full.startsWith(I18N_DIR)) continue;
    if (statSync(full).isDirectory()) collectSources(full, acc);
    else if (/\.(ts|tsx)$/.test(name)) acc.push(full);
  }
  return acc;
}

const appSources = collectSources(join(root, "src"))
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");

const unused = [...pt.keys()].filter((key) => !appSources.includes(`"${key}"`));
if (unused.length > 0) {
  warnings.push(`${unused.length} chave(s) sem uso: ${unused.join(", ")}`);
}

// ----------------------------------------------------------------
// Relatório
// ----------------------------------------------------------------

for (const warning of warnings) console.warn(`  aviso: ${warning}`);

if (errors.length > 0) {
  console.error(`\ncheck-i18n: ${errors.length} erro(s)\n`);
  for (const error of errors) console.error(`  ${error}`);
  console.error(
    `\nFicheiros migrados: ${MIGRATED.length}. ` +
      `Para traduzir texto novo, acrescenta a chave em src/lib/i18n/pt.ts + en.ts e usa t("chave").\n`
  );
  process.exit(1);
}

console.log(
  `check-i18n: ok - ${pt.size} chaves x 2 idiomas, ${MIGRATED.length} ficheiro(s) migrado(s) sem regressões.`
);
