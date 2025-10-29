-- Enable realtime for usage_tracking table
ALTER TABLE public.usage_tracking REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.usage_tracking;