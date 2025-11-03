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
    const REMOVE_BG_API_KEY = Deno.env.get("REMOVE_BG_API_KEY");
    if (!REMOVE_BG_API_KEY) throw new Error("REMOVE_BG_API_KEY not configured");

    // Expect JSON: { imageDataUrl: string }
    const { imageDataUrl } = await req.json();
    if (!imageDataUrl || typeof imageDataUrl !== "string") {
      return new Response(
        JSON.stringify({ error: "imageDataUrl is required (data URL string)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract and decode base64 + mime type
    const commaIndex = imageDataUrl.indexOf(",");
    const header = commaIndex !== -1 ? imageDataUrl.slice(0, commaIndex) : "";
    const base64Raw = commaIndex !== -1 ? imageDataUrl.slice(commaIndex + 1) : imageDataUrl;
    const mimeMatch = header.match(/data:(.*?);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/png";

    // Decode base64 safely
    const cleaned = base64Raw.replace(/\s/g, "");
    const decodedBinary = atob(cleaned);
    const decodedBytes = new Uint8Array(decodedBinary.length);
    for (let i = 0; i < decodedBinary.length; i++) {
      decodedBytes[i] = decodedBinary.charCodeAt(i);
    }

    // Build multipart form with a real file blob (more reliable for remove.bg)
    const fd = new FormData();
    const ext = mimeType.split("/")[1] || "png";
    const file = new Blob([decodedBytes], { type: mimeType });
    fd.append("image_file", file, `upload.${ext}`);
    fd.append("size", "auto");

    const resp = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": REMOVE_BG_API_KEY },
      body: fd,
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("remove.bg error", resp.status, errText);
      return new Response(
        JSON.stringify({ error: "Background removal failed", details: errText }),
        { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // remove.bg returns an image (PNG by default)
    const blob = await resp.blob();
    const ab = await blob.arrayBuffer();
    const bytes = new Uint8Array(ab);
    let binary = "";
    const CHUNK_SIZE = 0x8000; // 32KB chunks to avoid stack overflow
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
    }
    const b64 = btoa(binary);

    return new Response(
      JSON.stringify({ image: `data:image/png;base64,${b64}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("remove-background function error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
