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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all users with enabled auto-responder
    const { data: settings, error: settingsError } = await supabaseClient
      .from('youtube_comment_settings')
      .select('*')
      .eq('enabled', true);

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      throw settingsError;
    }

    console.log(`Processing comments for ${settings?.length || 0} users`);

    for (const setting of settings || []) {
      await processUserComments(supabaseClient, setting);
    }

    return new Response(
      JSON.stringify({ success: true, processed: settings?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-youtube-comments:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processUserComments(supabaseClient: any, setting: any) {
  const { user_id, response_style, custom_instructions, blacklist_keywords, min_comment_length, reply_delay_minutes } = setting;

  try {
    // Get user's YouTube account
    const { data: account, error: accountError } = await supabaseClient
      .from('youtube_accounts')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (accountError || !account) {
      console.log(`No YouTube account for user ${user_id}`);
      return;
    }

    // Check and refresh token if needed
    let accessToken = account.access_token;
    const expiresAt = new Date(account.token_expires_at);

    if (expiresAt <= new Date()) {
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('YOUTUBE_CLIENT_ID')!,
          client_secret: Deno.env.get('YOUTUBE_CLIENT_SECRET')!,
          refresh_token: account.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      await supabaseClient
        .from('youtube_accounts')
        .update({
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
        })
        .eq('id', account.id);
    }

    // Check for monitored videos first
    const { data: monitoredVideos, error: monitoredError } = await supabaseClient
      .from('youtube_monitored_videos')
      .select('video_id')
      .eq('user_id', user_id);

    let videoIds: string[] = [];

    if (monitoredVideos && monitoredVideos.length > 0) {
      // Use monitored videos if they exist
      videoIds = monitoredVideos.map((v: any) => v.video_id);
      console.log(`Processing ${videoIds.length} monitored videos for user ${user_id}`);
    } else {
      // Fall back to latest 5 videos if no monitored videos
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=5&order=date`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        }
      );

      const videosData = await videosResponse.json();
      
      if (!videosData.items || videosData.items.length === 0) {
        console.log(`No videos found for user ${user_id}`);
        return;
      }

      videoIds = videosData.items.map((video: any) => video.id.videoId);
      console.log(`Processing ${videoIds.length} recent videos for user ${user_id}`);
    }

    // Process comments for each video
    for (const videoId of videoIds) {
      await processVideoComments(
        supabaseClient,
        user_id,
        videoId,
        accessToken,
        setting
      );
    }

  } catch (error) {
    console.error(`Error processing comments for user ${user_id}:`, error);
  }
}

async function processVideoComments(
  supabaseClient: any,
  userId: string,
  videoId: string,
  accessToken: string,
  setting: any
) {
  try {
    console.log(`Fetching comments for video ${videoId}`);
    
    // Fetch comments
    const commentsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&order=time`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }
    );

    const commentsData = await commentsResponse.json();
    
    console.log(`YouTube API response for ${videoId}:`, JSON.stringify(commentsData).substring(0, 200));

    if (!commentsData.items || commentsData.items.length === 0) {
      console.log(`No comments found for video ${videoId}`);
      return;
    }
    
    console.log(`Found ${commentsData.items.length} comments for video ${videoId}`);

    for (const item of commentsData.items) {
      const comment = item.snippet.topLevelComment.snippet;
      const commentId = item.snippet.topLevelComment.id;

      // Check if already processed
      const { data: existing } = await supabaseClient
        .from('youtube_comment_logs')
        .select('id')
        .eq('comment_id', commentId)
        .single();

      if (existing) {
        continue;
      }

      // Check comment length
      if (comment.textDisplay.length < setting.min_comment_length) {
        await supabaseClient.from('youtube_comment_logs').insert({
          user_id: userId,
          video_id: videoId,
          comment_id: commentId,
          comment_text: comment.textDisplay,
          status: 'skipped',
          skip_reason: 'Comment too short',
        });
        continue;
      }

      // Check blacklist
      const hasBlacklistedWord = setting.blacklist_keywords?.some((keyword: string) =>
        comment.textDisplay.toLowerCase().includes(keyword.toLowerCase())
      );

      if (hasBlacklistedWord) {
        await supabaseClient.from('youtube_comment_logs').insert({
          user_id: userId,
          video_id: videoId,
          comment_id: commentId,
          comment_text: comment.textDisplay,
          status: 'skipped',
          skip_reason: 'Contains blacklisted keyword',
        });
        continue;
      }

      // Generate AI reply
      const reply = await generateReply(
        comment.textDisplay,
        setting.response_style,
        setting.custom_instructions
      );

      if (!reply) {
        await supabaseClient.from('youtube_comment_logs').insert({
          user_id: userId,
          video_id: videoId,
          comment_id: commentId,
          comment_text: comment.textDisplay,
          status: 'failed',
          skip_reason: 'Failed to generate reply',
        });
        continue;
      }

      // Post reply to YouTube
      try {
        const replyResponse = await fetch(
          'https://www.googleapis.com/youtube/v3/comments?part=snippet',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              snippet: {
                parentId: commentId,
                textOriginal: reply,
              },
            }),
          }
        );

        if (replyResponse.ok) {
          await supabaseClient.from('youtube_comment_logs').insert({
            user_id: userId,
            video_id: videoId,
            comment_id: commentId,
            comment_text: comment.textDisplay,
            reply_text: reply,
            status: 'replied',
            replied_at: new Date().toISOString(),
          });
          console.log(`Replied to comment ${commentId}`);
        } else {
          const errorData = await replyResponse.text();
          console.error('Failed to post reply:', errorData);
          await supabaseClient.from('youtube_comment_logs').insert({
            user_id: userId,
            video_id: videoId,
            comment_id: commentId,
            comment_text: comment.textDisplay,
            reply_text: reply,
            status: 'failed',
            skip_reason: `YouTube API error: ${errorData}`,
          });
        }
      } catch (error) {
        console.error('Error posting reply:', error);
        await supabaseClient.from('youtube_comment_logs').insert({
          user_id: userId,
          video_id: videoId,
          comment_id: commentId,
          comment_text: comment.textDisplay,
          reply_text: reply,
          status: 'failed',
          skip_reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

  } catch (error) {
    console.error(`Error processing video ${videoId}:`, error);
  }
}

async function generateReply(
  commentText: string,
  responseStyle: string,
  customInstructions?: string
): Promise<string | null> {
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return null;
    }

    const systemPrompt = `You are a helpful YouTube comment responder. Generate ${responseStyle} replies to comments.
${customInstructions ? `Additional instructions: ${customInstructions}` : ''}

Rules:
- Keep replies concise (1-3 sentences max)
- Be genuine and conversational
- Never be spammy or promotional
- Match the tone: ${responseStyle}
- Don't use emojis unless the comment has them
- Address the commenter's point directly`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a reply to this comment: "${commentText}"` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;

  } catch (error) {
    console.error('Error generating reply:', error);
    return null;
  }
}
