-- Enable realtime for music_generations table
ALTER TABLE public.music_generations REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.music_generations;