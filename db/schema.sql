-- ============================================================
-- Schema canónico da base de dados (PostgreSQL / Supabase)
--
-- Instalações NOVAS executam este ficheiro por completo.
-- Bases de dados EXISTENTES executam as migrações em db/migrations/ por ordem
-- (001, 002, 003, ...) para ajustar apenas o que falta, sem perder dados.
-- ============================================================

-- ------------------------------------------------------------
-- Utilizadores
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  -- Casas suportadas que o utilizador ativou (betclic/betano/solverde). NULL =
  -- não configurado -> tratado como "todas". A extensão lê isto via /api/settings.
  enabled_bookmakers TEXT[],
  -- Idioma da interface; NULL = nunca configurado -> o cliente decide. Ver 013.
  language TEXT CONSTRAINT users_language_check CHECK (language IS NULL OR language IN ('pt', 'en')),
  -- Papel: 'admin' dá acesso ao painel de gestão e dispensa subscrição; o
  -- 'founder' é um 'admin' que a API não despromove nem apaga. Ver 015 e 017.
  role TEXT NOT NULL DEFAULT 'user'
    CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'founder')),
  -- Fim do período experimental das funcionalidades pagas; NULL = sem período,
  -- que é como as contas novas nascem. Sem DEFAULT de propósito: os 14 dias
  -- foram só para quem já tinha conta ao lançar a subscrição (ver 015 e 016).
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  -- Cliente do Stripe; sobrevive a cancelamentos, é a chave que o webhook usa.
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE UNIQUE INDEX IF NOT EXISTS users_stripe_customer_id_key
  ON users (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- ------------------------------------------------------------
-- AI Insights - cache diária das dicas geradas (Gemini + Google Search).
-- Uma linha por dia e por idioma, partilhada por todos. Ver migrações 009 e 014.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_date DATE NOT NULL,
  lang TEXT NOT NULL DEFAULT 'pt'
    CONSTRAINT daily_insights_lang_check CHECK (lang IN ('pt', 'en')),
  content JSONB NOT NULL,
  model TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT daily_insights_date_lang_key UNIQUE (insight_date, lang)
);

-- ------------------------------------------------------------
-- Subscrições - uma linha por utilizador com o estado ATUAL (não é histórico).
-- Dá acesso à IA e à extensão. Ver migração 015.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL
    CONSTRAINT subscriptions_status_check CHECK (status IN (
      'active', 'trialing', 'past_due', 'unpaid', 'incomplete',
      'incomplete_expired', 'canceled', 'paused'
    )),
  -- 'stripe' = mantida pelo webhook; 'manual' = concedida por um administrador.
  source TEXT NOT NULL DEFAULT 'stripe'
    CONSTRAINT subscriptions_source_check CHECK (source IN ('stripe', 'manual')),
  plan TEXT NOT NULL DEFAULT 'pro_monthly',
  price_cents INTEGER NOT NULL DEFAULT 399,
  currency TEXT NOT NULL DEFAULT 'eur',
  -- Até quando o acesso está pago; NULL numa manual = sem fim.
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_subscription_id TEXT,
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_key
  ON subscriptions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- ------------------------------------------------------------
-- Auditoria das ações dos administradores. Os nomes ficam gravados como texto
-- para a linha continuar legível depois de a conta ser apagada. Ver 015.
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

-- ------------------------------------------------------------
-- Contas por casa de apostas - um utilizador pode ter várias contas na
-- mesma casa (ex.: duas contas Betclic). Ver migração 007.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookie_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bookmaker TEXT NOT NULL,
  label TEXT NOT NULL,
  -- Username real na casa (ex.: "pedroocoragem" na Betclic); NULL = sem username.
  -- A extensão usa-o para encaminhar automaticamente as apostas importadas.
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT bookie_accounts_label_not_blank CHECK (LENGTH(TRIM(label)) > 0),
  CONSTRAINT bookie_accounts_bookmaker_not_blank CHECK (LENGTH(TRIM(bookmaker)) > 0),
  CONSTRAINT bookie_accounts_unique_label UNIQUE (user_id, bookmaker, label)
);

-- Um username não se repete dentro da mesma casa para o mesmo utilizador.
CREATE UNIQUE INDEX IF NOT EXISTS bookie_accounts_username_key
  ON bookie_accounts (user_id, LOWER(bookmaker), LOWER(username))
  WHERE username IS NOT NULL;

-- ------------------------------------------------------------
-- Banca - dinheiro real a entrar e a sair das casas. O saldo não é guardado:
-- é derivado destes movimentos mais o lucro líquido das apostas liquidadas.
-- O amount tem sinal (depósito positivo, levantamento negativo) para o saldo
-- ser um SUM directo. Ver migração 018.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bankroll_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  occurred_at TIMESTAMP NOT NULL,
  note TEXT,
  -- Reservado para a banca por conta; hoje fica sempre NULL.
  account_id UUID REFERENCES bookie_accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT bankroll_movements_kind_check
    CHECK (kind IN ('DEPOSITO', 'LEVANTAMENTO', 'AJUSTE')),
  CONSTRAINT bankroll_movements_amount_sign_check CHECK (
    (kind = 'DEPOSITO'     AND amount > 0) OR
    (kind = 'LEVANTAMENTO' AND amount < 0) OR
    (kind = 'AJUSTE'       AND amount <> 0)
  )
);

-- ------------------------------------------------------------
-- Apostas (bets) - PostgreSQL é a única fonte de verdade.
--
-- Notas de modelação:
--  * status inclui CASHOUT; o valor do cashout usa a coluna final_return.
--  * freebet_type (SNR|SR) tem de ser persistido porque o tipo não é
--    recuperável a partir dos números numa freebet pendente/perdida.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL
    CONSTRAINT bets_bet_type_check CHECK (type IN ('SIMPLES', 'MULTIPLA')),
  status TEXT NOT NULL DEFAULT 'POR_LIQUIDAR'
    CONSTRAINT bets_status_check CHECK (
      status IN ('POR_LIQUIDAR', 'GANHA', 'PERDIDA', 'ANULADA', 'MEIO_GANHA', 'MEIO_PERDIDA', 'CASHOUT')
    ),
  stake DECIMAL NOT NULL,
  odd DECIMAL NOT NULL,
  is_freebet BOOLEAN DEFAULT FALSE,
  freebet_type TEXT
    CONSTRAINT bets_freebet_type_check CHECK (freebet_type IS NULL OR freebet_type IN ('SNR', 'SR')),
  -- Aposta sem risco: stake real e conta para o lucro como aposta normal
  -- (derrota perde a stake); a freebet de reembolso é registada à parte.
  is_risk_free BOOLEAN NOT NULL DEFAULT FALSE,
  -- Aposta ignorada: visível no histórico mas excluída das estatísticas.
  is_ignored BOOLEAN NOT NULL DEFAULT FALSE,
  potential_return DECIMAL,
  final_return DECIMAL,
  net_profit DECIMAL,
  bookmaker TEXT,
  -- Conta da casa a que a aposta pertence (opcional; NULL = "sem conta").
  account_id UUID REFERENCES bookie_accounts(id) ON DELETE SET NULL,
  date_time TIMESTAMP,
  notes TEXT,
  origin TEXT,
  selections JSONB,
  comment TEXT,
  tags TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT bets_cashout_metadata_status_check CHECK (
    status = 'CASHOUT'
    OR metadata IS NULL
    OR NOT (
      LOWER(COALESCE(metadata->>'isCashout', 'false')) = 'true'
      OR REGEXP_REPLACE(LOWER(COALESCE(metadata->>'originalStatus', '')), '[^a-z]', '', 'g')
        IN ('cashout', 'cashedout', 'fullcashout', 'partialcashout')
      OR REGEXP_REPLACE(LOWER(COALESCE(metadata->>'betclicResult', '')), '[^a-z]', '', 'g')
        IN ('cashout', 'cashedout', 'fullcashout', 'partialcashout')
      OR REGEXP_REPLACE(LOWER(COALESCE(metadata->>'settlementStatus', '')), '[^a-z]', '', 'g')
        IN ('cashout', 'cashedout', 'fullcashout', 'partialcashout')
    )
  )
);

-- ------------------------------------------------------------
-- Amizades (funcionalidade social) - pedidos e amizades aceites.
-- Linha dirigida requester_id -> addressee_id com status pending/accepted.
-- Ver db/migrations/005_social_friendships.sql para detalhes.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CONSTRAINT friendships_status_check CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT friendships_not_self CHECK (requester_id <> addressee_id),
  CONSTRAINT friendships_unique_pair UNIQUE (requester_id, addressee_id)
);

-- ------------------------------------------------------------
-- Índices
-- ------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users(username);
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_account_id ON bets(account_id);
CREATE INDEX IF NOT EXISTS bookie_accounts_user_idx ON bookie_accounts (user_id, bookmaker);
CREATE INDEX IF NOT EXISTS bankroll_movements_user_idx ON bankroll_movements (user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS friendships_addressee_idx ON friendships (addressee_id, status);
CREATE INDEX IF NOT EXISTS friendships_requester_idx ON friendships (requester_id, status);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions (status);
CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx ON admin_audit_log (created_at DESC);
