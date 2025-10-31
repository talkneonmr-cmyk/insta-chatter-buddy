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

    const { usageType } = await req.json();

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
        updateData = { ai_trends_count: usage.ai_trends_count + 1 };
        break;
      case 'ai_seo':
        updateData = { ai_seo_count: usage.ai_seo_count + 1 };
        break;
      case 'ai_hashtags':
        updateData = { ai_hashtags_count: usage.ai_hashtags_count + 1 };
        break;
      case 'ai_repurpose':
        updateData = { ai_repurpose_count: usage.ai_repurpose_count + 1 };
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