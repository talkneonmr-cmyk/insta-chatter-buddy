-- Update system presets to use valid tags only
UPDATE public.music_presets 
SET tags = ARRAY['lofi', 'chill', 'hiphop', 'beats']
WHERE name = 'Chill Lo-fi' AND is_system_preset = true;

UPDATE public.music_presets 
SET tags = ARRAY['rock', 'energy', 'electric', 'guitar']
WHERE name = 'Rock Energy' AND is_system_preset = true;