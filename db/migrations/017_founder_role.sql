-- ============================================================
-- Migração 017: cargo de fundador
--
-- IDEMPOTENTE — pode ser executada várias vezes em segurança.
--
-- 'founder' é um degrau acima de 'admin': tem tudo o que um administrador
-- tem, mas nenhuma rota da API lhe mexe no papel nem lhe apaga a conta. Um
-- administrador promovido não pode voltar-se contra quem o promoveu.
--
-- Consequência assumida: um fundador só se cria (ou se retira) por fora, com
-- o scripts/make-admin.mjs. É de propósito — se a API o soubesse fazer, a
-- proteção deixava de valer.
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;

  ALTER TABLE users
    ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'founder'));
END $$;
