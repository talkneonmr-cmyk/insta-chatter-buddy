import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HfInference } from "https://esm.sh/@huggingface/inference@2.3.2";

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

    const HF_TOKEN = Deno.env.get("HUGGING_FACE_ACCESS_TOKEN");
    if (!HF_TOKEN) {
      throw new Error("HUGGING_FACE_ACCESS_TOKEN is not configured");
    }

    // NOTE: We currently do not use the uploaded audioUrl because this is plain TTS.
    // For true voice cloning, we will switch models and include the reference audio later.
    console.log("Generating TTS for text:", text);

    const hf = new HfInference(HF_TOKEN);
    let arrayBuffer: ArrayBuffer;

    try {
      const res = await hf.textToSpeech(
        { 
          model: "espnet/kan-bayashi_ljspeech_vits", 
          inputs: text 
        },
        { wait_for_model: true }
      );
      arrayBuffer = await res.arrayBuffer();
    } catch (e) {
      console.error("HF library error:", e);
      // If the helper threw a generic blob error, try a manual call to surface the real message
      const resp = await fetch("https://api-inference.huggingface.co/models/espnet/kan-bayashi_ljspeech_vits", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          inputs: text, 
          options: { wait_for_model: true } 
        }),
      });
      
      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(`Hugging Face error ${resp.status}: ${body}`);
      }
      
      arrayBuffer = await resp.arrayBuffer();
    }

    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    return new Response(
      JSON.stringify({
        audioUrl: `data:audio/wav;base64,${base64}`,
        success: true
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in clone-voice function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
