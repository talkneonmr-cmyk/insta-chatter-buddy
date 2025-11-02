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

    const { audio, targetVoice } = requestBody;

    if (!audio) {
      throw new Error('No audio data provided');
    }

    const ELEVEN_LABS_API_KEY = Deno.env.get('ELEVEN_LABS_API_KEY');
    if (!ELEVEN_LABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    // Map target voice to ElevenLabs voice ID
    const voiceMap: Record<string, string> = {
      'male': 'TX3LPaxmHKxFdv7VOQHJ', // Liam
      'female': 'EXAVITQu4vr4xnSDxMaL', // Sarah
      'child': 'pFZP5JQG7iQjIQuC4Bku', // Lily
      'elderly': 'CwhRBWXzGAHq8TQ4Fs17', // Roger
    };

    const voiceId = voiceMap[targetVoice] || voiceMap['male'];

    // Convert base64 to binary
    const binaryAudio = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
    
    // Create form data for speech-to-speech
    const formData = new FormData();
    const audioBlob = new Blob([binaryAudio], { type: 'audio/mpeg' });
    formData.append('audio', audioBlob, 'audio.mp3');
    formData.append('model_id', 'eleven_english_sts_v2');

    // Use Speech-to-Speech API for direct voice conversion
    const response = await fetch(`https://api.elevenlabs.io/v1/speech-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_LABS_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Voice change error:', response.status, errorText);
      throw new Error(`Voice change failed: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return new Response(
      JSON.stringify({ audioUrl }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in change-voice function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
