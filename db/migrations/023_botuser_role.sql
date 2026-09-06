-- ============================================================
-- Migração 023: cargo 'botuser'
--
-- IDEMPOTENTE - pode ser executada várias vezes em segurança.
--
-- 'botuser' é para os amigos que usam o bot da Betclic (importação automática)
-- e o CLV automático, mas que NÃO gerem nada na app: não veem o painel de
-- gestão nem tocam em contas. Fica entre 'user' e 'admin' - tem as
-- funcionalidades pagas (é tratado como entitled, ver lib/entitlements.ts) mas
-- não é staff (isStaff continua a ser só admin/founder).
--
-- Só alarga o CHECK do papel; não muda nenhuma linha existente (o conjunto novo
-- é um superconjunto do antigo). Atribui-se com scripts/make-admin.mjs --botuser.
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;

  ALTER TABLE users
    ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'founder', 'botuser'));
END $$;
