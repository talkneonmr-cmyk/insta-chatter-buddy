import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UsageLimits {
  videoUploads: number;
  aiCaptions: number;
  youtubeChannels: number;
  youtubeOperations: number;
  aiMusic: number;
  aiThumbnails: number;
  aiScripts: number;
  aiTrends: number;
  aiSeo: number;
  aiHashtags: number;
  aiSpeechToText: number;
  aiTextToSpeech: number;
  aiVoiceCloning: number;
  aiDubbing: number;
  aiBackgroundRemoval: number;
  aiImageEnhancement: number;
  aiTextSummarizer: number;
  aiShortsPackages: number;
}

const PLAN_LIMITS = {
  free: {
    videoUploads: 3,
    aiCaptions: 4,
    youtubeChannels: 4,
    youtubeOperations: 20,
    aiMusic: 4,
    aiThumbnails: 4,
    aiScripts: 4,
    aiTrends: 4,
    aiSeo: 4,
    aiHashtags: 4,
    aiSpeechToText: 4,
    aiTextToSpeech: 4,
    aiVoiceCloning: 4,
    aiDubbing: 4,
    aiBackgroundRemoval: 4,
    aiImageEnhancement: 4,
    aiTextSummarizer: 4,
    aiShortsPackages: 4,
  },
  pro: {
    videoUploads: -1,
    aiCaptions: -1,
    youtubeChannels: -1,
    youtubeOperations: -1,
    aiMusic: 200,
    aiThumbnails: 10,
    aiScripts: -1,
    aiTrends: 20,
    aiSeo: 20,
    aiHashtags: 20,
    aiSpeechToText: 20,
    aiTextToSpeech: 20,
    aiVoiceCloning: 20,
    aiDubbing: 20,
    aiBackgroundRemoval: 20,
    aiImageEnhancement: 20,
    aiTextSummarizer: 20,
    aiShortsPackages: 20,
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
      .select('plan, current_period_end')
      .eq('user_id', user.id)
      .maybeSingle();

    const plan = subscription?.plan || 'free';
    const currentPeriodEnd = subscription?.current_period_end;

    // Get usage tracking
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Create usage tracking if it doesn't exist
    if (!usage) {
      const { data: newUsage } = await supabase
        .from('usage_tracking')
        .insert({ user_id: user.id })
        .select()
        .single();
      
      // Use the newly created usage record
      const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
      return new Response(
        JSON.stringify({ 
          canUse: true, 
          message: 'New usage tracking created',
          currentUsage: 0,
          limit: limits.videoUploads,
          plan 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if 24 hours have passed since last reset
    const resetAt = new Date(usage.reset_at);
    const now = new Date();
    const hoursSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60);

    // For free users: reset every 24 hours
    // For pro users: reset based on billing cycle
    let shouldReset = false;
    
    if (plan === 'free') {
      shouldReset = hoursSinceReset >= 24;
    } else if (plan === 'pro' && currentPeriodEnd) {
      // For pro users, check if we're in a new billing period
      const periodEnd = new Date(currentPeriodEnd);
      if (now > periodEnd) {
        shouldReset = true;
      } else if (hoursSinceReset >= 24) {
        // Also reset daily for pro users every 24 hours
        shouldReset = true;
      }
    }

    // Reset daily counts if needed
    if (shouldReset) {
      await supabase
        .from('usage_tracking')
        .update({
          video_uploads_count: 0,
          ai_captions_count: 0,
          ai_music_count: 0,
          ai_thumbnails_count: 0,
          ai_scripts_count: 0,
          ai_trends_count: 0,
          ai_seo_count: 0,
          ai_hashtags_count: 0,
          ai_speech_to_text_count: 0,
          ai_text_to_speech_count: 0,
          ai_voice_cloning_count: 0,
          ai_dubbing_count: 0,
          ai_background_removal_count: 0,
          ai_image_enhancement_count: 0,
          ai_text_summarizer_count: 0,
          ai_shorts_packages_count: 0,
          youtube_operations_count: 0,
          reset_at: now.toISOString(),
        })
        .eq('user_id', user.id);

      // Fetch the updated usage
      const { data: resetUsage } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Continue with reset usage data
      const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
      return new Response(
        JSON.stringify({ 
          canUse: true, 
          message: plan === 'free' ? 'Daily limits reset. You have full quota available.' : 'Limits reset. You have your quota available.',
          currentUsage: 0,
          limit: limits.videoUploads,
          plan 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
    let canUse = false;
    let message = '';
    let currentUsage = 0;
    let limit = 0;

    switch (limitType) {
      case 'video_uploads':
      case 'video_upload':
        currentUsage = usage?.video_uploads_count || 0;
        limit = limits.videoUploads;
        canUse = limit === -1 || currentUsage < limit;
        message = canUse 
          ? `You have ${limit === -1 ? 'unlimited' : limit - currentUsage} video uploads remaining`
          : `You've reached your limit of ${limit} video uploads. Upgrade to Pro for unlimited uploads.`;
        break;
      case 'ai_captions':
      case 'ai_caption':
        currentUsage = usage?.ai_captions_count || 0;
        limit = limits.aiCaptions;
        canUse = limit === -1 || currentUsage < limit;
        message = canUse 
          ? `You have ${limit === -1 ? 'unlimited' : limit - currentUsage} AI captions remaining`
          : `You've reached your limit of ${limit} AI captions. Upgrade to Pro for unlimited captions.`;
        break;
      case 'youtube_channels':
      case 'youtube_channel':
        currentUsage = usage?.youtube_channels_count || 0;
        limit = limits.youtubeChannels;
        canUse = limit === -1 || currentUsage < limit;
        message = canUse 
          ? `You can add ${limit - currentUsage} more channel(s)`
          : `You've reached your limit of ${limit} channel(s). Upgrade to Pro for unlimited channels.`;
        break;
      case 'youtube_operations':
      case 'youtube_operation':
      case 'youtube_upload':
      case 'youtube_analytics':
      case 'youtube_bulk':
      case 'youtube_playlist':
      case 'youtube_video':
        currentUsage = usage?.youtube_operations_count || 0;
        limit = limits.youtubeOperations;
        canUse = limit === -1 || currentUsage < limit;
        message = canUse 
          ? `You have ${limit === -1 ? 'unlimited' : limit - currentUsage} YouTube operations remaining today`
          : `You've reached your daily limit of ${limit} YouTube operations (uploads, analytics, bulk updates, etc.). ${plan === 'free' ? 'Upgrade to Pro for unlimited!' : 'Resets tomorrow!'}`;
        break;
      case 'ai_music':
        currentUsage = usage?.ai_music_count || 0;
        limit = limits.aiMusic;
        canUse = limit === -1 || currentUsage < limit;
        message = canUse 
          ? `You have ${limit === -1 ? 'unlimited' : limit - currentUsage} AI music generations remaining today`
          : `You've reached your daily limit of ${limit} AI music generations. ${plan === 'free' ? 'Upgrade to Pro for 200 generations/day.' : 'Resets tomorrow!'}`;
        break;
      case 'ai_thumbnails':
        currentUsage = usage?.ai_thumbnails_count || 0;
        limit = limits.aiThumbnails;
        canUse = limit === -1 || currentUsage < limit;
        message = canUse 
          ? `You have ${limit === -1 ? 'unlimited' : limit - currentUsage} AI thumbnails remaining today`
          : `You've reached your daily limit of ${limit} AI thumbnails. ${plan === 'free' ? 'Upgrade to Pro for 10 thumbnails/day.' : 'Resets tomorrow!'}`;
        break;
      case 'ai_scripts':
        currentUsage = usage?.ai_scripts_count || 0;
        limit = limits.aiScripts;
        canUse = limit === -1 || currentUsage < limit;
        message = canUse 
          ? `You have ${limit === -1 ? 'unlimited' : limit - currentUsage} AI scripts remaining today`
          : `You've reached your daily limit of ${limit} AI scripts. ${plan === 'free' ? 'Upgrade to Pro for unlimited scripts.' : 'Resets tomorrow!'}`;
        break;
      case 'ai_trends':
        currentUsage = usage?.ai_trends_count || 0;
        limit = limits.aiTrends;
        canUse = limit === -1 || currentUsage < limit;
        message = canUse 
          ? `You have ${limit === -1 ? 'unlimited' : limit - currentUsage} trend analyses remaining today`
          : `You've reached your daily limit of ${limit} trend analyses. ${plan === 'free' ? 'Upgrade to Pro for 20/day.' : 'Resets tomorrow!'}`;
        break;
      case 'ai_seo':
        currentUsage = usage?.ai_seo_count || 0;
        limit = limits.aiSeo;
        canUse = limit === -1 || currentUsage < limit;
        message = canUse 
          ? `You have ${limit === -1 ? 'unlimited' : limit - currentUsage} SEO optimizations remaining today`
          : `You've reached your daily limit of ${limit} SEO optimizations. ${plan === 'free' ? 'Upgrade to Pro for 20/day.' : 'Resets tomorrow!'}`;
        break;
      case 'ai_hashtags':
        currentUsage = usage?.ai_hashtags_count || 0;
        limit = limits.aiHashtags;
        canUse = limit === -1 || currentUsage < limit;
        message = canUse 
          ? `You have ${limit === -1 ? 'unlimited' : limit - currentUsage} hashtag generations remaining today`
          : `You've reached your daily limit of ${limit} hashtag generations. ${plan === 'free' ? 'Upgrade to Pro for 20/day.' : 'Resets tomorrow!'}`;
        break;
      case 'ai_speech_to_text':
        currentUsage = usage?.ai_speech_to_text_count || 0;
        limit = limits.aiSpeechToText;
        canUse = limit === -1 || currentUsage < limit;
        message = canUse 
          ? `You have ${limit === -1 ? 'unlimited' : limit - currentUsage} speech to text conversions remaining today`
          : `You've reached your daily limit of ${limit} speech to text conversions. ${plan === 'free' ? 'Upgrade to Pro for 20/day.' : 'Resets tomorrow!'}`;
        break;
      case 'ai_text_to_speech':
        currentUsage = usage?.ai_text_to_speech_count || 0;
        limit = limits.aiTextToSpeech;
        canUse = limit === -1 || currentUsage < limit;
        message = canUse 
          ? `You have ${limit === -1 ? 'unlimited' : limit - currentUsage} text to speech conversions remaining today`
          : `You've reached your daily limit of ${limit} text to speech conversions. ${plan === 'free' ? 'Upgrade to Pro for 20/day.' : 'Resets tomorrow!'}`;
        break;
      case 'ai_voice_cloning':
        currentUsage = usage?.ai_voice_cloning_count || 0;
        limit = limits.aiVoiceCloning;
        canUse = limit === -1 || currentUsage < limit;
        message = canUse 
          ? `You have ${limit === -1 ? 'unlimited' : limit - currentUsage} voice cloning generations remaining today`
          : `You've reached your daily limit of ${limit} voice cloning generations. ${plan === 'free' ? 'Upgrade to Pro for 20/day.' : 'Resets tomorrow!'}`;
        break;
      case 'ai_dubbing':
        currentUsage = usage?.ai_dubbing_count || 0;
        limit = limits.aiDubbing;
        canUse = limit === -1 || currentUsage < limit;
        message = canUse 
          ? `You have ${limit === -1 ? 'unlimited' : limit - currentUsage} dubbing generations remaining today`
          : `You've reached your daily limit of ${limit} dubbing generations. ${plan === 'free' ? 'Upgrade to Pro for 20/day.' : 'Resets tomorrow!'}`;
        break;
      case 'ai_background_removal':
        currentUsage = usage?.ai_background_removal_count || 0;
        limit = limits.aiBackgroundRemoval;
        canUse = limit === -1 || currentUsage < limit;
        message = canUse 
          ? `You have ${limit === -1 ? 'unlimited' : limit - currentUsage} background removals remaining today`
          : `You've reached your daily limit of ${limit} background removals. ${plan === 'free' ? 'Upgrade to Pro for 20/day.' : 'Resets tomorrow!'}`;
        break;
      case 'ai_image_enhancement':
        currentUsage = usage?.ai_image_enhancement_count || 0;
        limit = limits.aiImageEnhancement;
        canUse = limit === -1 || currentUsage < limit;
        message = canUse 
          ? `You have ${limit === -1 ? 'unlimited' : limit - currentUsage} image enhancements remaining today`
          : `You've reached your daily limit of ${limit} image enhancements. ${plan === 'free' ? 'Upgrade to Pro for 20/day.' : 'Resets tomorrow!'}`;
        break;
      case 'ai_text_summarizer':
        currentUsage = usage?.ai_text_summarizer_count || 0;
        limit = limits.aiTextSummarizer;
        canUse = limit === -1 || currentUsage < limit;
        message = canUse 
          ? `You have ${limit === -1 ? 'unlimited' : limit - currentUsage} text summarizations remaining today`
          : `You've reached your daily limit of ${limit} text summarizations. ${plan === 'free' ? 'Upgrade to Pro for 20/day.' : 'Resets tomorrow!'}`;
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