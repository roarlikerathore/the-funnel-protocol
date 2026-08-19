-- ===========================================================================
-- SCHEDULING
-- Registration fires the confirmation itself. These exist for the two things a
-- trigger cannot do: messages whose moment is in the future, and retries.
-- ===========================================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule(jobid) FROM cron.job
 WHERE jobname IN ('send-emails','send-whatsapp','run-calls','sync-calls');

-- Every minute: "we are live" is worthless at minute five.
SELECT cron.schedule('send-emails', '* * * * *', $$
  SELECT net.http_post(
    url     := '{{PROJECT_URL}}/functions/v1/process-email-queue',
    headers := jsonb_build_object('Content-Type','application/json',
                                  'Authorization','Bearer {{ANON_KEY}}'),
    body    := '{}'::jsonb);
$$);

SELECT cron.schedule('send-whatsapp', '* * * * *', $$
  SELECT net.http_post(
    url     := '{{PROJECT_URL}}/functions/v1/process-whatsapp-queue',
    headers := jsonb_build_object('Content-Type','application/json',
                                  'Authorization','Bearer {{ANON_KEY}}'),
    body    := '{}'::jsonb);
$$);

-- Every 2 minutes so the reminder window clears in time.
SELECT cron.schedule('run-calls', '*/2 * * * *', $$
  SELECT net.http_post(
    url     := '{{PROJECT_URL}}/functions/v1/ai-calls',
    headers := jsonb_build_object('Content-Type','application/json',
                                  'Authorization','Bearer {{ANON_KEY}}'),
    body    := '{"action":"run_queue"}'::jsonb);
$$);

-- Reporting only, no rush.
SELECT cron.schedule('sync-calls', '*/15 * * * *', $$
  SELECT net.http_post(
    url     := '{{PROJECT_URL}}/functions/v1/ai-calls',
    headers := jsonb_build_object('Content-Type','application/json',
                                  'Authorization','Bearer {{ANON_KEY}}'),
    body    := '{"action":"sync_calls"}'::jsonb);
$$);

-- Verify with:  SELECT jobname, schedule, active FROM cron.job;
