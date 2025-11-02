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
    const { audio, targetVoice } = await req.json();

    if (!audio) {
      throw new Error('No audio data provided');
    }

    const ELEVEN_LABS_API_KEY = Deno.env.get('ELEVEN_LABS_API_KEY');
    if (!ELEVEN_LABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    // Convert base64 to binary
    const binaryAudio = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
    
    // Map target voice to ElevenLabs voice ID
    const voiceMap: Record<string, string> = {
      'male': 'TX3LPaxmHKxFdv7VOQHJ', // Liam
      'female': 'EXAVITQu4vr4xnSDxMaL', // Sarah
      'child': 'pFZP5JQG7iQjIQuC4Bku', // Lily
      'elderly': 'CwhRBWXzGAHq8TQ4Fs17', // Roger
    };

    const voiceId = voiceMap[targetVoice] || voiceMap['male'];

    // First, transcribe the audio to get the text
    const transcribeFormData = new FormData();
    const audioBlob = new Blob([binaryAudio], { type: 'audio/mpeg' });
    transcribeFormData.append('audio', audioBlob, 'audio.mp3');
    transcribeFormData.append('model_id', 'eleven_multilingual_sts_v2');

    const transcribeResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_LABS_API_KEY,
      },
      body: transcribeFormData,
    });

    if (!transcribeResponse.ok) {
      const errorText = await transcribeResponse.text();
      console.error('Transcription error:', transcribeResponse.status, errorText);
      throw new Error(`Transcription failed: ${transcribeResponse.status}`);
    }

    const { text } = await transcribeResponse.json();

    // Generate speech with the target voice
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_LABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('TTS error:', ttsResponse.status, errorText);
      throw new Error(`Voice change failed: ${ttsResponse.status}`);
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
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
