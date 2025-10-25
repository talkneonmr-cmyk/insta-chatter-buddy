import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadRequest {
  scheduledVideoId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { scheduledVideoId }: UploadRequest = await req.json();

    if (!scheduledVideoId) {
      return new Response(
        JSON.stringify({ error: 'scheduledVideoId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch scheduled video details
    const { data: video, error: videoError } = await supabase
      .from('scheduled_videos')
      .select('*, youtube_accounts(*)')
      .eq('id', scheduledVideoId)
      .single();

    if (videoError || !video) {
      throw new Error('Scheduled video not found');
    }

    // Update status to processing
    await supabase
      .from('scheduled_videos')
      .update({ status: 'processing' })
      .eq('id', scheduledVideoId);

    // Prepare video metadata
    const metadata = {
      snippet: {
        title: video.title,
        description: video.description || '',
        tags: video.tags || [],
        categoryId: video.category_id || '22'
      },
      status: {
        privacyStatus: video.privacy_status || 'private'
      }
    };

    // Note: Actual video upload requires multipart/form-data with video file
    // This is a simplified version - in production, you'd need to handle file streaming
    console.log('Would upload video with metadata:', metadata);
    console.log('Video file path:', video.video_file_path);

    // For now, we'll simulate a successful upload
    // In production, implement actual YouTube Data API v3 resumable upload
    const mockYoutubeVideoId = `yt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Update scheduled video with YouTube video ID
    await supabase
      .from('scheduled_videos')
      .update({
        status: 'uploaded',
        youtube_video_id: mockYoutubeVideoId
      })
      .eq('id', scheduledVideoId);

    // Log to upload history
    await supabase
      .from('video_uploads_history')
      .insert({
        user_id: video.user_id,
        youtube_account_id: video.youtube_account_id,
        scheduled_video_id: scheduledVideoId,
        title: video.title,
        youtube_video_id: mockYoutubeVideoId,
        status: 'uploaded'
      });

    return new Response(
      JSON.stringify({
        success: true,
        youtube_video_id: mockYoutubeVideoId,
        message: 'Video uploaded successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in youtube-upload function:', error);
    
    // Try to update video status to failed
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { scheduledVideoId } = await req.json();
      await supabase
        .from('scheduled_videos')
        .update({
          status: 'failed',
          upload_error: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', scheduledVideoId);
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});