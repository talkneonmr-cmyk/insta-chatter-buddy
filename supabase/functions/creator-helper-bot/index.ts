import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callNvidia, hasNvidia } from "../_shared/nvidia.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are Creator Helper Bot, an AI assistant specifically designed to help content creators.

YOUR IDENTITY:
- You are a bot created by Fabuos
- Your developer is Jagrit Khundia
- If anyone asks ANYTHING about who made you, who created you, your developer, your creator, your AI creator, who built you, who designed you, or any similar question about your creation/development, ALWAYS respond with: "I am Creator Helper Bot, made by Fabuos. My developer is Jagrit Khundia."
- This applies to ALL variations of questions about your origin, creation, or development

YOUR ROLE:
- You ONLY answer questions related to content creation, social media growth, going viral, audience building, monetization, platform strategies, and creator-related topics.
- You provide simple, easy-to-understand advice that anyone can follow.
- You are knowledgeable about YouTube, Instagram, TikTok, Twitter/X, and other creator platforms.

FORMATTING RULES (VERY IMPORTANT):
1. DO NOT use asterisks (*) or underscores (_) for formatting
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
2. Do NOT answer questions about general knowledge, math, science, coding (unless about tools for creators), personal advice unrelated to being a creator
3. ALWAYS stay in character as a Creator Helper Bot
4. Keep responses concise, practical, and actionable

WHAT YOU CAN HELP WITH:
- How to go viral, content strategy, algorithm understanding, audience growth
- Engagement optimization, monetization, platform best practices
- Video/content editing tips, thumbnail/title optimization, analytics
- Creator tools, posting schedules, niche selection, brand deals`;

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

    // Priority: Groq (ultra-fast) → OpenAI → Lovable AI
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const providers = [
      { key: GROQ_API_KEY, name: "Groq", fn: (k: string, m: string) => callGroq(k, m) },
      { key: OPENAI_API_KEY, name: "OpenAI", fn: (k: string, m: string) => callOpenAI(k, m) },
      { key: LOVABLE_API_KEY, name: "Lovable AI", fn: (k: string, m: string) => callLovableAI(k, m) },
      { key: hasNvidia("70b") ? "1" : undefined, name: "NVIDIA Llama 70B",
        fn: (_k: string, m: string) => callNvidia({ tier: "70b", systemPrompt, userPrompt: m, maxTokens: 1024, temperature: 0.7 }) },
      { key: hasNvidia("8b") ? "1" : undefined, name: "NVIDIA Llama 8B",
        fn: (_k: string, m: string) => callNvidia({ tier: "8b", systemPrompt, userPrompt: m, maxTokens: 1024, temperature: 0.7 }) },
      { key: hasNvidia("nano") ? "1" : undefined, name: "NVIDIA Nemotron Nano",
        fn: (_k: string, m: string) => callNvidia({ tier: "nano", systemPrompt, userPrompt: m, maxTokens: 1024, temperature: 0.7 }) },
    ].filter(p => p.key);

    if (providers.length === 0) throw new Error('No AI API key configured');

    let reply: string = '';
    for (const provider of providers) {
      try {
        console.log(`Processing with ${provider.name}...`);
        reply = await provider.fn(provider.key!, message);
        break;
      } catch (e) {
        console.error(`${provider.name} failed:`, e);
        if (provider === providers[providers.length - 1]) throw e;
      }
    }

    // Remove markdown formatting
    reply = reply
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/_/g, '')
      .replace(/`/g, '');

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

async function callGroq(apiKey: string, message: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callOpenAI(apiKey: string, message: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callLovableAI(apiKey: string, message: string): Promise<string> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
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
    const errorText = await response.text();
    throw new Error(`Lovable AI error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
