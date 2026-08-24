// src/lib/bankrollApi.ts
// Camada de API dos movimentos da banca (/api/bankroll). Segue o mesmo padrão
// de accountsApi: fala com o servidor via authFetch e traduz snake_case ->
// camelCase.
//
// O saldo não vem daqui: é calculado no cliente por calculateBankroll
// (src/lib/bankroll.ts) a partir destes movimentos e das apostas.

import { authFetch, parseJsonResponse } from "./authApi";
import { BankrollMovement, BankrollMovementKind } from "../types";

type ApiMovementRow = Record<string, any>;

const VALID_KINDS: BankrollMovementKind[] = ["DEPOSITO", "LEVANTAMENTO", "AJUSTE"];

function mapMovementFromApi(row: ApiMovementRow): BankrollMovement {
  const kind = String(row.kind ?? "");
  return {
    id: String(row.id),
    kind: (VALID_KINDS as string[]).includes(kind)
      ? (kind as BankrollMovementKind)
      : "AJUSTE",
    amount: Number(row.amount) || 0,
    occurredAt: String(row.occurred_at ?? ""),
    note: row.note ? String(row.note) : undefined,
    accountId: row.account_id ? String(row.account_id) : undefined,
    createdAt: row.created_at ?? undefined,
  };
}

export interface BankrollMovementInput {
  kind: BankrollMovementKind;
  /** Valor positivo; o servidor aplica o sinal a partir do kind. */
  amount: number;
  occurredAt?: string | null;
  note?: string | null;
}

export async function fetchMovements(): Promise<BankrollMovement[]> {
  const res = await authFetch("/api/bankroll");
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao obter os movimentos da banca.");
  return (data.movements as ApiMovementRow[]).map(mapMovementFromApi);
}

export async function createMovement(input: BankrollMovementInput): Promise<BankrollMovement> {
  const res = await authFetch("/api/bankroll", {
    method: "POST",
    body: JSON.stringify({
      kind: input.kind,
      amount: input.amount,
      occurredAt: input.occurredAt ?? null,
      note: input.note ?? null,
    }),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao registar o movimento.");
  return mapMovementFromApi(data.movement);
}

export async function updateMovement(
  id: string,
  input: BankrollMovementInput,
): Promise<BankrollMovement> {
  const res = await authFetch(`/api/bankroll/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({
      kind: input.kind,
      amount: input.amount,
      occurredAt: input.occurredAt ?? null,
      note: input.note ?? null,
    }),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao editar o movimento.");
  return mapMovementFromApi(data.movement);
}

export async function deleteMovement(id: string): Promise<void> {
  const res = await authFetch(`/api/bankroll/${encodeURIComponent(id)}`, { method: "DELETE" });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao apagar o movimento.");
}
