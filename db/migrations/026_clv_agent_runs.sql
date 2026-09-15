-- ============================================================
-- Migração 026: registo das passagens do agente de CLV
--
-- IDEMPOTENTE - pode ser executada várias vezes em segurança.
--
-- O agente residencial (agent/clv-agent.ts) passa a contar cada passagem ao
-- servidor (POST /api/clv/heartbeat), como o bot da Betclic já faz para o
-- bot_runs (migração 021), e o painel do bot mostra-as lado a lado. Sem isto o
-- agente era invisível: uma passagem sem jogos na janela, ou com todas as
-- leituras recusadas pela Betclic, nunca chegava ao /submit e o servidor nem
-- sabia que tinha corrido.
--
-- Ao contrário do bot_runs NÃO tem user_id: há um só agente para o serviço
-- todo, e os números (apostas por liquidar, apostas escritas) somam todas as
-- contas. Por isso só o staff os recebe (routes/botRoutes.ts).
--
-- O agente corre de 5 em 5 minutos: o servidor poda o que passar de 7 dias.
-- NÃO guarda segredos nem apostas. Só telemetria.
-- ============================================================

CREATE TABLE IF NOT EXISTS clv_agent_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- 'capture' = odd de fecho (5 em 5 min); 'daily' = odds do dia (madrugada)
  kind TEXT NOT NULL DEFAULT 'capture' CHECK (kind IN ('capture', 'daily')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_ms INTEGER,
  ok BOOLEAN NOT NULL,
  candidates INTEGER,                      -- apostas por liquidar consideradas (só 'capture')
  matches INTEGER NOT NULL DEFAULT 0,      -- jogos a ler / jogos encontrados nas listagens
  read_count INTEGER NOT NULL DEFAULT 0,   -- páginas lidas com preços / jogos com mercado completo
  written INTEGER NOT NULL DEFAULT 0,      -- apostas escritas / jogos gravados
  failures TEXT,                           -- "matchId:motivo | ..." quando alguma leitura falhou
  error TEXT,                              -- mensagem, quando ok = false
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- O painel lê as passagens mais recentes; a poda apaga as mais antigas.
CREATE INDEX IF NOT EXISTS clv_agent_runs_started_idx
  ON clv_agent_runs (started_at DESC);
