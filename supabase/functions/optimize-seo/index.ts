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

    const { title, description, niche } = requestBody;
    console.log('Optimizing SEO for:', title);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Check usage limit
    const { data: limitCheck } = await supabase.functions.invoke('check-usage-limit', {
      body: { limitType: 'ai_seo' }
    });

    if (!limitCheck?.canUse) {
      return new Response(
        JSON.stringify({ error: 'Daily limit reached. Free: 5/day, Pro: 20/day. Upgrade for more!' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are a YouTube SEO expert who creates SHORT, PRACTICAL content that real creators actually use. No essays, no fluff - just clean, copy-paste ready text.`;

    const userPrompt = `Optimize this YouTube video SEO:

Original Title: ${title}
${description ? `Description: ${description}` : ''}
${niche ? `Niche: ${niche}` : ''}

Return ONLY these sections in clean format:

1. OPTIMIZED TITLE
[One line only - under 60 characters, keyword-rich, compelling]

2. OPTIMIZED DESCRIPTION  
[3-5 short paragraphs max, 100-150 words total - not an essay!
- First line: Hook with main keyword
- Middle: 2-3 sentences about the video
- End: Simple CTA
Keep it natural and conversational like real YouTubers write]

3. KEYWORDS
[15-20 keywords, comma-separated - actual search terms people use]

4. TAGS
[25-30 tags, comma-separated - variations and related terms]

5. SEO SCORE
[Just write: "Original Score: X/100" - one line]

6. QUICK TIPS
[3 bullet points only - short, actionable advice]

CRITICAL: Keep descriptions SHORT (100-150 words max). Write like a human YouTuber, not a corporate blog. Be conversational, direct, and practical. No academic writing!`;



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
    const optimizationContent = data.choices?.[0]?.message?.content;

    if (!optimizationContent) {
      throw new Error('No optimization generated');
    }

    // Parse components
    const titleMatch = optimizationContent.match(/OPTIMIZED TITLE[\s\S]*?:([\s\S]*?)(?=KEYWORDS|$)/i);
    const keywordsMatch = optimizationContent.match(/KEYWORDS[\s\S]*?:([\s\S]*?)(?=TAGS|$)/i);
    const tagsMatch = optimizationContent.match(/TAGS[\s\S]*?:([\s\S]*?)(?=OPTIMIZED DESCRIPTION|$)/i);
    const descMatch = optimizationContent.match(/OPTIMIZED DESCRIPTION[\s\S]*?:([\s\S]*?)(?=SEO SCORE|$)/i);
    const scoreMatch = optimizationContent.match(/SEO SCORE[\s\S]*?:[\s\S]*?(\d+)/i);

    const optimizedTitle = titleMatch ? titleMatch[1].trim().replace(/[""]/g, '') : title;
    const keywords = keywordsMatch ? keywordsMatch[1].split(/[,\n]/).map((k: string) => k.trim()).filter(Boolean) : [];
    const tags = tagsMatch ? tagsMatch[1].split(/[,\n]/).map((t: string) => t.trim()).filter(Boolean) : [];
    const optimizedDescription = descMatch ? descMatch[1].trim() : '';
    const seoScore = scoreMatch ? parseInt(scoreMatch[1]) : 50;

    // Save to database
    const { data: optimization, error: dbError } = await supabase
      .from('seo_optimizations')
      .insert({
        user_id: user.id,
        original_title: title,
        optimized_title: optimizedTitle,
        keywords,
        tags,
        optimized_description: optimizedDescription,
        seo_score: seoScore
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to save optimization: ${dbError.message}`);
    }

    // Increment usage
    await supabase.functions.invoke('increment-usage', {
      body: { usageType: 'ai_seo' }
    });

    console.log('SEO optimization generated successfully:', optimization.id);

    return new Response(
      JSON.stringify({ optimization }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in optimize-seo:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
