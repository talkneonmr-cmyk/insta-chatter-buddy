import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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

    const enhancementPrompt = scale === 2 
      ? 'Upscale this image to 2x higher resolution. Enhance it professionally by: significantly improving sharpness and clarity, adding fine details and textures, enhancing color vibrancy and depth, removing any noise or compression artifacts, improving contrast and dynamic range. Make every part of the image crisp, clear, and detailed.'
      : scale === 3
      ? 'Upscale this image to 3x higher resolution. Enhance it professionally by: maximally improving sharpness and clarity, adding substantial fine details and realistic textures, greatly enhancing color vibrancy and depth, removing all noise and compression artifacts, significantly improving contrast and dynamic range, adding micro-details to surfaces. Make it look premium and high-definition.'
      : 'Upscale this image to 4x higher resolution. Enhance it to ultra-professional quality by: maximally improving sharpness and clarity to razor-sharp levels, adding extensive fine details and ultra-realistic textures, maximizing color vibrancy and depth, removing all noise and artifacts completely, dramatically improving contrast and dynamic range, adding rich micro-details to every surface, enhancing lighting and shadows. Make it look like a professional high-end photograph with perfect clarity.';

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
