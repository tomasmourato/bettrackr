-- ============================================================
-- Migração 016: o período experimental deixa de ser dado a contas novas
--
-- IDEMPOTENTE — pode ser executada várias vezes em segurança.
--
-- A 015 criou users.trial_ends_at com DEFAULT "agora + 14 dias", o que dava
-- período experimental a TODA a gente que se registasse. A intenção era outra:
-- os 14 dias servem só para quem já tinha conta quando a subscrição foi
-- lançada não perder o acesso de repente. Quem se regista de agora em diante
-- entra sem período experimental.
--
-- (A 015 já não põe o DEFAULT; esta migração existe para as bases de dados
-- onde ela chegou a correr com ele.)
-- ============================================================

DO $$
BEGIN
  -- Todo o bloco só corre enquanto o DEFAULT existir, ou seja UMA vez por
  -- base de dados. É isso que impede a limpeza abaixo de voltar a apagar um
  -- período experimental concedido de propósito no painel de gestão.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'users'
       AND column_name = 'trial_ends_at'
       AND column_default IS NOT NULL
  ) THEN
    ALTER TABLE users ALTER COLUMN trial_ends_at DROP DEFAULT;

    -- Contas criadas depois de a subscrição existir só receberam período
    -- experimental por causa do DEFAULT. A data é anterior ao lançamento e
    -- posterior a todas as contas antigas, que ficam intactas.
    UPDATE users
       SET trial_ends_at = NULL
     WHERE created_at >= TIMESTAMPTZ '2026-07-28 00:00:00+00';
  END IF;
END $$;
