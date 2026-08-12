const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY not set" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const base = body.base ?? "https://co.agentrouter.org/v1";
  const models: string[] = body.models ?? ["gpt-4o", "gpt-4o-mini", "claude-sonnet-4-5"];

  const results: any[] = [];

  // list models
  try {
    const r = await fetch(`${base}/models`, { headers: { Authorization: `Bearer ${key}` } });
    const t = await r.text();
    results.push({ step: "GET /models", status: r.status, ct: r.headers.get("content-type"), body: t.slice(0, 600) });
  } catch (e) {
    results.push({ step: "GET /models", error: String(e) });
  }

  for (const model of models) {
    try {
      const r = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: [{ role: "user", content: "Say OK" }], max_tokens: 10 }),
      });
      const t = await r.text();
      results.push({ step: `chat ${model}`, status: r.status, ct: r.headers.get("content-type"), body: t.slice(0, 400) });
    } catch (e) {
      results.push({ step: `chat ${model}`, error: String(e) });
    }
  }

  return new Response(JSON.stringify({ base, results }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
