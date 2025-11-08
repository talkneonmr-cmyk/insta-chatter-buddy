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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { videoId, applyChanges } = await req.json();
    console.log(`Optimizing video: ${videoId}, apply: ${applyChanges}`);

    // Fetch YouTube account
    const { data: account, error: accountError } = await supabase
      .from('youtube_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      throw new Error('YouTube account not connected');
    }

    // Refresh token if expired
    let accessToken = account.access_token;
    const tokenExpiry = new Date(account.token_expires_at);
    
    if (tokenExpiry <= new Date()) {
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

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh access token');
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      await supabase
        .from('youtube_accounts')
        .update({
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
        })
        .eq('id', account.id);
    }

    // Fetch video details and stats
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    const videoData = await videoResponse.json();
    const video = videoData.items[0];

    if (!video) {
      throw new Error('Video not found');
    }

    const currentTitle = video.snippet.title;
    const currentDescription = video.snippet.description;
    const currentTags = video.snippet.tags || [];
    const views = parseInt(video.statistics.viewCount || '0');
    const likes = parseInt(video.statistics.likeCount || '0');
    const comments = parseInt(video.statistics.commentCount || '0');

    // Use Lovable AI with tool calling for structured output
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a YouTube SEO expert. Analyze videos and suggest optimizations to improve performance, CTR, and engagement.'
          },
          {
            role: 'user',
            content: `Optimize this YouTube video:

Title: ${currentTitle}
Description: ${currentDescription}
Tags: ${currentTags.join(', ')}

Stats:
- Views: ${views}
- Likes: ${likes}
- Comments: ${comments}
- Engagement rate: ${views > 0 ? ((likes + comments) / views * 100).toFixed(2) : 0}%

Provide optimized versions with reasoning for each change.`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'optimize_video',
            description: 'Provide optimized video metadata',
            parameters: {
              type: 'object',
              properties: {
                optimizations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['title', 'description', 'tags'] },
                      original: { type: 'string' },
                      optimized: { type: 'string' },
                      reasoning: { type: 'string' }
                    },
                    required: ['type', 'original', 'optimized', 'reasoning']
                  }
                }
              },
              required: ['optimizations']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'optimize_video' } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('AI optimization failed');
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0].message.tool_calls[0];
    const optimizations = JSON.parse(toolCall.function.arguments).optimizations;

    // Store suggestions in database
    for (const opt of optimizations) {
      await supabase
        .from('optimization_suggestions')
        .insert({
          user_id: user.id,
          video_id: videoId,
          suggestion_type: opt.type,
          original_content: opt.original,
          suggested_content: opt.optimized,
          ai_reasoning: opt.reasoning,
          status: applyChanges ? 'applied' : 'pending',
        });
    }

    // Apply changes if requested
    if (applyChanges) {
      const snippet = { ...video.snippet };
      
      for (const opt of optimizations) {
        if (opt.type === 'title') {
          snippet.title = opt.optimized;
        } else if (opt.type === 'description') {
          snippet.description = opt.optimized;
        } else if (opt.type === 'tags') {
          snippet.tags = opt.optimized.split(',').map((t: string) => t.trim());
        }
      }

      const updateResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: videoId,
            snippet,
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error('Failed to apply optimizations to video');
      }

      // Update performance tracking
      await supabase
        .from('video_performance_tracking')
        .update({ optimization_applied: true })
        .eq('user_id', user.id)
        .eq('video_id', videoId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        optimizations,
        applied: applyChanges,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in auto-optimize-video:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});