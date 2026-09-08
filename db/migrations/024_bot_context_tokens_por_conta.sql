-- ============================================================
-- Migração 024: token de contexto do bot POR CONTA da Betclic
--
-- IDEMPOTENTE - pode ser executada várias vezes em segurança.
--
-- Até aqui havia UMA ativação por utilizador (bot_context_tokens.user_id era
-- PRIMARY KEY; ver migração 022). Há utilizadores com 2+ contas na Betclic, por
-- isso a ativação passa a ter ÂMBITO DE CONTA: uma linha por (user_id,
-- account_id), onde account_id aponta para uma bookie_account (bookmaker
-- Betclic). O bot no telemóvel processa todas as ativações do dono, uma por
-- conta, e etiqueta as apostas importadas com esse account_id.
--
-- A linha "legada" (a ativação única antiga, com account_id NULL) NÃO é apagada:
-- um índice parcial garante no máximo uma por utilizador, para não partir uma
-- sessão a decorrer. O bot novo, esse, só olha para ativações COM account_id -
-- por isso cada dono reativa uma vez por conta após o deploy (ver bot/README.md).
-- ============================================================

-- 1. Coluna nova (nullable): a conta a que a ativação pertence.
ALTER TABLE bot_context_tokens
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES bookie_accounts(id) ON DELETE CASCADE;

-- 2. Deixar de ter user_id como PRIMARY KEY (passa a haver N linhas por user).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bot_context_tokens_pkey') THEN
    ALTER TABLE bot_context_tokens DROP CONSTRAINT bot_context_tokens_pkey;
  END IF;
END $$;

-- 3. Uma ativação por conta (serve o ON CONFLICT (user_id, account_id) da rota).
--    NULLs são distintos, por isso isto não impede a linha legada.
CREATE UNIQUE INDEX IF NOT EXISTS bot_context_tokens_user_account
  ON bot_context_tokens (user_id, account_id);

-- 4. No máximo UMA linha legada (account_id NULL) por utilizador.
CREATE UNIQUE INDEX IF NOT EXISTS bot_context_tokens_user_legacy
  ON bot_context_tokens (user_id) WHERE account_id IS NULL;
