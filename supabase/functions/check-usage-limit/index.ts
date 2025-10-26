import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UsageLimits {
  videoUploads: number;
  aiCaptions: number;
  youtubeChannels: number;
}

const PLAN_LIMITS = {
  free: {
    videoUploads: 5,
    aiCaptions: 10,
    youtubeChannels: 1,
  },
  pro: {
    videoUploads: -1, // unlimited
    aiCaptions: -1, // unlimited
    youtubeChannels: 3,
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { limitType } = await req.json();

    // Get user subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .single();

    const plan = subscription?.plan || 'free';

    // Get usage tracking
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
    let canUse = false;
    let message = '';
    let currentUsage = 0;
    let limit = 0;

    switch (limitType) {
      case 'video_upload':
        currentUsage = usage?.video_uploads_count || 0;
        limit = limits.videoUploads;
        canUse = limit === -1 || currentUsage < limit;
        message = canUse 
          ? `You have ${limit === -1 ? 'unlimited' : limit - currentUsage} video uploads remaining`
          : `You've reached your limit of ${limit} video uploads. Upgrade to Pro for unlimited uploads.`;
        break;
      case 'ai_caption':
        currentUsage = usage?.ai_captions_count || 0;
        limit = limits.aiCaptions;
        canUse = limit === -1 || currentUsage < limit;
        message = canUse 
          ? `You have ${limit === -1 ? 'unlimited' : limit - currentUsage} AI captions remaining`
          : `You've reached your limit of ${limit} AI captions. Upgrade to Pro for unlimited captions.`;
        break;
      case 'youtube_channel':
        currentUsage = usage?.youtube_channels_count || 0;
        limit = limits.youtubeChannels;
        canUse = limit === -1 || currentUsage < limit;
        message = canUse 
          ? `You can add ${limit - currentUsage} more channel(s)`
          : `You've reached your limit of ${limit} channel(s). Upgrade to Pro for up to 3 channels.`;
        break;
    }

    return new Response(
      JSON.stringify({ 
        canUse, 
        message, 
        currentUsage, 
        limit,
        plan 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});