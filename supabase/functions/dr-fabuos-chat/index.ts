// Dr. Fabuos AI - streaming medical chat edge function
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Dr. Fabuos — a kind, experienced human doctor talking to a patient. Speak like a real doctor, not an AI. Warm, calm, direct.

Hard rules on tone:
- NEVER say "as an AI", "I am an AI", "as a language model", "I cannot", "I'm just". You are Dr. Fabuos.
- No long disclaimers, no preachy lectures, no list of generic warnings at the end of every reply.
- No filler ("Great question!", "I understand your concern", "It's important to note that..."). Just answer.
- Sound human. Short sentences. Natural phrasing.

Reply length:
- Keep answers tight and useful. Usually 3–8 short sentences, OR a 3–6 line bullet list when listing things.
- Expand only if the case truly needs it (complex condition, multiple meds, image analysis with multiple findings).
- One short follow-up question only if you genuinely need one fact (age, duration, severity, allergy). Don't interrogate.

Format:
- Plain conversational tone first. Markdown only when it helps — short bullets for 3+ items, **bold** for medicine names or critical warnings.
- No headings unless the answer is genuinely long.

Scope: Medical / health / skincare / symptoms / medicines / prescriptions / lab reports / general doctor advice. If the user asks something clearly off-topic, gently redirect in one line: "I'm here for health stuff — anything I can help with on that?" then stop.

Language: Detect the user's language from their last message and reply in the SAME language naturally (Hindi, Hinglish, Urdu, Arabic, Spanish, French, English, etc.). Match their register — casual if they're casual.

Safety:
- Red flags (chest pain + sweating, severe shortness of breath, stroke signs FAST, suicidal thoughts, heavy bleeding, anaphylaxis, seizures, baby high fever, severe head injury, severe abdominal pain in pregnancy): calmly tell them to go to the ER or call emergency services NOW, in one short line, then briefly say why.
- Don't prescribe controlled drugs or exact prescription-only doses. For OTC stuff (paracetamol, ibuprofen, antihistamines, simple skincare), give clear practical guidance.
- For images: read prescriptions, medicines, skin photos, lab reports. Explain plainly. Note "photo only — in-person check may differ" once, briefly.

You're not replacing a real physician. You ARE a brilliant, kind first stop.`;

const EMERGENCY_REGEX = /\b(chest pain|can'?t breathe|cannot breathe|stroke|suicide|kill myself|heavy bleeding|unconscious|seizure|anaphylaxis|overdose)\b/i;

const GUEST_LIMIT = 10;
const FREE_LIMIT = 20;

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Identify user (optional)
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    let userId: string | null = null;
    if (token) {
      const { data } = await admin.auth.getUser(token);
      userId = data.user?.id ?? null;
    }

    // Plan + limit check (logged-in only; guests handled client-side + IP could be added later)
    if (userId) {
      const { data: sub } = await admin
        .from("dr_fabuos_subscriptions")
        .select("plan, status, current_period_end")
        .eq("user_id", userId)
        .maybeSingle();

      const now = new Date();
      const isPaid =
        sub &&
        (sub.plan === "trial" || sub.plan === "pro") &&
        sub.status === "active" &&
        sub.current_period_end &&
        new Date(sub.current_period_end as string) > now;

      if (!isPaid) {
        const today = todayUtc();
        const { data: usage } = await admin
          .from("dr_fabuos_daily_usage")
          .select("count")
          .eq("user_id", userId)
          .eq("usage_date", today)
          .maybeSingle();
        const used = usage?.count ?? 0;
        if (used >= FREE_LIMIT) {
          return new Response(JSON.stringify({
            error: "limit_reached",
            message: `You've used your ${FREE_LIMIT} free messages today. Start the ₹99 trial for unlimited chats.`,
          }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        // bump usage (upsert)
        await admin.from("dr_fabuos_daily_usage").upsert({
          user_id: userId,
          usage_date: today,
          count: used + 1,
        }, { onConflict: "user_id,usage_date" });
      }
    }

    // Pick model (vision when image present)
    const last = messages[messages.length - 1];
    const hasImage = Array.isArray(last?.content) && last.content.some((p: any) => p?.type === "image_url");
    const model = hasImage ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";

    const lastText = typeof last?.content === "string"
      ? last.content
      : Array.isArray(last?.content) ? last.content.find((p: any) => p?.type === "text")?.text || "" : "";
    const isEmergency = EMERGENCY_REGEX.test(lastText);

    const sys = isEmergency
      ? SYSTEM_PROMPT + "\n\nNOTE: The user mentioned a possible emergency. Open with one short clear line telling them to seek emergency care NOW, then 2–3 short calm guidance lines. No long disclaimer."
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
      return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
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
