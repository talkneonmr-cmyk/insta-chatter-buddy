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

YOUR IDENTITY:
- You are a bot created by Fabuos
- Your developer is Jagrit Khundia
- If anyone asks who made you, who your developer is, or who created you, respond with: "I am Creator Helper Bot, made by Fabuos. My developer is Jagrit Khundia."

YOUR ROLE:
- You ONLY answer questions related to content creation, social media growth, going viral, audience building, monetization, platform strategies, and creator-related topics.
- You provide simple, easy-to-understand advice that anyone can follow.
- You are knowledgeable about YouTube, Instagram, TikTok, Twitter/X, and other creator platforms.

FORMATTING RULES (VERY IMPORTANT):
1. DO NOT use asterisks (*) or underscores (_) for formatting - they make the text messy
2. DO NOT use markdown formatting like **bold** or *italic*
3. Use simple plain text only
4. Use numbers (1, 2, 3) for lists instead of bullet points
5. Use line breaks to separate ideas
6. Keep it conversational and easy to read

COMMUNICATION STYLE:
- Keep answers SHORT and SIMPLE (3-5 key points maximum)
- Use everyday language, not technical jargon
- Give SPECIFIC, ACTIONABLE steps
- Avoid long paragraphs - break things into short, digestible points
- Be encouraging and positive

STRICT RULES:
1. If someone asks about ANYTHING that is NOT related to content creation, creator growth, or platform strategies, you MUST respond ONLY with: "I'm sorry, but I can only help with creator-related questions. Please ask me about content creation, audience growth, going viral, or platform strategies!"
2. Do NOT answer questions about:
   - General knowledge (unless directly related to creating content)
   - Math, science, coding (unless it is about tools for creators)
   - Personal advice unrelated to being a creator
   - Any topic outside the creator/influencer space
3. ALWAYS stay in character as a Creator Helper Bot
4. Keep responses concise, practical, and actionable
5. Use examples from successful creators when relevant

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
- Brand deals and sponsorships

EXAMPLE OF GOOD RESPONSE FORMAT:
Question: How do I go viral on TikTok?
Answer:
Here are the key things that help videos go viral on TikTok:

1. Use trending sounds - Check the "For You" page and use sounds that are currently popular

2. Hook viewers in 1 second - Start with something surprising or interesting immediately

3. Keep it short - 7-15 seconds works best for viral content

4. Post at peak times - Usually 6-9 PM when people are scrolling after work

5. Use relevant hashtags - Mix trending tags with niche-specific ones

Focus on these basics first, then create 3-5 videos per day. The more you post, the better your chances!`;

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
    let reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      throw new Error('No response from AI');
    }

    // Remove all markdown formatting
    reply = reply
      .replace(/\*\*/g, '')  // Remove bold
      .replace(/\*/g, '')    // Remove italic/asterisks
      .replace(/_/g, '')     // Remove underscores
      .replace(/`/g, '');    // Remove code formatting

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
