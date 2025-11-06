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
    const { videoId } = await req.json();

    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'Video ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's settings
    const { data: setting, error: settingsError } = await supabaseClient
      .from('youtube_comment_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !setting || !setting.enabled) {
      return new Response(
        JSON.stringify({ error: 'Auto-responder not enabled' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's YouTube account
    const { data: account, error: accountError } = await supabaseClient
      .from('youtube_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      return new Response(
        JSON.stringify({ error: 'No YouTube account connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Process comments for this video
    const result = await processVideoComments(
      supabaseClient,
      user.id,
      videoId,
      accessToken,
      setting
    );

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in manual-check-comments:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processVideoComments(
  supabaseClient: any,
  userId: string,
  videoId: string,
  accessToken: string,
  setting: any
) {
  try {
    console.log(`Manual check: Fetching comments for video ${videoId}`);
    
    // Fetch comments
    const commentsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&order=time`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }
    );

    const commentsData = await commentsResponse.json();
    
    console.log(`YouTube API response:`, JSON.stringify(commentsData).substring(0, 200));

    if (!commentsData.items || commentsData.items.length === 0) {
      console.log(`No comments found for video ${videoId}`);
      return { processed: 0, replied: 0, skipped: 0 };
    }
    
    console.log(`Found ${commentsData.items.length} comments`);

    let processed = 0;
    let replied = 0;
    let skipped = 0;

    for (const item of commentsData.items) {
      const comment = item.snippet.topLevelComment.snippet;
      const commentId = item.snippet.topLevelComment.id;
      processed++;

      // Check if already processed
      const { data: existing } = await supabaseClient
        .from('youtube_comment_logs')
        .select('id')
        .eq('comment_id', commentId)
        .single();

      if (existing) {
        skipped++;
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
        skipped++;
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
        skipped++;
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
        skipped++;
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
          replied++;
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
          skipped++;
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
        skipped++;
      }
    }

    return { processed, replied, skipped };

  } catch (error) {
    console.error(`Error processing video ${videoId}:`, error);
    throw error;
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
