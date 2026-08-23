// src/hooks/useBillingActions.ts
// Os dois botões que falam com o Stripe (subscrever e gerir), partilhados
// pelo cartão das Definições e pelo aviso de subscrição dos ecrãs pagos, em
// desktop e mobile. Guardam o estado de "a abrir..." e a mensagem de erro.

import { useState } from "react";
import { isNativeApp } from "../lib/apiBase";
import { BillingError, goToStripe, openBillingPortal, startCheckout } from "../lib/billingApi";
import { useI18n, type TKey } from "../lib/i18n";

// Códigos devolvidos pelo /api/billing (ver routes/billingRoutes.ts). O texto
// que vem do servidor está em português; o utilizador vê a tradução do código.
const ERROR_KEYS: Record<string, TKey> = {
  STRIPE_UNAVAILABLE: "billing.unavailable",
  ALREADY_SUBSCRIBED: "billing.alreadySubscribed",
  CHECKOUT_FAILED: "billing.checkoutError",
  NO_CUSTOMER: "billing.noCustomer",
  PORTAL_FAILED: "billing.portalError",
};

export function useBillingActions() {
  const { t } = useI18n();
  const [busy, setBusy] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (kind: "checkout" | "portal") => {
    setBusy(kind);
    setError(null);
    try {
      const url = kind === "checkout" ? await startCheckout() : await openBillingPortal();
      goToStripe(url);
      // Na web o browser sai desta página a seguir e o `busy` fica como está
      // de propósito - limpá-lo faria o botão piscar de volta ao normal a
      // meio da navegação. Na app nativa a página não muda (o Stripe abre no
      // browser do sistema), por isso aí o botão tem mesmo de ser reposto.
      if (isNativeApp()) setBusy(null);
    } catch (err) {
      const key = err instanceof BillingError && err.code ? ERROR_KEYS[err.code] : undefined;
      const fallback = kind === "checkout" ? "billing.checkoutError" : "billing.portalError";
      // Só se usa o texto do servidor quando o código é desconhecido - e aí
      // uma frase em português é melhor do que nenhuma pista.
      setError(
        key ? t(key) : err instanceof BillingError && err.code ? err.message : t(fallback),
      );
      setBusy(null);
    }
  };

  return {
    busy,
    error,
    clearError: () => setError(null),
    subscribe: () => run("checkout"),
    manage: () => run("portal"),
  };
}
