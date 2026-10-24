-- ============================================================
-- Migração 027: um nome por desporto, e a liga das apostas da Betclic
--
-- IDEMPOTENTE - pode ser executada várias vezes em segurança. Só mexe nas
-- pernas que ainda não estão como devem; uma segunda passagem não muda nada.
--
-- 1. DESPORTO. Cada fonte gravava o desporto à sua maneira - "Futebol" da
--    Betclic, "FOOTBALL" da Betano, "FOOT" da Solverde, "FUTEBOL" dos CSV - e
--    o filtro mostrava três futebóis. O servidor passa a normalizar ao gravar
--    (lib/sport.ts); isto faz o mesmo às apostas que já lá estavam.
--
--    A tabela de nomes abaixo é uma CÓPIA da SPORT_ALIASES de lib/sport.ts. O
--    teste test/server/sport.test.ts lê este ficheiro e falha se divergirem.
--
--    As pernas SEM desporto ficam como estão: não há de onde o tirar sem
--    adivinhar (são as apostas manuais e as dos screenshots). A app passa a
--    oferecer "Sem desporto" no filtro para se acharem e corrigirem em bloco.
--
-- 2. COMPETIÇÃO. A aposta da Betclic não traz a liga, só o matchId de cada
--    perna. A tabela daily_odds (migração 020) guarda a liga por match_id, e é
--    daí que se preenche `selections[].competition` nas pernas que ainda não a
--    têm. Daqui para a frente a liga chega também pela captura do CLV, que lê a
--    página do jogo, e o servidor repete este preenchimento a cada entrega das
--    odds do dia (routes/clvRoutes.ts).
--
--    Só cobre os jogos que o agente apanhou nas odds do dia (as listagens de
--    futebol, ténis e basquetebol, até 40 por dia, desde que a 020 existe).
--    Os outros não têm de onde vir sem voltar a pedir a página à Betclic.
--
--    Requer a migração 020 (daily_odds) aplicada.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Desporto
-- ------------------------------------------------------------

-- A mesma regra do normalizeSport: sem acentos, sem caixa e sem pontuação
-- para comparar; um desconhecido fica com a caixa arrumada (siglas de até 3
-- letras em maiúsculas); vazio, "undefined", "null" ou só números dão NULL.
CREATE OR REPLACE FUNCTION pg_temp.normalizar_desporto(cru text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  WITH limpo AS (
    SELECT regexp_replace(btrim(cru), '\s+', ' ', 'g') AS v
  ), chave AS (
    SELECT v,
           regexp_replace(
             lower(translate(v,
               'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
               'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn')),
             '[^a-z0-9]+', '', 'g') AS k
      FROM limpo
  ), nomes(k, nome) AS (VALUES
    ('futebol', 'Futebol'), ('football', 'Futebol'), ('soccer', 'Futebol'), ('futbol', 'Futebol'), ('foot', 'Futebol'),
    ('futsal', 'Futsal'),
    ('futebolamericano', 'Futebol americano'), ('americanfootball', 'Futebol americano'),
    ('tenis', 'Ténis'), ('tennis', 'Ténis'), ('tenn', 'Ténis'),
    ('tenisdemesa', 'Ténis de mesa'), ('tabletennis', 'Ténis de mesa'),
    ('basquetebol', 'Basquetebol'), ('basketball', 'Basquetebol'), ('basket', 'Basquetebol'), ('basquete', 'Basquetebol'), ('bask', 'Basquetebol'),
    ('andebol', 'Andebol'), ('handball', 'Andebol'),
    ('voleibol', 'Voleibol'), ('volleyball', 'Voleibol'), ('volei', 'Voleibol'),
    ('hoqueinogelo', 'Hóquei no gelo'), ('icehockey', 'Hóquei no gelo'),
    ('hoqueiempatins', 'Hóquei em patins'), ('rinkhockey', 'Hóquei em patins'), ('rollerhockey', 'Hóquei em patins'),
    ('basebol', 'Basebol'), ('baseball', 'Basebol'),
    ('raguebi', 'Râguebi'), ('rugby', 'Râguebi'), ('rugbyunion', 'Râguebi'), ('rugbyleague', 'Râguebi'),
    ('artesmarciais', 'Artes marciais'), ('artesmarciaismistas', 'Artes marciais'), ('mma', 'Artes marciais'), ('ufc', 'Artes marciais'),
    ('boxe', 'Boxe'), ('boxing', 'Boxe'),
    ('formula1', 'Fórmula 1'), ('f1', 'Fórmula 1'),
    ('automobilismo', 'Automobilismo'), ('motorsport', 'Automobilismo'), ('motorsports', 'Automobilismo'),
    ('ciclismo', 'Ciclismo'), ('cycling', 'Ciclismo'),
    ('golfe', 'Golfe'), ('golf', 'Golfe'),
    ('snooker', 'Snooker'),
    ('dardos', 'Dardos'), ('darts', 'Dardos'),
    ('esports', 'eSports'), ('esport', 'eSports'),
    ('badminton', 'Badminton'),
    ('criquete', 'Críquete'), ('cricket', 'Críquete'),
    ('poloaquatico', 'Polo aquático'), ('waterpolo', 'Polo aquático')
  )
  SELECT CASE
           WHEN cru IS NULL THEN NULL
           WHEN chave.k IN ('', 'undefined', 'null') OR chave.k ~ '^[0-9]+$' THEN NULL
           ELSE COALESCE(
             (SELECT nome FROM nomes WHERE nomes.k = chave.k),
             CASE WHEN length(chave.v) <= 3 THEN upper(chave.v)
                  ELSE upper(left(chave.v, 1)) || lower(substr(chave.v, 2)) END)
         END
    FROM chave
$$;

-- O SET recalcula a partir de b.selections (e não de uma subconsulta no
-- FROM) para que, se o utilizador gravar a aposta a meio, o Postgres refaça a
-- conta sobre a versão nova em vez de a pisar com a antiga.
UPDATE bets b
   SET selections = (
         SELECT jsonb_agg(
                  CASE
                    WHEN jsonb_typeof(e.leg) <> 'object'
                      OR e.leg->>'sport' IS NULL
                      OR pg_temp.normalizar_desporto(e.leg->>'sport') IS NOT DISTINCT FROM e.leg->>'sport'
                      THEN e.leg
                    WHEN pg_temp.normalizar_desporto(e.leg->>'sport') IS NULL
                      THEN e.leg - 'sport'
                    ELSE e.leg || jsonb_build_object('sport', pg_temp.normalizar_desporto(e.leg->>'sport'))
                  END
                  ORDER BY e.ord)
           FROM jsonb_array_elements(b.selections) WITH ORDINALITY AS e(leg, ord)
       ),
       updated_at = TIMEZONE('utc', NOW())
 WHERE jsonb_typeof(b.selections) = 'array'
   AND EXISTS (
         SELECT 1
           FROM jsonb_array_elements(b.selections) l
          WHERE jsonb_typeof(l) = 'object'
            AND l->>'sport' IS NOT NULL
            AND pg_temp.normalizar_desporto(l->>'sport') IS DISTINCT FROM l->>'sport'
       );

-- ------------------------------------------------------------
-- 2. Competição, a partir do matchId
-- ------------------------------------------------------------

-- O preenchimento procura a liga por match_id, e a chave primária da
-- daily_odds começa pelo dia.
CREATE INDEX IF NOT EXISTS daily_odds_match_idx ON daily_odds (match_id);

-- A mesma instrução que o servidor corre a cada entrega das odds do dia
-- (preencherCompeticoes em routes/clvRoutes.ts), aqui sobre o histórico todo.
UPDATE bets b
   SET selections = (
         SELECT jsonb_agg(
                  CASE WHEN liga.competition IS NULL THEN e.leg
                       ELSE e.leg || jsonb_build_object('competition', liga.competition) END
                  ORDER BY e.ord)
           FROM jsonb_array_elements(b.selections) WITH ORDINALITY AS e(leg, ord)
           LEFT JOIN LATERAL (
                 SELECT o.competition
                   FROM daily_odds o
                  WHERE jsonb_typeof(e.leg) = 'object'
                    AND COALESCE(e.leg->>'competition', '') = ''
                    AND o.match_id = e.leg->'sourceRef'->>'matchId'
                    AND o.competition IS NOT NULL
                  ORDER BY o.captured_at DESC
                  LIMIT 1
                ) liga ON TRUE
       ),
       updated_at = TIMEZONE('utc', NOW())
 WHERE jsonb_typeof(b.selections) = 'array'
   AND EXISTS (
         SELECT 1
           FROM jsonb_array_elements(b.selections) l
           JOIN daily_odds o ON o.match_id = l->'sourceRef'->>'matchId'
          WHERE jsonb_typeof(l) = 'object'
            AND COALESCE(l->>'competition', '') = ''
            AND o.competition IS NOT NULL
       );

COMMIT;
