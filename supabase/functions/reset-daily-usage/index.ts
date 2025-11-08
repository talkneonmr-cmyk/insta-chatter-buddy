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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Starting daily usage reset...');

    // Get all usage tracking records that need reset (more than 24 hours old)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const { data: usageRecords, error: fetchError } = await supabase
      .from('usage_tracking')
      .select('id, user_id, reset_at')
      .lt('reset_at', twentyFourHoursAgo.toISOString());

    if (fetchError) {
      console.error('Error fetching usage records:', fetchError);
      throw fetchError;
    }

    if (!usageRecords || usageRecords.length === 0) {
      console.log('No usage records need resetting');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No records to reset',
          count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${usageRecords.length} records to reset`);

    // Reset all daily counters for these users
    const { error: updateError } = await supabase
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
        reset_at: new Date().toISOString(),
      })
      .in('id', usageRecords.map(r => r.id));

    if (updateError) {
      console.error('Error updating usage records:', updateError);
      throw updateError;
    }

    console.log(`Successfully reset ${usageRecords.length} usage records`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Reset ${usageRecords.length} usage records`,
        count: usageRecords.length,
        resetIds: usageRecords.map(r => r.user_id)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in reset-daily-usage:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
