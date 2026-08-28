// scripts/run-migration.mjs
// Corre um ficheiro de migração contra a base de dados do ambiente ativo.
//
// Existe porque as migrações são idempotentes mas ninguém as corre sozinho: o
// deploy da Vercel não executa SQL, e sem psql instalado não havia forma fácil
// de as aplicar. A resolução do .env é a MESMA do server.ts (incluindo o
// .env.<branch>.local), para este script nunca escrever na base de dados
// errada por estar a ler outro ficheiro de ambiente.
//
// Uso: node scripts/run-migration.mjs db/migrations/019_clv_closing_odd.sql

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

let gitBranch = "";
try {
  gitBranch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim();
} catch {
  /* fora de um repositório git: fica só com o .env.local */
}
if (gitBranch && existsSync(`.env.${gitBranch}.local`)) {
  dotenv.config({ path: `.env.${gitBranch}.local`, override: true });
  console.log(`Ambiente: .env.${gitBranch}.local (branch ${gitBranch}).`);
}

const file = process.argv[2];
if (!file) {
  console.error("Uso: node scripts/run-migration.mjs <ficheiro.sql>");
  process.exit(1);
}
if (!existsSync(file)) {
  console.error(`Ficheiro não encontrado: ${file}`);
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não definida.");
  process.exit(1);
}

const sql = readFileSync(file, "utf8");
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("localhost")
    ? undefined
    : { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log(`Migração aplicada: ${file}`);
} catch (error) {
  console.error(`Falhou: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
