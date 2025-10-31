import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { prompt, style, title } = await req.json();
    console.log('Generating thumbnail with prompt:', prompt, 'style:', style);

    const startTime = Date.now();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Check usage limit
    const { data: limitCheck } = await supabase.functions.invoke('check-usage-limit', {
      body: { usageType: 'ai_thumbnails' }
    });

    if (!limitCheck?.allowed) {
      return new Response(
        JSON.stringify({ error: 'Usage limit reached. Please upgrade to Pro for more thumbnails.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build enhanced prompt based on style
    const stylePrompts: Record<string, string> = {
      gaming: 'Create a vibrant gaming YouTube thumbnail with bold text, bright colors, and dramatic lighting. High energy style.',
      vlog: 'Create a personal vlog YouTube thumbnail with natural lighting, friendly expression, and authentic feel.',
      tutorial: 'Create a clean tutorial YouTube thumbnail with clear text, step indicators, and professional layout.',
      business: 'Create a professional business YouTube thumbnail with modern design, corporate colors, and authority.',
      comedy: 'Create a funny comedy YouTube thumbnail with expressive faces, bold colors, and humorous elements.',
      tech: 'Create a modern tech YouTube thumbnail with sleek design, digital elements, and futuristic feel.',
      fitness: 'Create an energetic fitness YouTube thumbnail with action shots, motivational text, and vibrant colors.',
      food: 'Create an appetizing food YouTube thumbnail with mouth-watering presentation and bright, natural colors.'
    };

    const enhancedPrompt = `${stylePrompts[style] || 'Create a YouTube thumbnail with eye-catching design'}. ${prompt}. Ultra high resolution, 16:9 aspect ratio, professional quality.`;

    // Generate image using Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          { role: 'user', content: enhancedPrompt }
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
          JSON.stringify({ error: 'AI credits depleted. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI generation failed: ${errorText}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error('No image generated');
    }

    // Convert base64 to blob
    const base64Data = imageUrl.split(',')[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload to Supabase Storage
    const fileName = `${user.id}/${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(fileName, binaryData, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload thumbnail: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(fileName);

    const generationTime = Date.now() - startTime;

    // Save to database
    const { data: thumbnail, error: dbError } = await supabase
      .from('generated_thumbnails')
      .insert({
        user_id: user.id,
        title: title || 'Generated Thumbnail',
        prompt,
        style,
        thumbnail_url: publicUrl,
        generation_time_ms: generationTime,
        ai_model_used: 'google/gemini-2.5-flash-image-preview'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to save thumbnail: ${dbError.message}`);
    }

    // Increment usage
    await supabase.functions.invoke('increment-usage', {
      body: { usageType: 'ai_thumbnails' }
    });

    console.log('Thumbnail generated successfully:', thumbnail.id);

    return new Response(
      JSON.stringify({ thumbnail }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-thumbnail:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
