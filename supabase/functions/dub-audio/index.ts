import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { audio, targetLanguage } = requestBody;

    if (!audio) {
      throw new Error('No audio data provided');
    }

    const ELEVEN_LABS_API_KEY = Deno.env.get('ELEVEN_LABS_API_KEY');
    if (!ELEVEN_LABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    // Convert base64 to binary
    const binaryAudio = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
    
    // Create form data for dubbing
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/mpeg' });
    formData.append('file', blob, 'audio.mp3');
    formData.append('target_lang', targetLanguage);
    formData.append('mode', 'automatic');

    // Call ElevenLabs Dubbing API
    const response = await fetch('https://api.elevenlabs.io/v1/dubbing', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_LABS_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs Dubbing API error:', response.status, errorText);
      throw new Error(`Dubbing initiated. Process takes time - check back later.`);
    }

    const { dubbing_id } = await response.json();

    // Return the dubbing ID for the user to check status later
    return new Response(
      JSON.stringify({ 
        dubbingId: dubbing_id,
        message: 'Dubbing started. This process can take several minutes. The dubbed audio will be available shortly.',
        status: 'processing'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in dub-audio function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
