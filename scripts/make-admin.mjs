// Promove (ou despromove) uma conta a administrador.
//
// Existe porque há um problema do ovo e da galinha: o painel de gestão é o
// único sítio onde se criam administradores, mas só administradores lá
// entram. O primeiro tem de ser feito por aqui.
//
// O cargo 'founder' SÓ se atribui por aqui: o painel de gestão não lhe mexe,
// nem para o dar nem para o tirar. É isso que garante que um administrador
// promovido não consegue despromover quem o promoveu.
//
// Uso:
//   node --env-file=.env scripts/make-admin.mjs <email>
//   node --env-file=.env scripts/make-admin.mjs <email> --founder
//   node --env-file=.env scripts/make-admin.mjs <email> --remove
import pg from "pg";

const email = process.argv[2];
const remove = process.argv.includes("--remove");
const founder = process.argv.includes("--founder");

if (!email || (remove && founder)) {
  console.error("Uso: node --env-file=.env scripts/make-admin.mjs <email> [--founder | --remove]");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL não está definida no ambiente.");
  process.exit(1);
}

const isLocalDb = /localhost|127\.0\.0\.1/.test(connectionString);
const pool = new pg.Pool({
  connectionString,
  ssl: isLocalDb ? undefined : { rejectUnauthorized: false },
});

const role = remove ? "user" : founder ? "founder" : "admin";
const result = await pool.query(
  "UPDATE users SET role = $1 WHERE LOWER(email) = LOWER($2) RETURNING username, email, role",
  [role, email],
);

if (result.rows.length === 0) {
  console.error(`Nenhuma conta com o email ${email}.`);
  await pool.end();
  process.exit(1);
}

const user = result.rows[0];
console.log(`${user.username ?? user.email} -> ${user.role}`);

// Ficar sem nenhum administrador tranca o painel para sempre; avisa antes de
// isso ser uma surpresa.
const admins = await pool.query(
  "SELECT COUNT(*)::int AS total FROM users WHERE role IN ('admin', 'founder')",
);
console.log(`Com acesso ao painel agora: ${admins.rows[0].total}`);
if (admins.rows[0].total === 0) {
  console.warn("AVISO: não há nenhum administrador - o painel de gestão fica inacessível.");
}

await pool.end();
