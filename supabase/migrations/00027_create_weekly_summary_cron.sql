-- Create pg_cron job for weekly summary emails
-- Runs every Monday at 9 AM UTC

-- Ensure pg_cron extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule weekly summary email job
-- This calls the Next.js API route which handles email sending
SELECT cron.schedule(
  'weekly-summary-emails',
  '0 9 * * 1', -- Every Monday at 9:00 AM UTC
  $$
  SELECT
    net.http_post(
      url := current_setting('app.weekly_summary_url', true)::text || '/api/email/weekly-summary',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.cron_secret', true)
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Note: To configure the URL and secret, set these database settings:
-- ALTER DATABASE your_database SET app.weekly_summary_url = 'https://your-domain.com';
-- ALTER DATABASE your_database SET app.cron_secret = 'your-secret-token';

