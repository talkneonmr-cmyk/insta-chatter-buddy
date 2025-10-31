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

    const { content, contentType, targetFormat } = await req.json();
    console.log('Repurposing content:', contentType, '->', targetFormat);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Check usage limit
    const { data: limitCheck } = await supabase.functions.invoke('check-usage-limit', {
      body: { limitType: 'ai_repurpose' }
    });

    if (!limitCheck?.canUse) {
      return new Response(
        JSON.stringify({ error: 'Daily limit reached. Free: 5/day, Pro: 20/day. Upgrade for more!' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formatPrompts: Record<string, string> = {
      'youtube-shorts': 'Convert this into a 60-second YouTube Shorts script with a strong hook, key points, and clear CTA. Include timing markers.',
      'instagram-reels': 'Transform this into an engaging Instagram Reel (30-60 seconds) with trending audio suggestions, visual cues, and hooks.',
      'tiktok': 'Adapt this for TikTok: catchy hook in first 3 seconds, trending hashtags, and viral potential. Include on-screen text suggestions.',
      'twitter-thread': 'Break this down into a compelling Twitter/X thread (8-12 tweets). Start with an attention-grabbing first tweet.',
      'linkedin-post': 'Convert this into a professional LinkedIn post with insights, professional tone, and engagement-driving questions.',
      'blog-outline': 'Create a detailed blog post outline with SEO-optimized headings, subheadings, and key points to cover.',
      'podcast-script': 'Transform this into a podcast script with intro, talking points, storytelling elements, and outro.',
      'email-newsletter': 'Convert this into an engaging email newsletter with subject line, preview text, and clear sections.'
    };

    const systemPrompt = `You are a content repurposing expert who maximizes content value by adapting it for different platforms while maintaining core message and engagement.`;

    const userPrompt = `Repurpose this ${contentType} content for ${targetFormat}:

ORIGINAL CONTENT:
${content}

${formatPrompts[targetFormat] || 'Adapt this content for the target format while maintaining key messages and engagement.'}

Provide:
1. REPURPOSED CONTENT (fully adapted for the target format)
2. PLATFORM-SPECIFIC TIPS (optimization advice for this format)
3. ADDITIONAL IDEAS (3-5 related content ideas to maximize this topic)
4. HASHTAGS/KEYWORDS (relevant to the new format)

Make it native to the platform and optimized for maximum engagement.`;

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
    const repurposedContent = data.choices?.[0]?.message?.content;

    if (!repurposedContent) {
      throw new Error('No repurposed content generated');
    }

    // Parse suggestions
    const ideasMatch = repurposedContent.match(/ADDITIONAL IDEAS[\s\S]*?:([\s\S]*?)(?=HASHTAGS|$)/i);
    const suggestions = ideasMatch ? ideasMatch[1].split('\n').filter((l: string) => l.trim()) : [];

    // Save to database
    const { data: repurposing, error: dbError } = await supabase
      .from('content_repurposing')
      .insert({
        user_id: user.id,
        original_content: content,
        content_type: `${contentType} -> ${targetFormat}`,
        repurposed_content: repurposedContent,
        suggestions
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to save repurposing: ${dbError.message}`);
    }

    // Increment usage
    await supabase.functions.invoke('increment-usage', {
      body: { usageType: 'ai_repurpose' }
    });

    console.log('Content repurposed successfully:', repurposing.id);

    return new Response(
      JSON.stringify({ repurposing }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in repurpose-content:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
