-- ============================================================
-- Migração 013: idioma da interface por utilizador
--
-- IDEMPOTENTE — pode ser executada várias vezes em segurança.
--
-- O idioma era guardado só em localStorage ("g_prefs"), por isso não seguia o
-- utilizador entre dispositivos nem sobrevivia a uma instalação nova. Passa a
-- ser lido/escrito também em /api/settings.
-- NULL = nunca configurado -> a app usa o idioma do browser (ou português).
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT;

-- Só os idiomas que a app tem dicionário para servir; NULL continua válido.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_language_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_language_check
      CHECK (language IS NULL OR language IN ('pt', 'en'));
  END IF;
END $$;
