import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    const { audio } = requestBody;
    
    if (!audio) {
      throw new Error("No audio data provided");
    }

    // Try Deepgram first (faster, more accurate), fall back to ElevenLabs
    const DEEPGRAM_API_KEY = Deno.env.get("DEEPGRAM_API_KEY");
    const ELEVEN_LABS_API_KEY = Deno.env.get("ELEVEN_LABS_API_KEY");

    // Decode base64 audio
    const binaryString = atob(audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    let transcriptionText: string;

    if (DEEPGRAM_API_KEY) {
      console.log("Processing audio transcription with Deepgram (primary)...");
      
      const response = await fetch(
        "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true&diarize=true&language=en",
        {
          method: "POST",
          headers: {
            "Authorization": `Token ${DEEPGRAM_API_KEY}`,
            "Content-Type": "audio/webm",
          },
          body: bytes,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Deepgram error:", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again in a minute." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Fall back to ElevenLabs if Deepgram fails
        if (ELEVEN_LABS_API_KEY) {
          console.log("Deepgram failed, falling back to ElevenLabs...");
          transcriptionText = await transcribeWithElevenLabs(ELEVEN_LABS_API_KEY, bytes);
        } else {
          throw new Error(`Deepgram API error: ${errorText}`);
        }
      } else {
        const result = await response.json();
        transcriptionText = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
        
        if (!transcriptionText) {
          throw new Error("No transcription generated");
        }
      }
    } else if (ELEVEN_LABS_API_KEY) {
      console.log("Processing audio transcription with ElevenLabs (fallback)...");
      transcriptionText = await transcribeWithElevenLabs(ELEVEN_LABS_API_KEY, bytes);
    } else {
      throw new Error("No speech-to-text API key configured (DEEPGRAM_API_KEY or ELEVEN_LABS_API_KEY)");
    }

    return new Response(
      JSON.stringify({ text: transcriptionText! }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in speech-to-text function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function transcribeWithElevenLabs(apiKey: string, audioBytes: Uint8Array): Promise<string> {
  const formData = new FormData();
  const blob = new Blob([audioBytes], { type: "audio/webm" });
  formData.append("file", blob, "audio.webm");
  formData.append("model_id", "scribe_v1");

  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const raw = await response.text();
    console.error("ElevenLabs API error:", raw);
    throw new Error(`ElevenLabs transcription failed: ${raw}`);
  }

  const result = await response.json();
  return result.text || "";
}
