// scripts/check-i18n.mjs
// Porteiro da tradução. Corre no `npm run lint` (a seguir ao tsc) e falha
// quando a i18n regride. Verifica três coisas:
//
//   1. COMPLETUDE   — toda a chave do pt.ts existe no en.ts e vice-versa.
//                     (o tipo Record<TKey, Entry> do en.ts já garante isto no
//                     tsc; aqui a mensagem de erro é legível e lista as chaves)
//   2. MARCADORES   — as duas línguas usam os mesmos {marcadores} por chave, e
//                     as entradas plurais são plurais em ambas.
//   3. REGRESSÕES   — os ficheiros já migrados (MIGRATED, abaixo) não voltam a
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
  // Fase 1 — Configurações (desktop + mobile) e cartões partilhados
  "src/components/Settings.tsx",
  "src/components/EnabledBookmakersCard.tsx",
  "src/components/BookieAccountsCard.tsx",
  "src/mobile/screens/MobileSettings.tsx",

  // Fase 2 — Painel e histórico de apostas (desktop + mobile)
  "src/components/Dashboard.tsx",
  "src/mobile/screens/MobileDashboard.tsx",
  "src/components/BetsManager.tsx",
  "src/mobile/screens/MobileBets.tsx",
  "src/hooks/useBetForm.ts",

  // Fase 3 — Filtros, social, autenticação e ecrã de erro
  "src/components/TimeframeFilter.tsx",
  "src/components/FiltersBar.tsx",
  "src/components/Social.tsx",
  "src/mobile/screens/MobileSocial.tsx",
  "src/components/AuthPage.tsx",
  "src/components/ErrorBoundary.tsx",
];

// Palavras inequivocamente portuguesas que não levam acento (as acentuadas são
// apanhadas pelo teste dos caracteres). Só palavras inteiras.
const PT_WORDS = [
  "aposta", "apostas", "conta", "contas", "casa", "casas", "dados", "ficheiro",
  "guardar", "apagar", "cancelar", "utilizador", "nenhum", "nenhuma", "todos",
  "todas", "escolhe", "repor", "moeda", "idioma",
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

if (pt.size === 0) errors.push("pt.ts: nenhuma chave encontrada — o formato mudou?");

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
    errors.push(`"${key}": marcadores diferentes — pt {${a || "—"}} vs en {${b || "—"}}`);
  }
}

// ----------------------------------------------------------------
// 3. Regressões nos ficheiros migrados
// ----------------------------------------------------------------

// Ignora o que não é texto de interface:
//   - comentários (o código é comentado em português de propósito);
//   - chamadas console.* — diagnóstico para quem desenvolve, não para quem
//     usa a app, por isso não são traduzidas (mesma categoria dos comentários).
function stripNoise(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/console\.\w+\([\s\S]*?\);/g, "");
}

for (const file of MIGRATED) {
  let source;
  try {
    source = readFileSync(join(root, file), "utf8");
  } catch {
    warnings.push(`MIGRATED aponta para um ficheiro que não existe: ${file}`);
    continue;
  }
  const cleaned = stripNoise(source);
  cleaned.split("\n").forEach((line, index) => {
    if (!PT_ACCENTS.test(line) && !PT_WORD_RE.test(line)) return;
    errors.push(`${file}:${index + 1}: português fixo num ficheiro já traduzido — ${line.trim().slice(0, 90)}`);
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
  `check-i18n: ok — ${pt.size} chaves x 2 idiomas, ${MIGRATED.length} ficheiro(s) migrado(s) sem regressões.`
);
