const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const keys: Record<string, string | undefined> = {
    AGENTROUTER_API_KEY: Deno.env.get("AGENTROUTER_API_KEY"),
    OPENAI_API_KEY: Deno.env.get("OPENAI_API_KEY"),
  };

  const bases = ["https://co.agentrouter.org/v1", "https://api.agentrouter.org/v1"];
  const results: any[] = [];

  for (const [name, key] of Object.entries(keys)) {
    if (!key) { results.push({ key: name, missing: true }); continue; }
    results.push({ key: name, length: key.length, prefix: key.slice(0, 6), suffix: key.slice(-4) });
    for (const base of bases) {
      try {
        const r = await fetch(`${base}/chat/completions`, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: "Say OK" }], max_tokens: 5 }),
        });
        const t = await r.text();
        results.push({ key: name, base, status: r.status, body: t.slice(0, 300) });
      } catch (e) {
        results.push({ key: name, base, error: String(e) });
      }
    }
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
