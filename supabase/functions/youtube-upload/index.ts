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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  // Use service role for all operations - this function is called by scheduler
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let scheduledVideoId: string | undefined;

  try {
    const body: UploadRequest = await req.json();
    scheduledVideoId = body.scheduledVideoId;

    if (!scheduledVideoId) {
      return new Response(
        JSON.stringify({ error: 'scheduledVideoId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch scheduled video details
    console.log('Fetching video with ID:', scheduledVideoId);
    const { data: video, error: videoError } = await supabase
      .from('scheduled_videos')
      .select('*')
      .eq('id', scheduledVideoId)
      .single();

    if (videoError) {
      console.error('Video fetch error:', videoError);
      throw new Error(`Scheduled video not found: ${videoError.message}`);
    }

    if (!video) {
      throw new Error('Scheduled video not found');
    }

    console.log('Found video:', video.title, 'for user:', video.user_id);

    // Get user's subscription to check limits
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('plan')
      .eq('user_id', video.user_id)
      .maybeSingle();

    const plan = subscription?.plan || 'free';
    
    // Get current usage
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('youtube_operations_count')
      .eq('user_id', video.user_id)
      .maybeSingle();

    const currentUsage = usage?.youtube_operations_count || 0;
    const limit = plan === 'pro' ? -1 : 20; // -1 means unlimited
    
    if (limit !== -1 && currentUsage >= limit) {
      console.log('Usage limit reached for user:', video.user_id);
      await supabase
        .from('scheduled_videos')
        .update({ 
          status: 'failed', 
          upload_error: 'Daily YouTube operations limit reached. Video will retry tomorrow.' 
        })
        .eq('id', scheduledVideoId);
        
      return new Response(
        JSON.stringify({ error: 'YouTube operations limit reached' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch YouTube account access token
    const { data: ytAccount, error: ytError } = await supabase
      .from('youtube_accounts')
      .select('access_token, refresh_token, token_expires_at')
      .eq('id', video.youtube_account_id)
      .single();

    if (ytError || !ytAccount) {
      throw new Error('YouTube account not found');
    }

    // Check if token needs refresh
    let accessToken = ytAccount.access_token;
    if (new Date(ytAccount.token_expires_at) <= new Date()) {
      console.log('Access token expired, refreshing...');
      
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('YOUTUBE_CLIENT_ID')!,
          client_secret: Deno.env.get('YOUTUBE_CLIENT_SECRET')!,
          refresh_token: ytAccount.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh access token');
      }

      const tokens = await refreshResponse.json();
      accessToken = tokens.access_token;

      // Update token in database
      await supabase
        .from('youtube_accounts')
        .update({
          access_token: tokens.access_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq('id', video.youtube_account_id);
    }

    // Update status to processing
    await supabase
      .from('scheduled_videos')
      .update({ status: 'processing' })
      .eq('id', scheduledVideoId);

    // Download video file from storage
    console.log('Downloading video from storage:', video.video_file_path);
    const { data: videoFile, error: downloadError } = await supabase
      .storage
      .from('videos')
      .download(video.video_file_path.replace('videos/', ''));

    if (downloadError || !videoFile) {
      throw new Error(`Failed to download video: ${downloadError?.message || 'File not found'}`);
    }

    console.log('Video downloaded, size:', videoFile.size);

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

    console.log('Uploading with metadata:', JSON.stringify({
      title: metadata.snippet.title,
      description: metadata.snippet.description?.substring(0, 50) + '...',
      tags: metadata.snippet.tags,
      categoryId: metadata.snippet.categoryId,
      privacy: metadata.status.privacyStatus
    }, null, 2));

    // Step 1: Initialize resumable upload
    console.log('Initializing YouTube upload...');
    const initResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Length': videoFile.size.toString(),
          'X-Upload-Content-Type': 'video/*',
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      throw new Error(`Failed to initialize upload: ${errorText}`);
    }

    const uploadUrl = initResponse.headers.get('location');
    if (!uploadUrl) {
      throw new Error('No upload URL received from YouTube');
    }

    console.log('Upload initialized, uploading video...');

    // Step 2: Upload video file
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/*',
      },
      body: videoFile,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Failed to upload video: ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    const youtubeVideoId = uploadResult.id;

    console.log('Video uploaded successfully! YouTube ID:', youtubeVideoId);

    // Upload thumbnail if available
    if (video.thumbnail_path) {
      try {
        console.log('Uploading thumbnail from:', video.thumbnail_path);
        const { data: thumbnailFile, error: thumbnailError } = await supabase
          .storage
          .from('videos')
          .download(video.thumbnail_path.replace('videos/', ''));

        if (!thumbnailError && thumbnailFile) {
          const thumbnailResponse = await fetch(
            `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${youtubeVideoId}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'image/jpeg',
              },
              body: thumbnailFile,
            }
          );

          if (thumbnailResponse.ok) {
            console.log('Thumbnail uploaded successfully');
          } else {
            console.error('Thumbnail upload failed:', await thumbnailResponse.text());
          }
        }
      } catch (thumbnailErr) {
        console.error('Error uploading thumbnail:', thumbnailErr);
        // Don't fail the entire upload if thumbnail fails
      }
    }

    // Update scheduled video with YouTube video ID
    await supabase
      .from('scheduled_videos')
      .update({
        status: 'uploaded',
        youtube_video_id: youtubeVideoId
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
        youtube_video_id: youtubeVideoId,
        status: 'uploaded'
      });

    // Increment YouTube operations usage directly in database
    await supabase
      .from('usage_tracking')
      .update({ 
        youtube_operations_count: currentUsage + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', video.user_id);
    
    console.log('Usage incremented for user:', video.user_id);

    return new Response(
      JSON.stringify({
        success: true,
        youtube_video_id: youtubeVideoId,
        youtube_url: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
        message: 'Video uploaded successfully to YouTube!'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in youtube-upload function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Try to update video status to failed with actual error message
    if (scheduledVideoId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('scheduled_videos')
          .update({
            status: 'failed',
            upload_error: errorMessage.substring(0, 500) // Limit error length
          })
          .eq('id', scheduledVideoId);
      } catch (updateError) {
        console.error('Failed to update error status:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ error: 'Failed to upload video. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});