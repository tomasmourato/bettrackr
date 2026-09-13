-- ============================================================
-- Agendamento do vigia do bot da Betclic (o alerta "o bot parou")
--
-- NÃO É UMA MIGRAÇÃO. Corre-se À MÃO, uma vez, no SQL Editor do Supabase de
-- produção - como o db/cron/clv-capture.sql, de onde reaproveita tudo: as
-- extensões pg_cron e pg_net e o segredo 'cron_secret' do Vault (o mesmo valor
-- do CRON_SECRET da Vercel) já lá estão desde 2026-08-29.
--
-- Porquê aqui e não no próprio bot: o alerta é para quando o bot NÃO consegue
-- importar - quem está parado não pode avisar que parou. E não no vercel.json
-- pela mesma razão do CLV: o plano Hobby só dispara um cron por dia.
--
-- De 10 em 10 minutos: com o limite de 1 hora (lib/botWatch.ts), o push sai
-- entre 60 e 70 minutos depois da última passagem com sucesso.
--
-- Pré-requisito: a migração db/migrations/025_notificacoes.sql aplicada. Sem
-- ela o endpoint responde 503 e não faz nada.
--
-- Mudar de domínio NÃO chega a mudar aqui: o url fica gravado dentro do
-- trabalho já agendado. Depois de editar é preciso voltar a correr o bloco,
-- precedido de select cron.unschedule('bot-watch');
-- ============================================================

select cron.schedule(
  'bot-watch',
  '*/10 * * * *',
  $$
    select net.http_get(
      url := 'https://bettrackr.dev/api/bot/watch',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer ' || (select decrypted_secret
                        from vault.decrypted_secrets
                       where name = 'cron_secret')
      ),
      timeout_milliseconds := 30000
    );
  $$
);

-- ------------------------------------------------------------
-- Conferir depois de aplicar
-- ------------------------------------------------------------
-- O trabalho ficou agendado?
--   select jobid, jobname, schedule, active from cron.job where jobname = 'bot-watch';
--
-- O que o endpoint respondeu (esperar ~10 min):
--   select id, status_code, content::text
--     from net._http_response order by created desc limit 5;
--
-- Os alertas abertos:
--   select user_id, created_at, pushed_at, data from notifications
--    where kind = 'bot_stalled' and resolved_at is null;
--
-- Desligar, se for preciso:
--   select cron.unschedule('bot-watch');
