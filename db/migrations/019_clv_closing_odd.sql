-- ============================================================
-- Migração 019: odd de fecho (CLV - Closing Line Value)
--
-- IDEMPOTENTE - pode ser executada várias vezes em segurança.
--
-- Todas as métricas que a app tinha até aqui - lucro, yield, ROI da banca,
-- taxa de acerto - são RESULTADOS: dependem da sorte e só ficam legíveis ao
-- fim de muitas apostas. O CLV mede PROCESSO: compara a odd a que se apostou
-- com a odd de fecho (a última antes de o evento começar). Bater a linha de
-- fecho de forma consistente é o sinal mais rápido de que a seleção é boa - e
-- sabe-se antes de haver resultado, por isso uma aposta por liquidar já conta.
--
-- A odd é guardada ao nível da APOSTA, não da seleção: numa múltipla é a odd
-- de fecho combinada, tal como a coluna `odd` já é o produto das pernas. Odds
-- de fecho por perna cabem no `selections` (JSONB) sem migração, se um dia
-- fizerem falta.
--
-- NULL = ainda não se sabe, e é esse o estado da esmagadora maioria das linhas
-- ao aplicar esta migração. Por isso não há DEFAULT nem NOT NULL: a diferença
-- entre "não bati a linha" e "ainda não registei a linha" é justamente o que a
-- cobertura do CLV mede.
--
-- O CHECK usa > 1 (e não > 0) porque uma odd decimal abaixo de 1 pagaria menos
-- do que a stake - não existe. Deixa passar o NULL, que é o caso normal.
-- ============================================================

ALTER TABLE bets ADD COLUMN IF NOT EXISTS closing_odd DECIMAL;

ALTER TABLE bets DROP CONSTRAINT IF EXISTS bets_closing_odd_check;
ALTER TABLE bets ADD CONSTRAINT bets_closing_odd_check
  CHECK (closing_odd IS NULL OR closing_odd > 1);
