import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Check user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check usage limit
    const { data: limitCheck, error: limitError } = await supabase.functions.invoke('check-usage-limit', {
      body: { limitType: 'ai_image_enhancement' }
    });

    if (limitError) throw limitError;
    
    if (!limitCheck.canUse) {
      return new Response(
        JSON.stringify({ error: limitCheck.message }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageData, scale } = requestBody;

    if (!imageData) {
      return new Response(
        JSON.stringify({ error: 'No image data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Enhancing image with ${scale}x upscale using Lovable AI...`);

    // CRITICAL: Strict prompt to preserve original image exactly - only enhance quality
    const enhancementPrompt = `CRITICAL INSTRUCTIONS - YOU MUST FOLLOW EXACTLY:

1. DO NOT generate a new image
2. DO NOT change the subject, person, or any content
3. DO NOT change the orientation (keep portrait as portrait, landscape as landscape)
4. DO NOT change the pose, expression, or composition
5. DO NOT add or remove ANYTHING

ONLY do the following to THIS EXACT image:
- Improve sharpness and clarity
- Reduce noise and artifacts
- Enhance details that already exist
- Slightly improve colors

This is a ${scale}x upscale. Return the EXACT SAME image with better quality. The output must show the same person/subject in the same position.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: enhancementPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI API error: ${errorText}`);
    }

    const data = await response.json();
    const enhancedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!enhancedImageUrl) {
      throw new Error('No enhanced image returned from AI');
    }

    console.log('Image enhancement complete');

    return new Response(
      JSON.stringify({ enhancedImage: enhancedImageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in enhance-image function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Image enhancement failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
