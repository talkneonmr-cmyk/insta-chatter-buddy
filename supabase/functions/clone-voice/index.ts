import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { audioUrl, text, voiceId, usePreMadeVoice } = requestBody;

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
         const status = addVoiceResponse.status;
         const errorText = await addVoiceResponse.text();
         console.error("Eleven Labs add voice error:", status, errorText);
         if (status === 402 || /free|upgrade|plan|payment/i.test(errorText)) {
           return new Response(
             JSON.stringify({
               error: "Voice cloning requires an Eleven Labs paid plan.",
               code: "ELEVENLABS_PAID_REQUIRED",
             }),
             { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
           );
         }
         throw new Error(`Failed to create voice: ${errorText}`);
       }

       const voiceData = await addVoiceResponse.json();
       finalVoiceId = voiceData.voice_id;
       shouldCleanup = true;
       console.log("Voice created with ID:", finalVoiceId);
       // Wait briefly for voice to be ready
       await new Promise((res) => setTimeout(res, 1500));
     }

     // Step 3: Generate speech using the voice (with simple retry for readiness)
     let ttsResponse: Response | null = null;
     let lastTtsErrorText = "";
     for (let attempt = 1; attempt <= 3; attempt++) {
       const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}`, {
         method: "POST",
         headers: {
           "xi-api-key": ELEVEN_LABS_API_KEY,
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           text,
           model_id: "eleven_multilingual_v2",
           voice_settings: {
             stability: 0.5,
             similarity_boost: 0.75,
           },
         }),
       });
       if (resp.ok) {
         ttsResponse = resp;
         break;
       }
       const status = resp.status;
       const err = await resp.text();
       lastTtsErrorText = err;
       console.error(`Eleven Labs TTS error (attempt ${attempt}):`, status, err);
       // Retry on transient/voice-not-ready errors
       if (status >= 500 || /not found|not ready|processing|timeout/i.test(err)) {
         await new Promise((r) => setTimeout(r, attempt * 1000 + 500));
         continue;
       }
       // Non-retryable error
       ttsResponse = resp;
       break;
     }

     if (!ttsResponse || !ttsResponse.ok) {
       // Fallback to OpenAI TTS for pre-made voices if configured
       if (usePreMadeVoice) {
         const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
         if (OPENAI_API_KEY) {
           console.log("Falling back to OpenAI TTS (premade voices)");
           const oaResp = await fetch("https://api.openai.com/v1/audio/speech", {
             method: "POST",
             headers: {
               Authorization: `Bearer ${OPENAI_API_KEY}`,
               "Content-Type": "application/json",
             },
             body: JSON.stringify({
               model: "tts-1",
               input: text,
               voice: "alloy",
               response_format: "mp3",
             }),
           });

           if (!oaResp.ok) {
             const oaErr = await oaResp.text();
             console.error("OpenAI TTS error:", oaErr);
             return new Response(
               JSON.stringify({
                 error:
                   "Voice generation blocked on Eleven Labs and OpenAI fallback failed. Please try again later or configure a valid key.",
               }),
               { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
             );
           }

           const oaBuf = await oaResp.arrayBuffer();
           const oaBytes = new Uint8Array(oaBuf);
           let oaBinary = "";
           for (let i = 0; i < oaBytes.length; i++) oaBinary += String.fromCharCode(oaBytes[i]);
           const oaBase64 = btoa(oaBinary);

           return new Response(
             JSON.stringify({ audioUrl: `data:audio/mp3;base64,${oaBase64}`, success: true }),
             { headers: { ...corsHeaders, "Content-Type": "application/json" } }
           );
         }

         // No OpenAI key available
         return new Response(
           JSON.stringify({
             error:
               "Eleven Labs blocked free-tier usage. Add your OpenAI API key for fallback or upgrade your Eleven Labs plan.",
           }),
           { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }

       // For clone mode, surface the Eleven Labs error
       throw new Error(`Failed to generate speech: ${lastTtsErrorText || "Unknown TTS error"}`);
     }

     const audioArrayBuffer = await ttsResponse.arrayBuffer();
    
    // Convert to base64 using smaller chunks to avoid stack overflow
    const uint8Array = new Uint8Array(audioArrayBuffer);
    let binaryString = '';
    
    // Process byte by byte to avoid any stack issues
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
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
