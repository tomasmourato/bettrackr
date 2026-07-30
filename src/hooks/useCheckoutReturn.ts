// src/hooks/useCheckoutReturn.ts
// O Stripe devolve o utilizador a /settings?checkout=success|cancelled.
//
// Este hook lê esse parâmetro uma única vez, limpa-o do URL (para um refresh
// não repetir a mensagem) e pede a releitura da subscrição quando o pagamento
// correu bem — o webhook costuma chegar primeiro, mas não é garantido.

import { useEffect, useState } from "react";

export type CheckoutOutcome = "success" | "cancelled";

export function useCheckoutReturn(onSuccess: () => void): CheckoutOutcome | null {
  const [outcome, setOutcome] = useState<CheckoutOutcome | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const raw = params.get("checkout");
    if (raw !== "success" && raw !== "cancelled") return;

    setOutcome(raw);
    params.delete("checkout");
    const query = params.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`,
    );

    if (raw === "success") onSuccess();
    // Só no arranque: o parâmetro é consumido e desaparece do URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return outcome;
}
