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

    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { topic, niche, platform } = requestBody;
    console.log('Generating hashtags for:', topic);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Check usage limit
    const { data: limitCheck } = await supabase.functions.invoke('check-usage-limit', {
      body: { limitType: 'ai_hashtags' }
    });

    if (!limitCheck?.canUse) {
      return new Response(
        JSON.stringify({ error: 'Daily limit reached. Free: 5/day, Pro: 20/day. Upgrade for more!' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are a social media hashtag expert who understands trending tags, search optimization, and audience reach. Generate strategic hashtag mixes.`;

    const userPrompt = `Generate strategic hashtags for this content:

Topic: ${topic}
${niche ? `Niche: ${niche}` : ''}
${platform ? `Platform: ${platform}` : ''}

Provide a strategic mix of:
1. HIGH-VOLUME HASHTAGS (5 popular tags with 1M+ posts)
2. MEDIUM-VOLUME HASHTAGS (10 moderately popular tags with 100K-1M posts)
3. NICHE-SPECIFIC HASHTAGS (10 targeted tags with 10K-100K posts)
4. BRANDED/UNIQUE HASHTAGS (5 unique tags for building community)

Format: Return as a simple list, one hashtag per line, with # symbol.
Total: 30 hashtags optimized for maximum reach and engagement.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
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
    const hashtagsContent = data.choices?.[0]?.message?.content;

    if (!hashtagsContent) {
      throw new Error('No hashtags generated');
    }

    // Parse hashtags
    const hashtags = hashtagsContent
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.startsWith('#'))
      .map((tag: string) => tag.replace(/[^\w#]/g, ''));

    // Categorize hashtags
    const highVolume = hashtags.slice(0, 5);
    const mediumVolume = hashtags.slice(5, 15);
    const niche_tags = hashtags.slice(15, 25);
    const branded = hashtags.slice(25, 30);

    // Save to database
    const { data: generation, error: dbError } = await supabase
      .from('hashtag_generations')
      .insert({
        user_id: user.id,
        topic,
        hashtags: {
          all: hashtags,
          highVolume,
          mediumVolume,
          niche: niche_tags,
          branded
        },
        category: niche || 'general'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to save hashtags: ${dbError.message}`);
    }

    // Increment usage
    await supabase.functions.invoke('increment-usage', {
      body: { usageType: 'ai_hashtags' }
    });

    console.log('Hashtags generated successfully:', generation.id);

    return new Response(
      JSON.stringify({ generation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-hashtags:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
