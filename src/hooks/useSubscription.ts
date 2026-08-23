// src/hooks/useSubscription.ts
// Estado da subscrição do utilizador atual, carregado uma vez por sessão e
// relido quando algo o pode ter mudado (voltar do Stripe, um administrador
// conceder acesso, o utilizador cancelar).
//
// Enquanto carrega, `status` é null. Os ecrãs pagos tratam isso como "ainda
// não sei" e mostram o carregamento - nunca o convite a subscrever, senão o
// paywall piscava a cada arranque para quem já paga.

import { useCallback, useEffect, useRef, useState } from "react";
import { SessionExpiredError } from "../lib/authApi";
import { fetchBillingStatus, type BillingStatus } from "../lib/billingApi";

export function useSubscription(enabled: boolean, onSessionExpired: () => void) {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSessionExpiredRef = useRef(onSessionExpired);
  useEffect(() => {
    onSessionExpiredRef.current = onSessionExpired;
  }, [onSessionExpired]);

  const cancelledRef = useRef(false);

  const load = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const loaded = await fetchBillingStatus();
      if (!cancelledRef.current) setStatus(loaded);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpiredRef.current();
      } else if (!cancelledRef.current) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (!cancelledRef.current) setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    cancelledRef.current = false;
    if (!enabled) {
      setStatus(null);
      return;
    }
    void load();
    return () => {
      cancelledRef.current = true;
    };
  }, [enabled, load]);

  return { status, isLoading, error, refresh: load };
}
