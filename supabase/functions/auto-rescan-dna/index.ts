// Cron-invoked. Finds DNA profiles older than 2 days and rescans them.
// Uses service role; no per-user auth required.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const YT_CLIENT_ID = Deno.env.get("YOUTUBE_CLIENT_ID")!;
const YT_CLIENT_SECRET = Deno.env.get("YOUTUBE_CLIENT_SECRET")!;

function parseDuration(iso: string): number {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || "");
  if (!m) return 0;
  return (parseInt(m[1] || "0") * 3600) + (parseInt(m[2] || "0") * 60) + parseInt(m[3] || "0");
}

async function refreshIfNeeded(supabase: any, account: any): Promise<string> {
  const expiresAt = new Date(account.token_expires_at);
  if (expiresAt > new Date()) return account.access_token;
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: YT_CLIENT_ID,
      client_secret: YT_CLIENT_SECRET,
      refresh_token: account.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const d = await r.json();
  if (!d.access_token) throw new Error("Token refresh failed");
  await supabase.from("youtube_accounts").update({
    access_token: d.access_token,
    token_expires_at: new Date(Date.now() + d.expires_in * 1000).toISOString(),
  }).eq("id", account.id);
  return d.access_token;
}

async function callAI(messages: any[], retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        response_format: { type: "json_object" },
      }),
    });
    if (r.ok) return await r.json();
    if (r.status === 429 || r.status >= 500) {
      await new Promise((res) => setTimeout(res, 1500 * (i + 1)));
      continue;
    }
    throw new Error(`AI gateway ${r.status}`);
  }
  throw new Error("AI gateway failed");
}

async function rescanOne(supabase: any, profile: any) {
  const { data: account } = await supabase
    .from("youtube_accounts")
    .select("*")
    .eq("id", profile.youtube_account_id)
    .maybeSingle();
  if (!account) return { id: profile.id, skipped: "no_account" };

  const accessToken = await refreshIfNeeded(supabase, account);

  const chRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${account.channel_id}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const ch = (await chRes.json()).items?.[0];

  const sRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${account.channel_id}&order=date&maxResults=50&type=video`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const sData = await sRes.json();
  const ids = (sData.items || []).map((i: any) => i.id?.videoId).filter(Boolean).join(",");

  let videos: any[] = [];
  if (ids) {
    const vRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${ids}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const vData = await vRes.json();
    videos = (vData.items || []).map((v: any) => ({
      title: v.snippet.title,
      publishedAt: v.snippet.publishedAt,
      durationSec: parseDuration(v.contentDetails?.duration),
      views: parseInt(v.statistics.viewCount || "0"),
      likes: parseInt(v.statistics.likeCount || "0"),
      comments: parseInt(v.statistics.commentCount || "0"),
    }));
  }

  const sorted = [...videos].sort((a, b) => b.views - a.views);
  const top = sorted.slice(0, 10);
  const bottom = sorted.slice(-5);

  const prompt = `You are an elite YouTube growth strategist. Re-analyze this channel with the LATEST data and return updated DNA.

CHANNEL: ${ch?.snippet?.title}
SUBSCRIBERS: ${ch?.statistics?.subscriberCount}
TOTAL VIEWS: ${ch?.statistics?.viewCount}
TOTAL VIDEOS: ${ch?.statistics?.videoCount}

TOP 10 BY VIEWS:
${top.map((v, i) => `${i + 1}. "${v.title}" — ${v.views.toLocaleString()} views, ${v.durationSec}s`).join("\n")}

BOTTOM 5:
${bottom.map((v, i) => `${i + 1}. "${v.title}" — ${v.views.toLocaleString()} views`).join("\n")}

Return strict JSON: { niche, sub_niche, target_audience{primary,demographics,psychographics}, content_pillars[], voice_tone{style,energy,examples_from_titles[]}, viral_patterns[{pattern,evidence}], strengths[], weaknesses[], recommendations[{action,why,priority}], growth_score(0-100), bottleneck, next_action, raw_summary }`;

  const ai = await callAI([
    { role: "system", content: "You give specific, evidence-based YouTube growth advice." },
    { role: "user", content: prompt },
  ]);

  let parsed: any = {};
  try {
    parsed = JSON.parse(ai.choices?.[0]?.message?.content || "{}");
  } catch {
    parsed = { raw_summary: ai.choices?.[0]?.message?.content };
  }

  await supabase.from("channel_dna_profiles").update({
    niche: parsed.niche,
    sub_niche: parsed.sub_niche,
    target_audience: parsed.target_audience,
    content_pillars: parsed.content_pillars,
    voice_tone: parsed.voice_tone,
    viral_patterns: parsed.viral_patterns,
    strengths: parsed.strengths,
    weaknesses: parsed.weaknesses,
    recommendations: parsed.recommendations,
    growth_score: parsed.growth_score,
    bottleneck: parsed.bottleneck,
    next_action: parsed.next_action,
    raw_summary: parsed.raw_summary,
    videos_analyzed: videos.length,
    updated_at: new Date().toISOString(),
  }).eq("id", profile.id);

  return { id: profile.id, ok: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Find profiles older than 2 days, max 10 per run
    const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const { data: stale } = await supabase
      .from("channel_dna_profiles")
      .select("id, user_id, youtube_account_id, channel_id")
      .lt("updated_at", cutoff)
      .limit(10);

    const results: any[] = [];
    for (const profile of stale || []) {
      try {
        results.push(await rescanOne(supabase, profile));
      } catch (e) {
        results.push({ id: profile.id, error: e instanceof Error ? e.message : String(e) });
      }
    }

    return new Response(
      JSON.stringify({ scanned: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("auto-rescan-dna:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
