-- ============================================================
-- Migração 015: subscrições, período experimental e papéis
--
-- IDEMPOTENTE — pode ser executada várias vezes em segurança.
--
-- As funcionalidades de IA (leitura de boletins e dicas/avaliação) e a
-- extensão passam a exigir subscrição ativa. O núcleo da app — registar
-- apostas à mão, painel, social — continua livre.
--
-- Quem já tinha conta não pode ficar sem acesso de um dia para o outro, por
-- isso as contas que existiam no momento em que esta migração correu recebem
-- 14 dias. Contas criadas DEPOIS disto não levam período experimental — o
-- acesso passa a depender da subscrição.
-- ============================================================

-- ------------------------------------------------------------
-- users: papel, período experimental e ligação ao Stripe
-- ------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- NULL = sem período experimental (o acesso depende só da subscrição).
-- Sem DEFAULT: quem se regista de novo não ganha período experimental.
--
-- Os 14 dias são dados UMA única vez, no momento em que a coluna passa a
-- existir — ou seja, exatamente a quem já tinha conta antes da funcionalidade.
-- Ficar dentro do IF é o que garante isso: numa segunda execução a coluna já
-- existe, o bloco não corre, e ninguém volta a receber período experimental
-- (nem sequer quem o tenha entretanto perdido no painel de gestão).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE users ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;
    UPDATE users SET trial_ends_at = NOW() + INTERVAL '14 days';
  END IF;
END $$;

-- O cliente do Stripe sobrevive ao cancelamento e a novas subscrições, por
-- isso vive no utilizador (é por aqui que o webhook encontra a quem pertence
-- o evento) e não na tabela das subscrições.
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_stripe_customer_id_key
  ON users (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- ------------------------------------------------------------
-- subscriptions — uma linha por utilizador, com o estado ATUAL.
--
-- Não é um histórico: quando alguém cancela e volta a subscrever, a linha é
-- atualizada. Quem precisa de rasto de quem mexeu no quê tem o
-- admin_audit_log abaixo.
--
-- source distingue as duas origens que a app suporta:
--   'stripe' — criada/atualizada pelo webhook do Stripe;
--   'manual' — concedida por um administrador no painel de gestão.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  -- Espelha os estados do Stripe; 'manual' usa 'active' ou 'canceled'.
  status TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'stripe',
  plan TEXT NOT NULL DEFAULT 'pro_monthly',
  price_cents INTEGER NOT NULL DEFAULT 399,
  currency TEXT NOT NULL DEFAULT 'eur',
  -- Até quando o acesso está pago. NULL numa subscrição manual = sem fim.
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_subscription_id TEXT,
  -- Quem concedeu, nas subscrições manuais.
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_source_check') THEN
    ALTER TABLE subscriptions
      ADD CONSTRAINT subscriptions_source_check CHECK (source IN ('stripe', 'manual'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_status_check') THEN
    ALTER TABLE subscriptions
      ADD CONSTRAINT subscriptions_status_check CHECK (status IN (
        'active', 'trialing', 'past_due', 'unpaid', 'incomplete',
        'incomplete_expired', 'canceled', 'paused'
      ));
  END IF;
END $$;

-- O webhook do Stripe chega com o id da subscrição, não com o do utilizador.
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_key
  ON subscriptions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions (status);

-- ------------------------------------------------------------
-- admin_audit_log — rasto do que os administradores fazem às contas.
--
-- Os nomes ficam gravados como texto além da chave estrangeira: se o
-- utilizador for apagado a linha continua a dizer sobre quem era, em vez de
-- ficar um NULL sem significado.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_username TEXT,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_username TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx
  ON admin_audit_log (created_at DESC);
