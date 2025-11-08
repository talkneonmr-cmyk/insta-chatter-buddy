-- Create bulk_operation_logs table for tracking bulk video operations
CREATE TABLE IF NOT EXISTS public.bulk_operation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  operation_type text NOT NULL,
  videos_affected integer NOT NULL,
  success_count integer NOT NULL DEFAULT 0,
  failure_count integer NOT NULL DEFAULT 0,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bulk_operation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own bulk operation logs"
  ON public.bulk_operation_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bulk operation logs"
  ON public.bulk_operation_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_bulk_operation_logs_user_id ON public.bulk_operation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_bulk_operation_logs_created_at ON public.bulk_operation_logs(created_at DESC);