-- ============================================================
-- Migração 025: notificações e dispositivos para push
--
-- IDEMPOTENTE - pode ser executada várias vezes em segurança.
--
-- Nasce com um único tipo de notificação: o bot da Betclic sem passagens COM
-- SUCESSO há mais de 1 hora (lib/botWatch.ts). Quem vigia é o servidor,
-- chamado pelo pg_cron (db/cron/bot-watch.sql) - o bot parado é justamente
-- quem não pode avisar que parou.
--
--   notifications - o que a página de notificações mostra. Guarda o TIPO e os
--                   dados, não a frase: o texto forma-se no cliente, no idioma
--                   de quem lê, como no registo de alterações.
--   push_devices  - os tokens do Firebase Cloud Messaging dos telemóveis com a
--                   app instalada, para o aviso chegar com a app fechada.
--
-- Não guarda segredos: o erro que vai no alerta é o que o bot já reporta para o
-- bot_runs (migração 021).
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,                       -- 'bot_stalled'
  data JSONB NOT NULL DEFAULT '{}'::jsonb,  -- ex.: { state, lastSuccessAt, lastRunAt, lastError }
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,     -- o problema passou (ex.: o bot voltou a importar)
  pushed_at TIMESTAMP WITH TIME ZONE        -- o push chegou a pelo menos um dispositivo
);

-- A página lê as mais recentes de um utilizador.
CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON notifications (user_id, created_at DESC);

-- No máximo UM alerta de bot parado em aberto por utilizador. É isto que torna
-- o vigia idempotente: corre de 10 em 10 minutos, e o INSERT ... ON CONFLICT DO
-- NOTHING só passa - e só manda push - na primeira vez de cada paragem.
CREATE UNIQUE INDEX IF NOT EXISTS notifications_bot_stalled_open
  ON notifications (user_id) WHERE kind = 'bot_stalled' AND resolved_at IS NULL;

CREATE TABLE IF NOT EXISTS push_devices (
  -- O token identifica o dispositivo. Um telemóvel é de quem entrou por último
  -- nele: um login noutra conta muda o dono, não cria outra linha.
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'android',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_devices_user_idx ON push_devices (user_id);
