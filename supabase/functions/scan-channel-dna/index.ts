import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

async function refreshIfNeeded(supabase: any, account: any) {
  const expiresAt = new Date(account.token_expires_at);
  if (expiresAt > new Date()) return account.access_token;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('YOUTUBE_CLIENT_ID')!,
      client_secret: Deno.env.get('YOUTUBE_CLIENT_SECRET')!,
      refresh_token: account.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  const d = await r.json();
  await supabase.from('youtube_accounts').update({
    access_token: d.access_token,
    token_expires_at: new Date(Date.now() + d.expires_in * 1000).toISOString(),
  }).eq('id', account.id);
  return d.access_token;
}

function parseDuration(iso: string): number {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '');
  if (!m) return 0;
  return (parseInt(m[1] || '0') * 3600) + (parseInt(m[2] || '0') * 60) + parseInt(m[3] || '0');
}

async function callAI(messages: any[], retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        response_format: { type: 'json_object' },
      }),
    });
    if (r.ok) return await r.json();
    if (r.status === 429 || r.status >= 500) {
      await new Promise(res => setTimeout(res, 1000 * (i + 1)));
      continue;
    }
    const txt = await r.text();
    throw new Error(`AI gateway error ${r.status}: ${txt}`);
  }
  throw new Error('AI gateway failed after retries');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: account } = await supabase.from('youtube_accounts').select('*').eq('user_id', user.id).maybeSingle();
    if (!account) return new Response(JSON.stringify({ error: 'Connect your YouTube channel first' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const accessToken = await refreshIfNeeded(supabase, account);

    // 1. Channel meta
    const chRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${account.channel_id}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const chData = await chRes.json();
    const ch = chData.items?.[0];

    // 2. Recent videos
    const sRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${account.channel_id}&order=date&maxResults=50&type=video`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const sData = await sRes.json();
    const videoIds = (sData.items || []).map((i: any) => i.id?.videoId).filter(Boolean).join(',');

    let videos: any[] = [];
    if (videoIds) {
      const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${videoIds}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const vData = await vRes.json();
      videos = (vData.items || []).map((v: any) => ({
        title: v.snippet.title,
        description: (v.snippet.description || '').slice(0, 300),
        publishedAt: v.snippet.publishedAt,
        durationSec: parseDuration(v.contentDetails?.duration),
        views: parseInt(v.statistics.viewCount || '0'),
        likes: parseInt(v.statistics.likeCount || '0'),
        comments: parseInt(v.statistics.commentCount || '0'),
      }));
    }

    // Build compact dataset for AI
    const sortedByViews = [...videos].sort((a, b) => b.views - a.views);
    const top = sortedByViews.slice(0, 10);
    const bottom = sortedByViews.slice(-5);

    const prompt = `You are an elite YouTube growth strategist. Analyze this creator's channel and return a SHARP, SPECIFIC, ACTIONABLE DNA profile. No generic advice. Speak like a coach who has actually watched the channel.

CHANNEL: ${ch?.snippet?.title}
DESCRIPTION: ${ch?.snippet?.description?.slice(0, 500)}
SUBSCRIBERS: ${ch?.statistics?.subscriberCount}
TOTAL VIEWS: ${ch?.statistics?.viewCount}
TOTAL VIDEOS: ${ch?.statistics?.videoCount}

TOP 10 VIDEOS BY VIEWS:
${top.map((v, i) => `${i + 1}. "${v.title}" — ${v.views.toLocaleString()} views, ${v.durationSec}s, ${v.likes} likes`).join('\n')}

BOTTOM 5 VIDEOS BY VIEWS:
${bottom.map((v, i) => `${i + 1}. "${v.title}" — ${v.views.toLocaleString()} views, ${v.durationSec}s`).join('\n')}

Return strict JSON with this exact shape:
{
  "niche": "string — primary niche, specific not generic",
  "sub_niche": "string — narrower angle/positioning",
  "target_audience": { "primary": "string", "demographics": "string", "psychographics": "string" },
  "content_pillars": ["string", "string", "string"],
  "voice_tone": { "style": "string", "energy": "string", "examples_from_titles": ["string"] },
  "viral_patterns": [{ "pattern": "string — what consistently works", "evidence": "string — which videos prove it" }],
  "strengths": ["string — sharp observations"],
  "weaknesses": ["string — honest, specific weaknesses with examples"],
  "recommendations": [{ "action": "string — exactly what to do", "why": "string", "priority": "high|medium|low" }],
  "growth_score": 0-100,
  "bottleneck": "string — the ONE thing holding growth back",
  "next_action": "string — the single most impactful next step",
  "raw_summary": "string — 2-3 sentence overall verdict"
}`;

    const ai = await callAI([
      { role: 'system', content: 'You are a senior YouTube growth strategist. You give specific, evidence-based advice. Never generic. Always reference the actual data shown.' },
      { role: 'user', content: prompt },
    ]);

    const content = ai.choices?.[0]?.message?.content;
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch { parsed = { raw_summary: content }; }

    // Upsert (one DNA per youtube account)
    const { data: existing } = await supabase
      .from('channel_dna_profiles')
      .select('id')
      .eq('youtube_account_id', account.id)
      .maybeSingle();

    const row = {
      user_id: user.id,
      youtube_account_id: account.id,
      channel_id: account.channel_id,
      channel_title: account.channel_title,
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
    };

    let dna;
    if (existing) {
      const { data } = await supabase.from('channel_dna_profiles').update(row).eq('id', existing.id).select().single();
      dna = data;
    } else {
      const { data } = await supabase.from('channel_dna_profiles').insert(row).select().single();
      dna = data;
    }

    return new Response(JSON.stringify({ dna }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('scan-channel-dna error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
