-- Supabase pg_cron schedules for Gedi push notifications.
-- Run this in the Supabase SQL editor after deploying the Edge Function.
--
-- Enable pg_cron extension first (Supabase Dashboard → Database → Extensions → pg_cron).
-- All times are UTC. HKV is UTC+5:30, so:
--   18:00 IST = 12:30 UTC
--   09:00 IST = 03:30 UTC

-- 1. Evening notification — 6 PM IST daily (12:30 UTC)
select cron.schedule(
  'gedi-evening-notif',
  '30 12 * * *',
  $$
    select net.http_post(
      url := current_setting('app.supabase_functions_url') || '/send-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := '{"type":"evening"}'::jsonb
    );
  $$
);

-- 2. Saved-places reminder — 7 PM IST Friday (13:30 UTC)
select cron.schedule(
  'gedi-saved-reminder',
  '30 13 * * 5',
  $$
    select net.http_post(
      url := current_setting('app.supabase_functions_url') || '/send-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := '{"type":"saved_reminder"}'::jsonb
    );
  $$
);

-- 3. Weekly nudge — 11 AM IST Sunday (05:30 UTC)
select cron.schedule(
  'gedi-weekly-nudge',
  '30 5 * * 0',
  $$
    select net.http_post(
      url := current_setting('app.supabase_functions_url') || '/send-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := '{"type":"weekly_nudge"}'::jsonb
    );
  $$
);

-- View scheduled jobs:
-- select * from cron.job;

-- Remove a job:
-- select cron.unschedule('gedi-evening-notif');
