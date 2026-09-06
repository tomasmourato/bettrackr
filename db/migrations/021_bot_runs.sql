-- ============================================================
-- Migração 021: registo das passagens do bot da Betclic
--
-- IDEMPOTENTE - pode ser executada várias vezes em segurança.
--
-- O bot local (bot/) reporta cada passagem para o painel de admin poder mostrar
-- o estado: quando correu, se correu bem, quantas apostas leu e importou, e o
-- erro se falhou. Uma linha por passagem, por utilizador (o dono da conta onde
-- o bot importa - sempre um admin).
--
-- NÃO guarda segredos: nem o token da Betclic, nem a chave da passkey (essa vive
-- só na máquina do admin, cifrada). Só telemetria.
-- ============================================================

CREATE TABLE IF NOT EXISTS bot_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_ms INTEGER,
  ok BOOLEAN NOT NULL,
  read_count INTEGER NOT NULL DEFAULT 0,   -- apostas lidas da Betclic
  imported INTEGER NOT NULL DEFAULT 0,     -- apostas novas enviadas ao BetTrackr
  error TEXT,                              -- mensagem, quando ok = false
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- O painel lê as passagens mais recentes de um utilizador.
CREATE INDEX IF NOT EXISTS bot_runs_user_started_idx
  ON bot_runs (user_id, started_at DESC);
