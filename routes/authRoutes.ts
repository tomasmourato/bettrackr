import { Router } from "express";
// bcryptjs (JS puro) em vez de bcrypt: o binário nativo do bcrypt resolve o
// caminho do .node em runtime, o que impede o bundler da Vercel de o incluir
// na função serverless (FUNCTION_INVOCATION_FAILED no arranque). Os hashes
// $2b$ são compatíveis entre os dois pacotes.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db/pool.js";
import {
  authenticateToken,
  AuthenticatedRequest,
  SESSION_COOKIE,
  tokenFromRequest,
} from "../middleware/authMiddleware.js";

const router = Router();
const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = "7d";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function setSessionCookie(res: any, token: string) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: Boolean(process.env.VERCEL) || process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS,
  });
}

// Hash pré-calculado de um valor aleatório. Usado no login quando o email não
// existe, para que o pedido demore o mesmo tempo que uma comparação real —
// senão a diferença de tempos revelava quais os emails registados.
const DUMMY_HASH = "$2b$12$N8eQ/Iq6zWr0kJfw.5gQCekaPVYadHUlGBDikr.Qg3ChTNIW6gQUa";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is missing.");
  return secret;
}

function isValidEmail(email: string): boolean {
  return typeof email === "string" && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 3–32 caracteres: letras, números, ponto, hífen e underscore.
function isValidUsername(username: string): boolean {
  return typeof username === "string" && /^[A-Za-z0-9_.-]{3,32}$/.test(username);
}

// O algoritmo bcrypt só considera os primeiros 72 bytes da password; aceitar
// mais do que isso daria uma falsa sensação de segurança.
function validatePassword(password: unknown): string | null {
  if (typeof password !== "string" || password.length < 8) {
    return "A password deve ter pelo menos 8 caracteres.";
  }
  if (Buffer.byteLength(password, "utf8") > 72) {
    return "A password não pode exceder 72 bytes.";
  }
  return null;
}

// A extensão identifica-se no login ({ client: "extension" }) e isso fica
// gravado no token. É assim que o servidor sabe distinguir um pedido da
// extensão (funcionalidade paga) de um pedido do site (registo manual de
// apostas, que é grátis) sem confiar num header que qualquer um troca.
const KNOWN_CLIENTS = ["extension"] as const;

function cleanClient(raw: unknown): string | undefined {
  return typeof raw === "string" && (KNOWN_CLIENTS as readonly string[]).includes(raw) ? raw : undefined;
}

function signToken(user: { id: string; username: string }, client?: string): string {
  return jwt.sign(
    { id: user.id, username: user.username, ...(client ? { client } : {}) },
    getJwtSecret(),
    { expiresIn: TOKEN_EXPIRY }
  );
}

// ============================================================
// POST /api/auth/register
// ============================================================
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body ?? {};

    if (!username || !email || !password) {
      res.status(400).json({ error: "username, email e password são obrigatórios." });
      return;
    }
    if (!isValidUsername(username)) {
      res.status(400).json({ error: "Username inválido: 3 a 32 caracteres (letras, números, '.', '-' ou '_')." });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: "Email inválido." });
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      res.status(400).json({ error: passwordError });
      return;
    }

    // Verifica se já existe um utilizador com este username ou email
    const existing = await pool.query(
      "SELECT id FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "Username ou email já estão em uso." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [username, email, passwordHash]
    );

    const user = result.rows[0];
    const token = signToken(user);
    setSessionCookie(res, token);

    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error: any) {
    console.error("Erro no registo:", error);
    res.status(500).json({ error: "Erro ao criar conta." });
  }
});

// ============================================================
// POST /api/auth/login
// ============================================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "email e password são obrigatórios." });
      return;
    }

    const result = await pool.query(
      "SELECT id, username, email, password_hash FROM users WHERE email = $1",
      [email]
    );

    // Mensagem genérica de propósito: não revelar se foi o email ou a
    // password que falhou, para não facilitar enumeração de contas.
    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(
      password,
      user ? user.password_hash : DUMMY_HASH
    );

    if (!user || !passwordMatches) {
      res.status(401).json({ error: "Credenciais inválidas." });
      return;
    }

    const token = signToken(user, cleanClient(req.body?.client));
    setSessionCookie(res, token);

    res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error: any) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro ao autenticar." });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure: Boolean(process.env.VERCEL) || process.env.COOKIE_SECURE === "true",
    path: "/",
  });
  res.status(204).end();
});

// ============================================================
// GET /api/auth/me  (rota protegida — devolve o utilizador atual)
// ============================================================
router.get("/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, created_at FROM users WHERE id = $1",
      [req.user!.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Utilizador não encontrado." });
      return;
    }
    const token = tokenFromRequest(req);
    if (token) setSessionCookie(res, token);
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Erro ao obter utilizador:", error);
    res.status(500).json({ error: "Erro ao obter dados do utilizador." });
  }
});

// ============================================================
// POST /api/auth/change-password  (rota protegida)
//
// Pede a password atual mesmo já tendo um token valido: um telemovel deixado
// aberto ou um token roubado nao devem chegar para trocar a fechadura da
// conta. E o mesmo principio do "sudo" -- estar dentro nao e o mesmo que
// poder mudar as chaves.
//
// Responde 403 (e nao 401) quando a password atual esta errada. Nao e
// pedantismo de status: o authFetch do cliente trata QUALQUER 401 como sessao
// expirada e faz logout (ver src/lib/authApi.ts), por isso um 401 aqui punha
// o utilizador fora da app por causa de uma gralha. O 401 fica reservado a
// "a tua sessao morreu", que e o que o cliente sabe tratar.
//
// O que esta rota NAO faz: terminar as sessoes dos outros dispositivos. Os
// tokens sao JWT sem estado e revoga-los exigia guardar uma versao por
// utilizador e compara-la em cada pedido. Fica escrito para nao parecer
// esquecimento.
// ============================================================
router.post("/change-password", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body ?? {};

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      !newPassword
    ) {
      res.status(400).json({
        code: "MISSING_FIELDS",
        error: "A password atual e a nova são obrigatórias.",
      });
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      res.status(400).json({ code: "WEAK_PASSWORD", error: passwordError });
      return;
    }

    if (currentPassword === newPassword) {
      res.status(400).json({
        code: "SAME_PASSWORD",
        error: "A nova password tem de ser diferente da atual.",
      });
      return;
    }

    const result = await pool.query("SELECT id, username, password_hash FROM users WHERE id = $1", [
      req.user!.id,
    ]);
    const user = result.rows[0];
    if (!user) {
      res.status(404).json({ error: "Utilizador não encontrado." });
      return;
    }

    const matches = await bcrypt.compare(currentPassword, user.password_hash);
    if (!matches) {
      res.status(403).json({
        code: "INVALID_CURRENT_PASSWORD",
        error: "A password atual não está correta.",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, user.id]);

    // Token novo: o antigo continua valido (JWT sem estado), mas assinar um
    // agora faz a sessao atual recomecar o relogio dos 7 dias em vez de
    // expirar pouco depois de o utilizador ter reforcado a conta.
    const token = signToken({ id: user.id, username: user.username });
    setSessionCookie(res, token);

    res.json({ success: true, token });
  } catch (error) {
    console.error("Erro ao alterar a password:", error);
    res.status(500).json({ error: "Erro ao alterar a password." });
  }
});

// ============================================================
// POST /api/auth/extension-token  (rota protegida)
//
// Troca a sessao do site por um token que se identifica como extensao.
//
// Porque existe: a extensao tem duas maneiras de arranjar sessao -- o login
// no proprio popup (que ja envia client: "extension") e a captura do token
// que a app deixa no localStorage. A segunda e o caminho normal, e produzia
// um token identico ao do site: o requireSubscriptionForExtension olhava
// para ele, nao via client === "extension", e deixava passar. Resultado: a
// importacao das casas, que e paga, funcionava sem subscricao.
//
// A troca nao verifica subscricao de proposito. Quem nao tem Pro fica na
// mesma com um token valido e leva 402 ao tentar importar -- que e um erro
// que a extensao sabe explicar. Recusar aqui daria um erro de sessao, que
// manda o utilizador procurar o problema no sitio errado.
// ============================================================
router.post("/extension-token", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const token = signToken({ id: req.user!.id, username: req.user!.username }, "extension");
    res.json({ success: true, token });
  } catch (error) {
    console.error("Erro ao emitir o token da extensão:", error);
    res.status(500).json({ error: "Erro ao preparar a sessão da extensão." });
  }
});

export default router;
