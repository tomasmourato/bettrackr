// src/lib/storageKeys.ts
// Nomes das chaves de localStorage da app.
//
// Passaram todas a usar o prefixo "bettrackr_" quando o projeto deixou de se
// chamar gestordebets. Renomear sem mais nada apagava a sessão de toda a gente
// (o token vive numa destas chaves), por isso a migração abaixo passa os
// valores antigos para os nomes novos no primeiro arranque depois da mudança.

const NEW_PREFIX = "bettrackr_";
const LEGACY_PREFIX = "gestordebets_";

export const STORAGE_KEYS = {
  token: `${NEW_PREFIX}token`,
  user: `${NEW_PREFIX}user`,
  importAccounts: `${NEW_PREFIX}import_accounts`,
  stagedBundle: `${NEW_PREFIX}staged_bundle`,
} as const;

/** Nome antigo correspondente a uma chave nova. */
function legacyNameFor(key: string): string {
  return LEGACY_PREFIX + key.slice(NEW_PREFIX.length);
}

let done = false;

/**
 * Copia os valores gravados com o prefixo antigo para o novo e apaga os
 * antigos. Nunca sobrepõe um valor que já exista no nome novo, para o caso de
 * a app ter escrito antes de a migração correr.
 */
export function migrateLegacyStorageKeys(): void {
  if (done) return;
  done = true;

  try {
    if (typeof localStorage === "undefined") return;

    for (const key of Object.values(STORAGE_KEYS)) {
      const legacy = legacyNameFor(key);
      const value = localStorage.getItem(legacy);
      if (value === null) continue;
      if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
      localStorage.removeItem(legacy);
    }
  } catch {
    // localStorage indisponível (modo privado, quota cheia). A app continua a
    // funcionar; no pior caso o utilizador entra outra vez.
  }
}

// Corre ao importar para que qualquer entrada da app (desktop, mobile) fique
// coberta sem ter de se lembrar de chamar isto no arranque.
migrateLegacyStorageKeys();
