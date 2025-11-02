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

    const { niche, platform } = requestBody;
    console.log('Analyzing trends for niche:', niche);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Check usage limit
    const { data: limitCheck } = await supabase.functions.invoke('check-usage-limit', {
      body: { limitType: 'ai_trends' }
    });

    if (!limitCheck?.canUse) {
      return new Response(
        JSON.stringify({ error: 'Daily limit reached. Free: 5/day, Pro: 20/day. Upgrade for more!' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are a YouTube trends analyst with deep knowledge of content trends, viral patterns, and audience behavior. Provide actionable, data-driven insights.`;

    const userPrompt = `Analyze current YouTube trends for the "${niche}" niche${platform ? ` on ${platform}` : ''}. 

Provide a comprehensive analysis with:
1. TOP TRENDING TOPICS (5-7 hot topics currently gaining traction)
2. CONTENT FORMATS (What types of videos are performing best)
3. VIRAL PATTERNS (Common elements in viral videos)
4. AUDIENCE INSIGHTS (What viewers want to see)
5. CONTENT IDEAS (10 specific video ideas based on trends)
6. OPTIMAL POSTING TIMES (Best times to post for maximum reach)
7. KEYWORD OPPORTUNITIES (High-potential keywords to target)

Make it actionable and specific to help creators capture trending opportunities.`;

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
    const analysisContent = data.choices?.[0]?.message?.content;

    if (!analysisContent) {
      throw new Error('No analysis generated');
    }

    // Parse trends and suggestions
    const trendsMatch = analysisContent.match(/TOP TRENDING TOPICS[\s\S]*?(?=CONTENT FORMATS|$)/i);
    const suggestionsMatch = analysisContent.match(/CONTENT IDEAS[\s\S]*?(?=OPTIMAL POSTING|$)/i);

    const trends = trendsMatch ? trendsMatch[0].split('\n').filter((l: string) => l.trim()) : [];
    const suggestions = suggestionsMatch ? suggestionsMatch[0].split('\n').filter((l: string) => l.trim()) : [];

    // Save to database
    const { data: analysis, error: dbError } = await supabase
      .from('trend_analyses')
      .insert({
        user_id: user.id,
        niche,
        analysis_content: analysisContent,
        trends,
        suggestions
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to save analysis: ${dbError.message}`);
    }

    // Increment usage
    await supabase.functions.invoke('increment-usage', {
      body: { usageType: 'ai_trends' }
    });

    console.log('Trend analysis generated successfully:', analysis.id);

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-trends:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
