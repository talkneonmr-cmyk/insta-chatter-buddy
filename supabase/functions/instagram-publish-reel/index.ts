import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PublishRequest {
  scheduledVideoId?: string;
  videoFilePath?: string; // path inside `videos` bucket (without bucket prefix)
  caption?: string;
  shareToFeed?: boolean;
}

const FB_GRAPH = 'https://graph.facebook.com/v18.0';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url: string, init?: RequestInit, tries = 3): Promise<Response> {
  let last: Response | undefined;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, init);
      if (res.ok || (res.status >= 400 && res.status < 500)) return res;
      last = res;
    } catch (_e) {
      if (i === tries - 1) throw _e;
    }
    await sleep(500 * (i + 1));
  }
  return last!;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // ---- AuthN ----
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---- Validate body ----
    const body = (await req.json().catch(() => ({}))) as PublishRequest;
    const caption = (body.caption ?? '').toString().slice(0, 2200);
    const shareToFeed = body.shareToFeed !== false;

    if (body.scheduledVideoId && !UUID_RE.test(body.scheduledVideoId)) {
      return new Response(JSON.stringify({ error: 'Invalid scheduledVideoId' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!body.scheduledVideoId && !body.videoFilePath) {
      return new Response(JSON.stringify({ error: 'scheduledVideoId or videoFilePath required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---- Resolve source video path ----
    let videoPath = body.videoFilePath || '';
    if (body.scheduledVideoId) {
      const { data: v, error: vErr } = await supabase
        .from('scheduled_videos')
        .select('user_id, video_file_path, title')
        .eq('id', body.scheduledVideoId)
        .single();
      if (vErr || !v) throw new Error('Scheduled video not found');
      if (v.user_id !== user.id) throw new Error('Not your video');
      videoPath = v.video_file_path.replace(/^videos\//, '');
    }
    if (!videoPath) throw new Error('No video path resolved');

    // ---- Get IG account ----
    const { data: ig, error: igErr } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (igErr || !ig) throw new Error('Instagram account not connected');
    if (ig.token_expires_at && new Date(ig.token_expires_at) < new Date()) {
      throw new Error('Instagram token expired — please reconnect Instagram');
    }

    // ---- Sign URL for IG to fetch (1 hour) ----
    const { data: signed, error: signErr } = await supabase
      .storage.from('videos').createSignedUrl(videoPath, 3600);
    if (signErr || !signed?.signedUrl) throw new Error('Failed to sign video URL');
    const videoUrl = signed.signedUrl;

    // ---- Track in DB ----
    const { data: row } = await supabase.from('instagram_reel_posts').insert({
      user_id: user.id,
      instagram_account_id: ig.id,
      scheduled_video_id: body.scheduledVideoId || null,
      source_video_path: videoPath,
      caption,
      status: 'creating_container',
    }).select('id').single();
    const postId = row?.id;

    const updateRow = async (patch: Record<string, unknown>) => {
      if (!postId) return;
      await supabase.from('instagram_reel_posts').update({
        ...patch, updated_at: new Date().toISOString(),
      }).eq('id', postId);
    };

    // ---- Step 1: Create media container ----
    const createUrl = new URL(`${FB_GRAPH}/${ig.instagram_user_id}/media`);
    createUrl.searchParams.set('media_type', 'REELS');
    createUrl.searchParams.set('video_url', videoUrl);
    createUrl.searchParams.set('caption', caption);
    createUrl.searchParams.set('share_to_feed', shareToFeed ? 'true' : 'false');
    createUrl.searchParams.set('access_token', ig.access_token);

    const createRes = await fetchWithRetry(createUrl.toString(), { method: 'POST' });
    const createData = await createRes.json();
    if (!createRes.ok || !createData.id) {
      const msg = createData?.error?.message || 'Failed to create reel container';
      await updateRow({ status: 'failed', error_message: msg });
      throw new Error(msg);
    }
    const containerId = createData.id;
    await updateRow({ status: 'processing', ig_media_id: containerId });

    // ---- Step 2: Poll status (Reels can take 30-90s to process) ----
    let publishReady = false;
    for (let i = 0; i < 30; i++) {
      await sleep(5000);
      const statusRes = await fetchWithRetry(
        `${FB_GRAPH}/${containerId}?fields=status_code,status&access_token=${encodeURIComponent(ig.access_token)}`
      );
      const statusData = await statusRes.json();
      console.log('Container status:', statusData);
      if (statusData.status_code === 'FINISHED') { publishReady = true; break; }
      if (statusData.status_code === 'ERROR' || statusData.status_code === 'EXPIRED') {
        const msg = statusData.status || `Container ${statusData.status_code}`;
        await updateRow({ status: 'failed', error_message: msg });
        throw new Error(`Reel processing failed: ${msg}`);
      }
    }
    if (!publishReady) {
      await updateRow({ status: 'failed', error_message: 'Timed out waiting for processing' });
      throw new Error('Timed out waiting for Instagram to process the video');
    }

    // ---- Step 3: Publish ----
    const publishRes = await fetchWithRetry(
      `${FB_GRAPH}/${ig.instagram_user_id}/media_publish?creation_id=${containerId}&access_token=${encodeURIComponent(ig.access_token)}`,
      { method: 'POST' }
    );
    const publishData = await publishRes.json();
    if (!publishRes.ok || !publishData.id) {
      const msg = publishData?.error?.message || 'Failed to publish reel';
      await updateRow({ status: 'failed', error_message: msg });
      throw new Error(msg);
    }
    const mediaId = publishData.id;

    // ---- Get permalink ----
    let permalink: string | null = null;
    try {
      const linkRes = await fetch(
        `${FB_GRAPH}/${mediaId}?fields=permalink&access_token=${encodeURIComponent(ig.access_token)}`
      );
      const linkData = await linkRes.json();
      permalink = linkData.permalink || null;
    } catch (_e) { /* non-fatal */ }

    await updateRow({ status: 'published', ig_media_id: mediaId, ig_permalink: permalink });

    return new Response(JSON.stringify({
      success: true, ig_media_id: mediaId, permalink,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('instagram-publish-reel error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
