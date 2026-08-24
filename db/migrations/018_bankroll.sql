-- ============================================================
-- Migração 018: banca (depósitos, levantamentos e ajustes)
--
-- IDEMPOTENTE - pode ser executada várias vezes em segurança.
--
-- A app sabia o lucro de cada aposta mas nunca soube quanto dinheiro o
-- utilizador tem. Sem isso o ROI real não se calcula (só o yield sobre o
-- volume apostado) e o Kelly dos insights só podia dizer "x% do banco".
--
-- Aqui só entra dinheiro REAL a entrar e a sair das casas. O saldo não é
-- guardado: é derivado de SUM(amount) mais o lucro líquido das apostas já
-- liquidadas, que a app já tem. Assim não há dupla contabilidade nem forma
-- de o saldo divergir do histórico de apostas.
--
-- O amount é guardado COM SINAL para o saldo ser um SUM directo. O CHECK
-- impede um depósito negativo ou um levantamento positivo; o AJUSTE é o
-- único que pode ir nos dois sentidos, e serve para bónus, correções e para
-- reconciliar o que a fórmula não vê (ex.: apostas marcadas como ignoradas,
-- que ficam de fora de todas as estatísticas).
--
-- O account_id fica aqui desde o início, sempre NULL por agora: a banca é
-- global. Quando passar a ser por conta, é só passar a preenchê-lo - não é
-- preciso migrar nem fazer backfill.
-- ============================================================

CREATE TABLE IF NOT EXISTS bankroll_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  -- Efeito com sinal na banca: depósito positivo, levantamento negativo.
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

CREATE INDEX IF NOT EXISTS bankroll_movements_user_idx
  ON bankroll_movements (user_id, occurred_at DESC);
