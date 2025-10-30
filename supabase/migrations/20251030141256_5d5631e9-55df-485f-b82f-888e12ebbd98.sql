-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant permissions to make HTTP requests
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Create a cron job to process scheduled uploads every minute
SELECT cron.schedule(
  'process-scheduled-uploads-every-minute',
  '* * * * *', -- Run every minute
  $$
  SELECT
    net.http_post(
        url:='https://swuryncvasdwlxtwagnb.supabase.co/functions/v1/process-scheduled-uploads',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dXJ5bmN2YXNkd2x4dHdhZ25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNTQ5OTksImV4cCI6MjA3NjkzMDk5OX0.e77B2hbZX0Bs2QBSHOj1w4APQaBN3s3kbdX3GxS4L8I"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);