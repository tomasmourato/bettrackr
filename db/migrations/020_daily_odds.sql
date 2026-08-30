-- ============================================================
-- Migração 020: odds reais do dia, para as dicas de IA
--
-- IDEMPOTENTE - pode ser executada várias vezes em segurança.
--
-- Porque existe: as dicas diárias pediam ao modelo as odds junto com os jogos,
-- num campo chamado `approxOdd` - aproximada, e o nome não mentia. O prompt
-- chegava a pedir-lhe uma "variedade" de odds, o que é o mesmo que pedir
-- números plausíveis. Uma dica com uma odd que não existe em lado nenhum não é
-- acionável: o utilizador vai à casa e o preço é outro.
--
-- O que muda: um agente numa ligação residencial lê as páginas públicas da
-- Betclic de madrugada e grava aqui os preços REAIS de cada mercado, já com a
-- margem da casa calculada. O modelo deixa de inventar preços e passa a
-- receber os verdadeiros.
--
-- A margem é a parte que vale mais do que parece. É aritmética, não previsão:
-- dizer "este mercado leva 4% e aquele leva 19%" é uma vantagem real e
-- verificável, ao contrário de tentar adivinhar melhor do que a casa - que é
-- coisa que nem um modelo de linguagem nem ninguém faz de forma consistente.
--
-- Os preços NÃO são a linha de fecho e não servem para CLV: são de madrugada,
-- muito antes do apito. O CLV continua a vir da coluna `closing_odd` das bets.
-- ============================================================

create table if not exists daily_odds (
  -- O dia desportivo em Lisboa, que é o que a app mostra ao utilizador.
  odds_date     date        not null,
  -- Id do jogo na Betclic. É o mesmo que as bets guardam em
  -- selections->sourceRef->matchId, por isso dá para cruzar as duas coisas.
  match_id      text        not null,
  event         text        not null,
  competition   text,
  kickoff_utc   timestamptz,
  -- [{ id, name, marginPct, boosted, selections: [{ id, name, odd, noVig }] }]
  -- Só mercados COMPLETOS entram: um mercado a que falte uma seleção daria
  -- margem negativa e odds "justas" maiores do que as reais.
  markets       jsonb       not null,
  captured_at   timestamptz not null default timezone('utc', now()),

  -- Um retrato por jogo por dia. Uma segunda passagem no mesmo dia atualiza
  -- em vez de duplicar.
  primary key (odds_date, match_id)
);

-- As dicas pedem os jogos de um dia por ordem de apito.
create index if not exists daily_odds_dia_apito_idx
  on daily_odds (odds_date, kickoff_utc);

-- ------------------------------------------------------------
-- Limpeza. Isto cresce todos os dias e nada aqui interessa depois de o jogo
-- se realizar - o histórico que vale é o closing_odd das apostas.
-- ------------------------------------------------------------
-- delete from daily_odds where odds_date < current_date - interval '30 days';
