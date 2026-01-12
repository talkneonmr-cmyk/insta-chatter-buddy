import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_URL = "https://ab-faceswap.vercel.app/swap";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Authenticate user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check usage limit
    const { data: limitCheck, error: limitError } = await supabase.functions.invoke('check-usage-limit', {
      body: { limitType: 'ai_face_swap' }
    });

    if (limitError) {
      console.error('Usage limit check error:', limitError);
      return new Response(
        JSON.stringify({ error: 'Failed to check usage limit' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!limitCheck.canUse) {
      return new Response(
        JSON.stringify({ error: limitCheck.message, limitReached: true }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { sourceImage, targetImage } = await req.json();

    if (!sourceImage || !targetImage) {
      return new Response(
        JSON.stringify({ error: 'Both source and target images are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert base64 data URLs to Blobs
    const base64ToBlob = (dataUrl: string): Blob => {
      const parts = dataUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const base64Data = parts[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new Blob([bytes], { type: mime });
    };

    const sourceBlob = base64ToBlob(sourceImage);
    const targetBlob = base64ToBlob(targetImage);

    // Create FormData
    const form = new FormData();
    form.append("source", sourceBlob, "source.jpg");
    form.append("target", targetBlob, "target.jpg");

    console.log('Sending request to face swap API...');

    // Call the face swap API
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Android)",
        "origin": "https://ab-faceswap.vercel.app",
        "referer": "https://ab-faceswap.vercel.app/"
      },
      body: form
    });

    if (!response.ok) {
      console.error('Face swap API error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: 'Face swap API failed. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the result image
    const resultBuffer = await response.arrayBuffer();
    const resultBase64 = btoa(
      new Uint8Array(resultBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    console.log('Face swap completed successfully');

    return new Response(
      JSON.stringify({ 
        image: `data:image/jpeg;base64,${resultBase64}`,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Face swap error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
