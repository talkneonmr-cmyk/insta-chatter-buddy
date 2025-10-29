-- Sanitize system preset tags to avoid unsupported tags on Sonauto
UPDATE public.music_presets 
SET tags = ARRAY['chill','ambient','beats']
WHERE name = 'Chill Lo-fi' AND is_system_preset = true;

UPDATE public.music_presets 
SET tags = ARRAY['rock','energetic','electric','guitar']
WHERE name = 'Rock Energy' AND is_system_preset = true;