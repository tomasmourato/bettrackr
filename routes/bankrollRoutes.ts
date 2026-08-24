// routes/bankrollRoutes.ts
// Banca: só entra aqui dinheiro real a entrar e a sair das casas. O saldo não
// é guardado nem devolvido por estas rotas - é derivado no cliente a partir
// destes movimentos mais o lucro das apostas já liquidadas (src/lib/bankroll.ts).
//
// O amount é gravado COM SINAL (depósito positivo, levantamento negativo) para
// o saldo ser um SUM directo. O sinal é decidido aqui a partir do kind, nunca
// se confia no que o cliente enviou.

import { Router } from "express";
import pool from "../db/pool.js";
import { authenticateToken, AuthenticatedRequest } from "../middleware/authMiddleware.js";

const router = Router();

// Todas as rotas exigem autenticação. Registar a banca é grátis, como registar
// apostas à mão - só a extensão e a IA é que exigem subscrição.
router.use(authenticateToken);

// O amount vem de uma coluna DECIMAL: sem o ::float8 o driver do pg devolve
// uma string e o frontend passa a somar texto. A data é pré-formatada no mesmo
// formato de Bet.dateTime, que é o que a fusão cronológica da série espera.
const MOVEMENT_COLUMNS = `
  id, kind, amount::float8 AS amount,
  to_char(occurred_at, 'YYYY-MM-DD HH24:MI') AS occurred_at,
  note, account_id, created_at
`;

const VALID_KINDS = ["DEPOSITO", "LEVANTAMENTO", "AJUSTE"] as const;
type Kind = (typeof VALID_KINDS)[number];

const MAX_NOTE_LENGTH = 200;
const MAX_AMOUNT = 1_000_000;
const MAX_MOVEMENTS = 5000;

function cleanKind(raw: unknown): Kind | null {
  if (typeof raw !== "string") return null;
  const kind = raw.trim().toUpperCase();
  return (VALID_KINDS as readonly string[]).includes(kind) ? (kind as Kind) : null;
}

/**
 * Devolve o amount já com o sinal que o kind implica, para o CHECK da base de
 * dados nunca ser a primeira linha de defesa. O cliente manda sempre um valor
 * positivo, excepto no AJUSTE, onde o sinal é que dá o sentido.
 */
function cleanAmount(raw: unknown, kind: Kind): { value: number } | { error: string } {
  const amount = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(amount) || amount === 0) {
    return { error: "O valor tem de ser um número diferente de zero." };
  }
  if (Math.abs(amount) > MAX_AMOUNT) {
    return { error: `O valor é demasiado alto (máx. ${MAX_AMOUNT}).` };
  }
  if (kind === "DEPOSITO") return { value: Math.abs(amount) };
  if (kind === "LEVANTAMENTO") return { value: -Math.abs(amount) };
  return { value: amount };
}

// Nota é opcional: string vazia / ausente -> null.
function cleanNote(raw: unknown): { value: string | null } | { error: string } {
  if (raw === undefined || raw === null) return { value: null };
  if (typeof raw !== "string") return { error: "Nota inválida." };
  const note = raw.trim();
  if (note.length === 0) return { value: null };
  if (note.length > MAX_NOTE_LENGTH) {
    return { error: `A nota é demasiado longa (máx. ${MAX_NOTE_LENGTH} caracteres).` };
  }
  return { value: note };
}

// Aceita "YYYY-MM-DD" e "YYYY-MM-DD HH:mm"; ausente -> agora.
function cleanOccurredAt(raw: unknown): { value: string } | { error: string } {
  if (raw === undefined || raw === null || raw === "") {
    return { value: new Date().toISOString() };
  }
  if (typeof raw !== "string") return { error: "Data inválida." };
  const parsed = new Date(raw.trim().replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return { error: "Data inválida." };
  return { value: parsed.toISOString() };
}

// ============================================================
// GET /api/bankroll -> lista os movimentos do utilizador
// ============================================================
router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT ${MOVEMENT_COLUMNS}
       FROM bankroll_movements
       WHERE user_id = $1
       ORDER BY occurred_at DESC, created_at DESC`,
      [req.user!.id]
    );
    res.json({ movements: result.rows });
  } catch (error) {
    console.error("Erro ao listar movimentos da banca:", error);
    res.status(500).json({ error: "Erro ao obter os movimentos da banca." });
  }
});

// ============================================================
// POST /api/bankroll -> cria um movimento { kind, amount, occurredAt?, note? }
// ============================================================
router.post("/", async (req: AuthenticatedRequest, res) => {
  const kind = cleanKind(req.body?.kind);
  if (!kind) {
    res.status(400).json({ error: "Tipo de movimento inválido." });
    return;
  }
  const amount = cleanAmount(req.body?.amount, kind);
  if ("error" in amount) {
    res.status(400).json({ error: amount.error });
    return;
  }
  const note = cleanNote(req.body?.note);
  if ("error" in note) {
    res.status(400).json({ error: note.error });
    return;
  }
  const occurredAt = cleanOccurredAt(req.body?.occurredAt);
  if ("error" in occurredAt) {
    res.status(400).json({ error: occurredAt.error });
    return;
  }

  try {
    const count = await pool.query(
      "SELECT COUNT(*)::int AS n FROM bankroll_movements WHERE user_id = $1",
      [req.user!.id]
    );
    if (count.rows[0].n >= MAX_MOVEMENTS) {
      res.status(400).json({ error: `Limite de ${MAX_MOVEMENTS} movimentos atingido.` });
      return;
    }

    const result = await pool.query(
      `INSERT INTO bankroll_movements (user_id, kind, amount, occurred_at, note)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${MOVEMENT_COLUMNS}`,
      [req.user!.id, kind, amount.value, occurredAt.value, note.value]
    );
    res.status(201).json({ success: true, movement: result.rows[0] });
  } catch (error: any) {
    if (error?.code === "23514") {
      res.status(400).json({ error: "O valor não bate certo com o tipo de movimento." });
      return;
    }
    console.error("Erro ao criar movimento da banca:", error);
    res.status(500).json({ error: "Erro ao registar o movimento." });
  }
});

// ============================================================
// PUT /api/bankroll/:id -> edita um movimento
// ============================================================
router.put("/:id", async (req: AuthenticatedRequest, res) => {
  const kind = cleanKind(req.body?.kind);
  if (!kind) {
    res.status(400).json({ error: "Tipo de movimento inválido." });
    return;
  }
  const amount = cleanAmount(req.body?.amount, kind);
  if ("error" in amount) {
    res.status(400).json({ error: amount.error });
    return;
  }
  const note = cleanNote(req.body?.note);
  if ("error" in note) {
    res.status(400).json({ error: note.error });
    return;
  }
  const occurredAt = cleanOccurredAt(req.body?.occurredAt);
  if ("error" in occurredAt) {
    res.status(400).json({ error: occurredAt.error });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE bankroll_movements
       SET kind = $1, amount = $2, occurred_at = $3, note = $4,
           updated_at = timezone('utc', now())
       WHERE id = $5 AND user_id = $6
       RETURNING ${MOVEMENT_COLUMNS}`,
      [kind, amount.value, occurredAt.value, note.value, req.params.id, req.user!.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Movimento não encontrado." });
      return;
    }
    res.json({ success: true, movement: result.rows[0] });
  } catch (error: any) {
    if (error?.code === "23514") {
      res.status(400).json({ error: "O valor não bate certo com o tipo de movimento." });
      return;
    }
    if (error?.code === "22P02") {
      res.status(404).json({ error: "Movimento não encontrado." });
      return;
    }
    console.error("Erro ao editar movimento da banca:", error);
    res.status(500).json({ error: "Erro ao editar o movimento." });
  }
});

// ============================================================
// DELETE /api/bankroll/:id -> apaga um movimento
// ============================================================
router.delete("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM bankroll_movements WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user!.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Movimento não encontrado." });
      return;
    }
    res.json({ success: true });
  } catch (error: any) {
    if (error?.code === "22P02") {
      res.status(404).json({ error: "Movimento não encontrado." });
      return;
    }
    console.error("Erro ao apagar movimento da banca:", error);
    res.status(500).json({ error: "Erro ao apagar o movimento." });
  }
});

export default router;
