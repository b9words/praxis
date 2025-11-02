-- Create pg_cron job to process background jobs
-- Runs every minute

-- Ensure pg_cron extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule job processing
SELECT cron.schedule(
  'process-background-jobs',
  '* * * * *', -- Every minute
  $$
  SELECT
    net.http_post(
      url := current_setting('app.supabase_url', true)::text || '/functions/v1/process-jobs',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Note: To configure the URL and key, set these database settings:
-- ALTER DATABASE your_database SET app.supabase_url = 'https://your-project.supabase.co';
-- ALTER DATABASE your_database SET app.service_role_key = 'your-service-role-key';

