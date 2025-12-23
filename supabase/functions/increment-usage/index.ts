import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { usageType } = requestBody;

    // Get current usage
    let { data: usage } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!usage) {
      // Create usage tracking if it doesn't exist
      const { error: insertError } = await supabase
        .from('usage_tracking')
        .insert({ user_id: user.id });
      
      if (insertError) throw insertError;
      
      // Get the newly created record
      const { data: newUsage, error: fetchError } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (fetchError || !newUsage) throw new Error('Failed to create usage tracking');
      usage = newUsage;
    }

    // Increment the appropriate counter
    let updateData: any = {};
    switch (usageType) {
      case 'video_uploads':
      case 'video_upload':
        updateData = { video_uploads_count: usage.video_uploads_count + 1 };
        break;
      case 'ai_captions':
      case 'ai_caption':
        updateData = { ai_captions_count: usage.ai_captions_count + 1 };
        break;
      case 'youtube_channels':
      case 'youtube_channel':
        updateData = { youtube_channels_count: usage.youtube_channels_count + 1 };
        break;
      case 'ai_music':
        updateData = { ai_music_count: usage.ai_music_count + 1 };
        break;
      case 'ai_thumbnails':
        updateData = { ai_thumbnails_count: usage.ai_thumbnails_count + 1 };
        break;
      case 'ai_scripts':
        updateData = { ai_scripts_count: usage.ai_scripts_count + 1 };
        break;
      case 'ai_trends':
      case 'ai_trend_analysis':
        updateData = { ai_trends_count: usage.ai_trends_count + 1 };
        break;
      case 'ai_seo':
        updateData = { ai_seo_count: usage.ai_seo_count + 1 };
        break;
      case 'ai_hashtags':
        updateData = { ai_hashtags_count: usage.ai_hashtags_count + 1 };
        break;
      case 'ai_speech_to_text':
        updateData = { ai_speech_to_text_count: usage.ai_speech_to_text_count + 1 };
        break;
      case 'ai_text_to_speech':
        updateData = { ai_text_to_speech_count: usage.ai_text_to_speech_count + 1 };
        break;
      case 'ai_voice_cloning':
        updateData = { ai_voice_cloning_count: usage.ai_voice_cloning_count + 1 };
        break;
      case 'ai_dubbing':
        updateData = { ai_dubbing_count: usage.ai_dubbing_count + 1 };
        break;
      case 'ai_background_removal':
        updateData = { ai_background_removal_count: usage.ai_background_removal_count + 1 };
        break;
      case 'ai_voice_isolation':
        throw new Error('Voice isolation feature is not available');
        break;
      case 'ai_image_enhancement':
        updateData = { ai_image_enhancement_count: usage.ai_image_enhancement_count + 1 };
        break;
      case 'ai_text_summary':
      case 'ai_text_summarizer':
        updateData = { ai_text_summarizer_count: usage.ai_text_summarizer_count + 1 };
        break;
      case 'ai_shorts_packages':
        updateData = { ai_shorts_packages_count: usage.ai_shorts_packages_count + 1 };
        break;
      case 'ai_creator_helper_bot':
        updateData = { ai_creator_helper_bot_count: usage.ai_creator_helper_bot_count + 1 };
        break;
      case 'ai_you_research':
        updateData = { ai_you_research_count: (usage.ai_you_research_count || 0) + 1 };
        break;
      case 'youtube_operations':
      case 'youtube_operation':
      case 'youtube_upload':
      case 'youtube_analytics':
      case 'youtube_bulk':
      case 'youtube_playlist':
      case 'youtube_video':
        updateData = { youtube_operations_count: usage.youtube_operations_count + 1 };
        break;
      default:
        throw new Error('Invalid usage type');
    }

    const { error: updateError } = await supabase
      .from('usage_tracking')
      .update(updateData)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error incrementing usage:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});