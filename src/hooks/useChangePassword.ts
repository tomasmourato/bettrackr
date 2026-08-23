// src/hooks/useChangePassword.ts
// O formulário de mudar a password, partilhado pelo cartão das Definições
// (desktop) e pelo painel equivalente no mobile. Os dois desenham-se de
// maneira diferente, mas as regras - o que é válido, o que o servidor
// respondeu, quando é que o botão acorda - são as mesmas e vivem só aqui.
// Duas cópias seria pedir que uma envelhecesse sem a outra.

import { useEffect, useRef, useState } from "react";
import { AuthError, changePassword, SessionExpiredError } from "../lib/authApi";
import { useI18n, type TKey } from "../lib/i18n";

// Códigos devolvidos pelo /api/auth/change-password. O texto que vem do
// servidor está em português; o utilizador vê a tradução do código.
const ERROR_KEYS: Record<string, TKey> = {
  MISSING_FIELDS: "settings.password.error.missing",
  WEAK_PASSWORD: "settings.password.error.weak",
  SAME_PASSWORD: "settings.password.error.same",
  INVALID_CURRENT_PASSWORD: "settings.password.error.current",
};

/** O mesmo mínimo que o servidor exige (validatePassword em authRoutes.ts). */
export const MIN_PASSWORD_LENGTH = 8;

export function useChangePassword(onSessionExpired: () => void) {
  const { t } = useI18n();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSessionExpiredRef = useRef(onSessionExpired);
  useEffect(() => {
    onSessionExpiredRef.current = onSessionExpired;
  }, [onSessionExpired]);

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError(null);
    setDone(false);
  };

  // O botão só acorda com os três campos preenchidos. As queixas ficam para o
  // submit: dizer "muito curta" a quem ainda está a escrever é ruído.
  const canSubmit = !saving && current.length > 0 && next.length > 0 && confirm.length > 0;

  const submit = async (): Promise<boolean> => {
    setError(null);
    setDone(false);

    // As mesmas três regras que o servidor aplica. Aqui são só cortesia - a
    // decisão que conta é a dele, porque esta corre no browser do utilizador.
    if (next.length < MIN_PASSWORD_LENGTH) {
      setError(t("settings.password.error.weak"));
      return false;
    }
    if (next !== confirm) {
      setError(t("settings.password.error.mismatch"));
      return false;
    }
    if (next === current) {
      setError(t("settings.password.error.same"));
      return false;
    }

    setSaving(true);
    try {
      await changePassword(current, next);
      reset();
      setDone(true);
      return true;
    } catch (err) {
      // Uma sessão expirada não é um erro deste formulário - sobe para quem
      // sabe tratá-la, como em todos os outros hooks.
      if (err instanceof SessionExpiredError) {
        onSessionExpiredRef.current();
        return false;
      }
      const key = err instanceof AuthError && err.code ? ERROR_KEYS[err.code] : undefined;
      setError(key ? t(key) : t("settings.password.error.generic"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    current,
    setCurrent,
    next,
    setNext,
    confirm,
    setConfirm,
    saving,
    error,
    done,
    canSubmit,
    submit,
    reset,
    dismissDone: () => setDone(false),
  };
}
