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
    const { audioUrl, text } = await req.json();

    if (!audioUrl || !text) {
      throw new Error("Missing required fields: audioUrl and text");
    }

    const ELEVEN_LABS_API_KEY = Deno.env.get("ELEVEN_LABS_API_KEY");
    if (!ELEVEN_LABS_API_KEY) {
      throw new Error("ELEVEN_LABS_API_KEY is not configured");
    }

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
    const voiceId = voiceData.voice_id;
    console.log("Voice created with ID:", voiceId);

    // Step 3: Generate speech using the cloned voice
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
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
    const base64 = btoa(String.fromCharCode(...new Uint8Array(audioArrayBuffer)));

    // Step 4: Clean up - delete the voice (optional, to avoid cluttering account)
    try {
      await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
        method: "DELETE",
        headers: {
          "xi-api-key": ELEVEN_LABS_API_KEY,
        },
      });
      console.log("Voice cleaned up");
    } catch (cleanupError) {
      console.warn("Failed to clean up voice:", cleanupError);
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
