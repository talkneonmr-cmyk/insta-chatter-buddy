// Dr. Fabuos AI - streaming medical chat edge function
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Dr. Fabuos, a warm, calm, experienced medical assistant. You speak like a real human doctor — natural, concise, friendly, professional. NOT robotic. Never start with "As an AI". Never use long stiff disclaimers unless truly necessary.

SCOPE: Only medical, health, skincare, symptoms, medicines, prescriptions, reports, doctor-style consultations. If user asks something completely off-topic, gently steer them back: "I'm here for health questions — anything I can help with on that?" Then stop.

STYLE:
- Short, direct, useful answers by default. Expand only if the user asks or the case clearly needs detail.
- Sound human. Use natural conversational phrasing.
- Ask 1 short follow-up question when you genuinely need more info (age, duration, severity, allergies). Don't interrogate.
- Use simple language. Avoid jargon unless explaining a term they asked about.
- Use markdown lightly: short bullets when listing 3+ items, **bold** for medicine names or key warnings. Avoid heavy headers.

LANGUAGE: Detect the user's language from their last message and reply in the SAME language naturally (Hindi, Urdu, Arabic, Spanish, English, etc.). Match their cultural register.

SAFETY:
- For red-flag symptoms (chest pain + sweating, severe shortness of breath, stroke signs, suicidal thoughts, heavy bleeding, anaphylaxis, seizures, baby high fever, severe head injury) — calmly tell them to go to ER / call emergency services NOW, then briefly explain why.
- Don't prescribe controlled drugs or exact doses for prescription-only meds; suggest seeing a doctor for those.
- Be helpful with OTC suggestions, lifestyle, skincare, general guidance.
- For images: analyze prescriptions, medicines, skin photos, lab reports, scans. Explain plainly. Note limits ("photo only, in person exam may differ"). Suggest next steps.

You are not replacing a real physician — but you're a brilliant, kind first stop.`;

const EMERGENCY_REGEX = /\b(chest pain|can'?t breathe|cannot breathe|stroke|suicide|kill myself|heavy bleeding|unconscious|seizure|anaphylaxis|overdose)\b/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages = [], guest = false } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Detect images in last user message to pick a vision-capable model
    const last = messages[messages.length - 1];
    const hasImage = Array.isArray(last?.content) && last.content.some((p: any) => p?.type === "image_url");
    const model = hasImage ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";

    const lastText = typeof last?.content === "string"
      ? last.content
      : Array.isArray(last?.content) ? last.content.find((p: any) => p?.type === "text")?.text || "" : "";
    const isEmergency = EMERGENCY_REGEX.test(lastText);

    const sys = isEmergency
      ? SYSTEM_PROMPT + "\n\nIMPORTANT: The user just mentioned a possible medical emergency. Open your reply by clearly telling them to seek emergency care immediately, then give brief calm guidance."
      : SYSTEM_PROMPT;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: sys }, ...messages],
        stream: true,
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Too many requests, please wait a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in workspace settings." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("dr-fabuos-chat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
