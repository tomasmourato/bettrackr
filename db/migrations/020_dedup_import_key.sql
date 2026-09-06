-- ============================================================
-- Migração 020: deduplicação das importações por importKey
--
-- IDEMPOTENTE - pode ser executada várias vezes em segurança.
--
-- Até aqui não havia deduplicação do lado do servidor: o POST /api/bets/bulk é
-- um INSERT incondicional, e a única defesa era a extensão comparar em memória.
-- Duas importações concorrentes (extensão + bot) podiam criar a mesma aposta
-- duas vezes.
--
-- Esta migração fecha isso com um índice único parcial sobre
-- (user_id, metadata->>'importKey'). A partir daqui o /api/bets/bulk usa
-- ON CONFLICT DO NOTHING: reenviar uma aposta já importada é um no-op, não um
-- duplicado.
--
-- O importKey é a chave estável da casa (ex.: "betclic:<bet_reference>"),
-- escrita em metadata.importKey. Apostas SEM importKey - as manuais e as de
-- CSV/JSON antigas - não entram no índice (índice PARCIAL), por isso continuam
-- a poder repetir-se à vontade: a unicidade só se aplica a importações de casa.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Remover duplicados PRÉ-EXISTENTES, senão o índice único não pode ser
--    criado. De cada grupo (user_id, importKey) fica UMA linha - a que tem
--    odd de fecho (para não perder o CLV já apanhado); em empate, a mais
--    recente. As restantes são apagadas.
--
--    Para VER quantos seriam apagados ANTES de correr isto, usar o SELECT no
--    fim do ficheiro.
-- ------------------------------------------------------------
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, (metadata->>'importKey')
      ORDER BY (closing_odd IS NOT NULL) DESC, created_at DESC, id DESC
    ) AS rn
  FROM bets
  WHERE metadata->>'importKey' IS NOT NULL
)
DELETE FROM bets
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- ------------------------------------------------------------
-- 2. O índice único parcial. Depois disto, um INSERT com um importKey já
--    existente (para o mesmo utilizador) colide - e o ON CONFLICT DO NOTHING
--    do /api/bets/bulk trata a colisão como "já cá está".
-- ------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS bets_user_import_key_key
  ON bets (user_id, (metadata->>'importKey'))
  WHERE metadata->>'importKey' IS NOT NULL;

-- ------------------------------------------------------------
-- Conferir / pré-visualizar (não corre no fluxo da migração)
-- ------------------------------------------------------------
-- Quantos duplicados existem AGORA (antes de aplicar o passo 1)?
--   SELECT user_id, metadata->>'importKey' AS import_key, COUNT(*) AS n
--     FROM bets
--    WHERE metadata->>'importKey' IS NOT NULL
--    GROUP BY user_id, metadata->>'importKey'
--   HAVING COUNT(*) > 1
--    ORDER BY n DESC;
--
-- O índice ficou criado?
--   SELECT indexname FROM pg_indexes WHERE indexname = 'bets_user_import_key_key';
