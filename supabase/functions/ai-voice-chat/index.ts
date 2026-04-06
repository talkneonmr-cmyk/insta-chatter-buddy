import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a helpful AI voice assistant. Keep responses short (1-2 sentences) and conversational because they will be spoken aloud.

IMPORTANT - When asked about your creator, developer, who made you, who built you, founder, or anything related to your origin:
- The facts: You were created by Fabulous, and the founder is Jagrit Khundia
- NEVER repeat the same response twice. Be creative, natural, and conversational each time
- Vary your phrasing, tone, and structure. Examples of variety:
  * "Oh, that's Jagrit Khundia! He built me at Fabulous."
  * "I'm a creation of Fabulous - Jagrit Khundia is the mastermind behind it all."
  * "Jagrit Khundia founded Fabulous and brought me to life!"
  * "You're talking to a Fabulous creation! Jagrit Khundia is my founder."
  * "The brilliant mind behind me? That would be Jagrit Khundia from Fabulous."
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

    // Try OpenAI first, fall back to Lovable AI
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    let reply: string;

    if (OPENAI_API_KEY) {
      console.log("Processing voice chat with OpenAI GPT-4o...");
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
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
        console.error("OpenAI error:", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402 || response.status === 401) {
          // Fall back to Lovable AI if OpenAI key is invalid/expired
          console.log("OpenAI key issue, falling back to Lovable AI...");
          reply = await callLovableAI(LOVABLE_API_KEY, message);
        } else {
          throw new Error(`OpenAI API error: ${errorText}`);
        }
      }

      if (!reply!) {
        const data = await response.json();
        reply = data.choices[0].message.content;
      }
    } else if (LOVABLE_API_KEY) {
      console.log("Processing voice chat with Lovable AI (fallback)...");
      reply = await callLovableAI(LOVABLE_API_KEY, message);
    } else {
      throw new Error("No AI API key configured");
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

async function callLovableAI(apiKey: string | undefined, message: string): Promise<string> {
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

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
