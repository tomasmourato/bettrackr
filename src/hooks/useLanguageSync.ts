// src/hooks/useLanguageSync.ts
// O idioma vive em dois sítios: localStorage (resposta imediata, funciona
// offline e antes do login) e /api/settings (segue o utilizador entre
// dispositivos). Este hook trata da direção servidor -> cliente:
//
//   - depois de autenticar, lê o idioma guardado no servidor e, se existir e
//     for diferente do local, adota-o;
//   - se o servidor ainda não tem idioma (utilizador antigo), envia o local
//     uma vez para o registar.
//
// A direção cliente -> servidor é feita no App.tsx, quando o utilizador muda
// de idioma nas Configurações (updateLanguage). Aqui usa-se o
// `updatePreferences` cru — adotar o valor do servidor não deve disparar um
// PUT de volta.

import { useEffect, useRef } from "react";
import type { Preferences } from "../types";
import { fetchSettings, updateLanguage } from "../lib/settingsApi";

export function useLanguageSync(
  authed: boolean,
  preferences: Preferences,
  updatePreferences: (prefs: Preferences) => void
) {
  // Refs para o efeito correr só à entrada da sessão sem ler preferências
  // desatualizadas do closure.
  const prefsRef = useRef(preferences);
  prefsRef.current = preferences;
  const updateRef = useRef(updatePreferences);
  updateRef.current = updatePreferences;

  const syncedRef = useRef(false);

  useEffect(() => {
    if (!authed) {
      // Terminar sessão volta a armar a sincronização para o próximo login.
      syncedRef.current = false;
      return;
    }
    if (syncedRef.current) return;

    let alive = true;
    fetchSettings()
      .then((settings) => {
        if (!alive) return;
        syncedRef.current = true;
        const local = prefsRef.current;

        if (settings.language === null) {
          // Servidor ainda não sabe o idioma deste utilizador: regista o local.
          void updateLanguage(local.language).catch(() => undefined);
          return;
        }
        if (settings.language !== local.language) {
          updateRef.current({ ...local, language: settings.language });
        }
      })
      .catch(() => {
        // Offline ou servidor antigo: o idioma local continua a mandar.
      });

    return () => {
      alive = false;
    };
  }, [authed]);
}
