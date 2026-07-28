-- ============================================================
-- Migração 014: dicas diárias por idioma
--
-- IDEMPOTENTE — pode ser executada várias vezes em segurança.
--
-- A cache das dicas era UMA linha por dia (UNIQUE em insight_date), partilhada
-- por todos. Com a app em PT/EN isso significava que o primeiro pedido do dia
-- fixava o idioma para toda a gente — um utilizador inglês recebia (e podia
-- gravar) dicas em português. A chave passa a ser (insight_date, lang).
--
-- As linhas que já existem são português, por isso o backfill é 'pt'.
-- ============================================================

ALTER TABLE daily_insights ADD COLUMN IF NOT EXISTS lang TEXT NOT NULL DEFAULT 'pt';

-- Só os idiomas com dicionário na app (espelha src/lib/i18n).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_insights_lang_check'
  ) THEN
    ALTER TABLE daily_insights
      ADD CONSTRAINT daily_insights_lang_check CHECK (lang IN ('pt', 'en'));
  END IF;
END $$;

-- Troca o UNIQUE(insight_date) por UNIQUE(insight_date, lang). O nome da
-- constraint antiga depende de como a tabela foi criada, por isso procura-se
-- qualquer unique que cubra apenas insight_date.
DO $$
DECLARE
  old_constraint TEXT;
BEGIN
  SELECT con.conname INTO old_constraint
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'daily_insights'
    AND con.contype = 'u'
    AND con.conkey = ARRAY[
      (SELECT attnum FROM pg_attribute
        WHERE attrelid = rel.oid AND attname = 'insight_date')
    ]::smallint[]
  LIMIT 1;

  IF old_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE daily_insights DROP CONSTRAINT %I', old_constraint);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_insights_date_lang_key'
  ) THEN
    ALTER TABLE daily_insights
      ADD CONSTRAINT daily_insights_date_lang_key UNIQUE (insight_date, lang);
  END IF;
END $$;
