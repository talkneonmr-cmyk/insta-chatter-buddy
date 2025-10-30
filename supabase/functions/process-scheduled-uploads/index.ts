import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.13'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Checking for scheduled videos ready to upload...');

    // Query for videos that are scheduled and past their upload time
    const { data: scheduledVideos, error: queryError } = await supabase
      .from('scheduled_videos')
      .select('id, title, scheduled_for, user_id')
      .eq('status', 'scheduled')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true });

    if (queryError) {
      console.error('Error querying scheduled videos:', queryError);
      throw queryError;
    }

    if (!scheduledVideos || scheduledVideos.length === 0) {
      console.log('No videos ready for upload');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No videos ready for upload',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${scheduledVideos.length} video(s) ready for upload`);

    // Process each video
    const results = [];
    for (const video of scheduledVideos) {
      try {
        console.log(`Processing video: ${video.title} (ID: ${video.id})`);

        // Update status to 'uploading' to prevent duplicate processing
        const { error: updateError } = await supabase
          .from('scheduled_videos')
          .update({ status: 'uploading' })
          .eq('id', video.id);

        if (updateError) {
          console.error(`Error updating video ${video.id} status:`, updateError);
          results.push({ 
            id: video.id, 
            title: video.title,
            success: false, 
            error: 'Failed to update status' 
          });
          continue;
        }

        // Call the youtube-upload function
        const { data: uploadResult, error: uploadError } = await supabase.functions.invoke(
          'youtube-upload',
          {
            body: { scheduledVideoId: video.id }
          }
        );

        if (uploadError) {
          console.error(`Error uploading video ${video.id}:`, uploadError);
          
          // Update status back to 'scheduled' on error
          await supabase
            .from('scheduled_videos')
            .update({ 
              status: 'failed',
              upload_error: uploadError.message || 'Upload failed'
            })
            .eq('id', video.id);

          results.push({ 
            id: video.id, 
            title: video.title,
            success: false, 
            error: uploadError.message 
          });
        } else {
          console.log(`Successfully initiated upload for video ${video.id}`);
          results.push({ 
            id: video.id, 
            title: video.title,
            success: true 
          });
        }
      } catch (error) {
        console.error(`Unexpected error processing video ${video.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ 
          id: video.id, 
          title: video.title,
          success: false, 
          error: errorMessage 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Upload processing complete. Success: ${successCount}, Failed: ${failCount}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Processed ${scheduledVideos.length} video(s)`,
        processed: scheduledVideos.length,
        successful: successCount,
        failed: failCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-scheduled-uploads:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
