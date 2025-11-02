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
    const { audio, targetLanguage } = await req.json();

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
    formData.append('source_lang', 'auto');

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
      throw new Error(`Dubbing failed: ${response.status}`);
    }

    const { dubbing_id } = await response.json();

    // Poll for dubbing completion
    let attempts = 0;
    const maxAttempts = 30;
    let dubbingComplete = false;
    let audioUrl = '';

    while (attempts < maxAttempts && !dubbingComplete) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

      const statusResponse = await fetch(`https://api.elevenlabs.io/v1/dubbing/${dubbing_id}`, {
        headers: {
          'xi-api-key': ELEVEN_LABS_API_KEY,
        },
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to check dubbing status');
      }

      const status = await statusResponse.json();
      
      if (status.status === 'dubbed') {
        // Get the dubbed audio
        const audioResponse = await fetch(`https://api.elevenlabs.io/v1/dubbing/${dubbing_id}/audio/${targetLanguage}`, {
          headers: {
            'xi-api-key': ELEVEN_LABS_API_KEY,
          },
        });

        if (!audioResponse.ok) {
          throw new Error('Failed to download dubbed audio');
        }

        const audioBuffer = await audioResponse.arrayBuffer();
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
        audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
        dubbingComplete = true;
      } else if (status.status === 'error') {
        throw new Error('Dubbing failed');
      }

      attempts++;
    }

    if (!dubbingComplete) {
      throw new Error('Dubbing timed out');
    }

    return new Response(
      JSON.stringify({ audioUrl }),
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
