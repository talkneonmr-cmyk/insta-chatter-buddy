import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioUrl, text, voiceId, usePreMadeVoice } = await req.json();

    if (!text) {
      throw new Error("Missing required field: text");
    }

    if (!usePreMadeVoice && !audioUrl) {
      throw new Error("Missing required field: audioUrl for voice cloning");
    }

    const ELEVEN_LABS_API_KEY = Deno.env.get("ELEVEN_LABS_API_KEY");
    if (!ELEVEN_LABS_API_KEY) {
      throw new Error("ELEVEN_LABS_API_KEY is not configured");
    }

    let finalVoiceId = voiceId;
    let shouldCleanup = false;

    // If using pre-made voice, use the provided voice ID
    if (usePreMadeVoice) {
      console.log("Using pre-made voice:", voiceId);
      finalVoiceId = voiceId || "9BWtsMINqrJLrRacOk9x"; // Default to Aria
    } else {
      // Clone voice from audio sample
      console.log("Cloning voice with Eleven Labs...");

      // Step 1: Download the audio sample
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error("Failed to fetch audio sample");
      }
      const audioBlob = await audioResponse.blob();

      // Step 2: Create a voice with Eleven Labs
      const formData = new FormData();
      formData.append("name", `Voice_${Date.now()}`);
      formData.append("files", audioBlob, "sample.mp3");
      formData.append("description", "Cloned voice from user upload");

      const addVoiceResponse = await fetch("https://api.elevenlabs.io/v1/voices/add", {
        method: "POST",
        headers: {
          "xi-api-key": ELEVEN_LABS_API_KEY,
        },
        body: formData,
      });

      if (!addVoiceResponse.ok) {
        const errorText = await addVoiceResponse.text();
        console.error("Eleven Labs add voice error:", errorText);
        throw new Error(`Failed to create voice: ${errorText}`);
      }

      const voiceData = await addVoiceResponse.json();
      finalVoiceId = voiceData.voice_id;
      shouldCleanup = true;
      console.log("Voice created with ID:", finalVoiceId);
    }

    // Step 3: Generate speech using the voice
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVEN_LABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error("Eleven Labs TTS error:", errorText);
      throw new Error(`Failed to generate speech: ${errorText}`);
    }

    const audioArrayBuffer = await ttsResponse.arrayBuffer();
    
    // Convert to base64 in chunks to avoid stack overflow
    const uint8Array = new Uint8Array(audioArrayBuffer);
    const chunkSize = 8192;
    let binaryString = '';
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binaryString += String.fromCharCode(...chunk);
    }
    
    const base64 = btoa(binaryString);

    // Step 4: Clean up - delete the voice if we cloned it
    if (shouldCleanup) {
      try {
        await fetch(`https://api.elevenlabs.io/v1/voices/${finalVoiceId}`, {
          method: "DELETE",
          headers: {
            "xi-api-key": ELEVEN_LABS_API_KEY,
          },
        });
        console.log("Voice cleaned up");
      } catch (cleanupError) {
        console.warn("Failed to clean up voice:", cleanupError);
      }
    }

    return new Response(
      JSON.stringify({
        audioUrl: `data:audio/mpeg;base64,${base64}`,
        success: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in clone-voice function:", error);
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
