// src/hooks/useBankroll.ts
// Estado dos movimentos da banca, server-first (mesmo padrão de useAccounts):
// o estado local só é atualizado a partir da resposta do servidor.

import { useEffect, useRef, useState } from "react";
import { BankrollMovement } from "../types";
import { SessionExpiredError } from "../lib/authApi";
import {
  fetchMovements,
  createMovement,
  updateMovement,
  deleteMovement,
  BankrollMovementInput,
} from "../lib/bankrollApi";

export function useBankroll(enabled: boolean, onSessionExpired: () => void) {
  const [movements, setMovements] = useState<BankrollMovement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSessionExpiredRef = useRef(onSessionExpired);
  useEffect(() => {
    onSessionExpiredRef.current = onSessionExpired;
  }, [onSessionExpired]);

  const handleError = (err: unknown) => {
    if (err instanceof SessionExpiredError) {
      onSessionExpiredRef.current();
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("Ocorreu um erro inesperado.");
    }
  };

  const clearError = () => setError(null);

  useEffect(() => {
    if (!enabled) {
      setMovements([]);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetchMovements()
      .then((loaded) => {
        if (!cancelled) setMovements(loaded);
      })
      .catch((err) => {
        if (!cancelled) handleError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Mais recente primeiro, como a lista que o servidor devolve.
  const sortMovements = (list: BankrollMovement[]) =>
    [...list].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  const addMovement = async (
    input: BankrollMovementInput,
  ): Promise<BankrollMovement | null> => {
    setError(null);
    try {
      const created = await createMovement(input);
      setMovements((prev) => sortMovements([...prev, created]));
      return created;
    } catch (err) {
      handleError(err);
      return null;
    }
  };

  const editMovement = async (
    id: string,
    input: BankrollMovementInput,
  ): Promise<BankrollMovement | null> => {
    setError(null);
    try {
      const updated = await updateMovement(id, input);
      setMovements((prev) => sortMovements(prev.map((m) => (m.id === updated.id ? updated : m))));
      return updated;
    } catch (err) {
      handleError(err);
      return null;
    }
  };

  const removeMovement = async (id: string): Promise<boolean> => {
    setError(null);
    try {
      await deleteMovement(id);
      setMovements((prev) => prev.filter((m) => m.id !== id));
      return true;
    } catch (err) {
      handleError(err);
      return false;
    }
  };

  return { movements, isLoading, error, clearError, addMovement, editMovement, removeMovement };
}
