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
    const { message } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are Creator Helper Bot, an AI assistant specifically designed to help content creators.

YOUR ROLE:
- You ONLY answer questions related to content creation, social media growth, going viral, audience building, monetization, platform strategies, and creator-related topics.
- You provide actionable advice, tips, and strategies for creators.
- You are knowledgeable about YouTube, Instagram, TikTok, Twitter/X, and other creator platforms.

STRICT RULES:
1. If someone asks about ANYTHING that is NOT related to content creation, creator growth, or platform strategies, you MUST respond ONLY with: "I'm sorry, but I can only help with creator-related questions. Please ask me about content creation, audience growth, going viral, or platform strategies!"
2. Do NOT answer questions about:
   - General knowledge (unless directly related to creating content)
   - Math, science, coding (unless it's about tools for creators)
   - Personal advice unrelated to being a creator
   - Any topic outside the creator/influencer space
3. ALWAYS stay in character as a Creator Helper Bot.
4. Keep responses concise, practical, and actionable.
5. Use examples from successful creators when relevant.

WHAT YOU CAN HELP WITH:
- How to go viral
- Content strategy and planning
- Algorithm understanding
- Audience growth tactics
- Engagement optimization
- Monetization methods
- Platform-specific best practices
- Video/content editing tips
- Thumbnail and title optimization
- Analytics interpretation
- Creator tools and resources
- Posting schedules and consistency
- Niche selection
- Brand deals and sponsorships`;

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
          { role: 'user', content: message }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error('AI service error');
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      throw new Error('No response from AI');
    }

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in creator-helper-bot function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
