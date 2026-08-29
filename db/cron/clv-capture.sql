-- ============================================================
-- Agendamento da captura da odd de fecho (CLV)
--
-- NÃO É UMA MIGRAÇÃO. Não corre sozinho e não deve ser copiado para
-- db/migrations/: leva o domínio do deploy e depende de um segredo que não pode
-- viver no repositório. Corre-se À MÃO, uma vez, no SQL Editor do Supabase.
--
-- Porquê aqui e não no vercel.json: o plano Hobby da Vercel só dispara um cron
-- POR DIA, e esta captura precisa de passar de 5 em 5 minutos para apanhar o
-- último preço antes do apito. O pg_cron corre dentro do Postgres que já
-- pagamos, com granularidade ao minuto e sem mudar de plano.
--
-- Vale a regra da casa: o deploy da Vercel NÃO corre SQL. Enquanto isto não for
-- aplicado à mão, o endpoint existe e nunca é chamado - a funcionalidade fica
-- morta no ar sem dar erro nenhum.
-- ============================================================

-- 1. Extensões. Ambas estão disponíveis no projeto (pg_cron 1.6.4, pg_net
--    0.20.3), só não estavam instaladas.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. O segredo, no Vault - nunca em texto neste ficheiro nem no cron.job, que
--    é legível por quem tenha acesso à base de dados.
--    Tem de ser O MESMO valor da variável CRON_SECRET na Vercel.
--
--    select vault.create_secret('<o-mesmo-que-o-CRON_SECRET>', 'cron_secret');

-- 3. A passagem, de 5 em 5 minutos.
--    Trocar <DOMINIO> pelo domínio de produção antes de correr.
select cron.schedule(
  'clv-capture',
  '*/5 * * * *',
  $$
    select net.http_get(
      url := 'https://<DOMINIO>/api/clv/capture',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer ' || (select decrypted_secret
                        from vault.decrypted_secrets
                       where name = 'cron_secret')
      ),
      timeout_milliseconds := 55000
    );
  $$
);

-- ------------------------------------------------------------
-- Conferir depois de aplicar
-- ------------------------------------------------------------
-- O trabalho ficou agendado?
--   select jobid, jobname, schedule, active from cron.job where jobname = 'clv-capture';
--
-- Correu, e correu bem? (esperar duas passagens, ~10 min)
--   select runid, status, return_message, start_time
--     from cron.job_run_details
--    where jobid = (select jobid from cron.job where jobname = 'clv-capture')
--    order by start_time desc limit 5;
--
-- O que o endpoint respondeu (o pg_net guarda a resposta à parte):
--   select id, status_code, content::text
--     from net._http_response order by created desc limit 5;
--
-- Desligar, se for preciso:
--   select cron.unschedule('clv-capture');
