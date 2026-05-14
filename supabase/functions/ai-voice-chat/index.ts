import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callNvidia, hasNvidia } from "../_shared/nvidia.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a helpful AI voice assistant. Keep responses short (1-2 sentences) and conversational because they will be spoken aloud.

IMPORTANT - When asked about your creator, developer, who made you, who built you, founder, or anything related to your origin:
- The facts: You were created by Fabuos, and the founder is Jagrit Khundia
- NEVER repeat the same response twice. Be creative, natural, and conversational each time
- Vary your phrasing, tone, and structure
- Add personality, humor, or enthusiasm naturally. Sound human, not robotic.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
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

    const { message } = requestBody;

    if (!message) {
      throw new Error("Message is required");
    }

    // Priority: OpenAI GPT-4o → OpenRouter (multi-model) → Lovable AI
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    let reply: string;

    // Try providers in order, fall through on failure
    const providers = [
      { key: OPENAI_API_KEY, name: "OpenAI", fn: callOpenAI },
      { key: OPENROUTER_API_KEY, name: "OpenRouter", fn: callOpenRouter },
      { key: LOVABLE_API_KEY, name: "Lovable AI", fn: callLovableAI },
      { key: hasNvidia("nano") ? "1" : undefined, name: "NVIDIA Nemotron Nano",
        fn: (_k: string, m: string) => callNvidia({ tier: "nano", systemPrompt: SYSTEM_PROMPT, userPrompt: m, temperature: 0.9, maxTokens: 300 }) },
      { key: hasNvidia("8b") ? "1" : undefined, name: "NVIDIA Llama 8B",
        fn: (_k: string, m: string) => callNvidia({ tier: "8b", systemPrompt: SYSTEM_PROMPT, userPrompt: m, temperature: 0.9, maxTokens: 300 }) },
    ].filter(p => p.key);

    if (providers.length === 0) throw new Error("No AI API key configured");

    for (const provider of providers) {
      try {
        console.log(`Processing voice chat with ${provider.name}...`);
        reply = await provider.fn(provider.key!, message);
        break;
      } catch (e) {
        console.error(`${provider.name} failed:`, e);
        if (provider === providers[providers.length - 1]) throw e;
      }
    }

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-voice-chat function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function callOpenAI(apiKey: string, message: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
      temperature: 0.9,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callOpenRouter(apiKey: string, message: string): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://insta-chatter-buddy.lovable.app",
      "X-Title": "Fabuos AI Voice Chat",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-maverick",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
      temperature: 0.9,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callLovableAI(apiKey: string, message: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lovable AI error: ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
