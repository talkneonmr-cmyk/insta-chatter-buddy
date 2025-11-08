import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`Running auto-pilot for user: ${user.id}`);

    // Fetch auto-pilot settings
    const { data: settings, error: settingsError } = await supabase
      .from('auto_pilot_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !settings || !settings.enabled) {
      return new Response(
        JSON.stringify({ message: 'Auto-pilot not enabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if we should run based on frequency
    if (settings.last_run_at) {
      const lastRun = new Date(settings.last_run_at);
      const hoursSinceLastRun = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastRun < settings.check_frequency_hours) {
        return new Response(
          JSON.stringify({ 
            message: 'Not yet time to run',
            nextRunIn: settings.check_frequency_hours - hoursSinceLastRun
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch underperforming videos
    const { data: videos, error: videosError } = await supabase
      .from('video_performance_tracking')
      .select('*')
      .eq('user_id', user.id)
      .lt('performance_score', settings.performance_threshold)
      .eq('optimization_applied', false)
      .order('performance_score', { ascending: true })
      .limit(5); // Process top 5 worst performing videos

    if (videosError) {
      throw videosError;
    }

    if (!videos || videos.length === 0) {
      await supabase
        .from('auto_pilot_settings')
        .update({ last_run_at: new Date().toISOString() })
        .eq('id', settings.id);

      return new Response(
        JSON.stringify({ message: 'No underperforming videos found', videosProcessed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    // Process each video
    for (const video of videos) {
      try {
        // Call auto-optimize function
        const optimizeResponse = await fetch(
          `${supabaseUrl}/functions/v1/auto-optimize-video`,
          {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              videoId: video.video_id,
              applyChanges: settings.auto_apply,
            }),
          }
        );

        if (optimizeResponse.ok) {
          const optimizeData = await optimizeResponse.json();
          results.push({
            videoId: video.video_id,
            title: video.video_title,
            success: true,
            applied: settings.auto_apply,
            optimizations: optimizeData.optimizations?.length || 0,
          });
        } else {
          results.push({
            videoId: video.video_id,
            title: video.video_title,
            success: false,
            error: await optimizeResponse.text(),
          });
        }
      } catch (error: any) {
        results.push({
          videoId: video.video_id,
          title: video.video_title,
          success: false,
          error: error.message,
        });
      }
    }

    // Update last run time
    await supabase
      .from('auto_pilot_settings')
      .update({ last_run_at: new Date().toISOString() })
      .eq('id', settings.id);

    return new Response(
      JSON.stringify({
        success: true,
        videosProcessed: results.length,
        autoApplied: settings.auto_apply,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in run-auto-pilot:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
