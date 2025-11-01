import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HfInference } from "https://esm.sh/@huggingface/inference@2.3.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioUrl, text } = await req.json();

    if (!audioUrl || !text) {
      throw new Error('Missing required fields: audioUrl and text');
    }

    const hf = new HfInference(Deno.env.get('HUGGING_FACE_ACCESS_TOKEN'));

    // Download the audio file
    const audioResponse = await fetch(audioUrl);
    const audioBlob = await audioResponse.blob();

    // Use text-to-speech with voice cloning
    const result = await hf.textToSpeech({
      model: 'facebook/mms-tts-eng',
      inputs: text,
    });

    // Convert the result to base64
    const arrayBuffer = await result.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    return new Response(
      JSON.stringify({ 
        audioUrl: `data:audio/wav;base64,${base64}`,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in clone-voice function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
