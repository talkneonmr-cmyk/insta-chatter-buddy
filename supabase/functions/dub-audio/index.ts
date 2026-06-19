import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ElevenLabs supported dubbing language codes (ISO 639-1)
const SUPPORTED_LANGS = new Set([
  'en','es','fr','de','it','pt','pl','tr','ru','nl','cs','ar','zh','ja','hu','ko','hi','id','fi','el','vi','no','da','ms','ro','sv','uk','bg','hr','sk','ta','tl'
]);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioUrl, targetLanguage, sourceLanguage, numSpeakers } = await req.json();

    if (!targetLanguage) {
      return new Response(JSON.stringify({ error: 'targetLanguage is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!audioUrl) {
      return new Response(JSON.stringify({ error: 'audioUrl is required (transcript-only dubbing is not supported - we need source audio to clone the voice)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!SUPPORTED_LANGS.has(targetLanguage)) {
      return new Response(JSON.stringify({ error: `Unsupported target language: ${targetLanguage}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ELEVEN_KEY = Deno.env.get('ELEVEN_LABS_API_KEY');
    if (!ELEVEN_KEY) throw new Error('ElevenLabs API key not configured');

    console.log('[dub-audio] Fetching source audio:', audioUrl);
    const srcRes = await fetch(audioUrl);
    if (!srcRes.ok) throw new Error(`Failed to fetch source audio: ${srcRes.status}`);
    const srcBlob = await srcRes.blob();
    const contentType = srcRes.headers.get('content-type') || 'audio/mpeg';
    const ext = contentType.includes('wav') ? 'wav' : contentType.includes('mp4') || contentType.includes('m4a') ? 'm4a' : 'mp3';

    // Step 1: Create dubbing job
    console.log('[dub-audio] Creating ElevenLabs dubbing job. Target:', targetLanguage);
    const form = new FormData();
    form.append('file', srcBlob, `source.${ext}`);
    form.append('target_lang', targetLanguage);
    form.append('source_lang', sourceLanguage || 'auto');
    form.append('num_speakers', String(numSpeakers ?? 0)); // 0 = auto-detect
    form.append('watermark', 'false');

    const createRes = await fetch('https://api.elevenlabs.io/v1/dubbing', {
      method: 'POST',
      headers: { 'xi-api-key': ELEVEN_KEY },
      body: form,
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error('[dub-audio] Create job failed:', createRes.status, errText);
      throw new Error(`ElevenLabs dubbing failed (${createRes.status}): ${errText}`);
    }

    const { dubbing_id, expected_duration_sec } = await createRes.json();
    console.log('[dub-audio] Job created:', dubbing_id, 'expected duration:', expected_duration_sec);

    // Step 2: Poll status (up to ~6 min)
    const maxAttempts = 90;
    const intervalMs = 4000;
    let status = 'dubbing';
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, intervalMs));
      const statusRes = await fetch(`https://api.elevenlabs.io/v1/dubbing/${dubbing_id}`, {
        headers: { 'xi-api-key': ELEVEN_KEY },
      });
      if (!statusRes.ok) {
        console.warn('[dub-audio] Status poll error:', statusRes.status);
        continue;
      }
      const statusData = await statusRes.json();
      status = statusData.status;
      console.log(`[dub-audio] Poll ${i + 1}: status=${status}`);
      if (status === 'dubbed') break;
      if (status === 'failed') throw new Error(`Dubbing failed: ${statusData.error || 'unknown error'}`);
    }

    if (status !== 'dubbed') throw new Error('Dubbing timed out. Try a shorter audio file.');

    // Step 3: Download dubbed audio
    console.log('[dub-audio] Downloading dubbed audio...');
    const audioRes = await fetch(`https://api.elevenlabs.io/v1/dubbing/${dubbing_id}/audio/${targetLanguage}`, {
      headers: { 'xi-api-key': ELEVEN_KEY },
    });
    if (!audioRes.ok) {
      const err = await audioRes.text();
      throw new Error(`Failed to download dubbed audio: ${audioRes.status} ${err}`);
    }
    const dubbedBuffer = await audioRes.arrayBuffer();

    // Step 4: Try to get transcript/translation (optional)
    let transcript: string | undefined;
    let translation: string | undefined;
    try {
      const trRes = await fetch(`https://api.elevenlabs.io/v1/dubbing/${dubbing_id}/transcript/${targetLanguage}?format_type=srt`, {
        headers: { 'xi-api-key': ELEVEN_KEY },
      });
      if (trRes.ok) translation = await trRes.text();
    } catch (_) { /* optional */ }

    // Step 5: Upload to storage
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const fileName = `dubbed-${targetLanguage}-${Date.now()}.mp4`;
    const { error: uploadError } = await supabase.storage
      .from('voice-samples')
      .upload(fileName, new Uint8Array(dubbedBuffer), {
        contentType: 'audio/mp4',
        upsert: true,
      });
    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from('voice-samples').getPublicUrl(fileName);
    console.log('[dub-audio] Done. URL:', urlData.publicUrl);

    return new Response(
      JSON.stringify({
        audioUrl: urlData.publicUrl,
        status: 'completed',
        dubbingId: dubbing_id,
        translation,
        message: 'Dubbing completed with original voice preserved',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[dub-audio] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
