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

    const { videoId } = await req.json();
    console.log(`Analyzing performance for video: ${videoId || 'all videos'}`);

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
      console.log('Refreshing access token...');
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

    // Fetch videos with statistics
    let videosToAnalyze = [];
    
    if (videoId) {
      // Single video analysis
      const videoResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      const videoData = await videoResponse.json();
      videosToAnalyze = videoData.items || [];
    } else {
      // Analyze all channel videos (up to 50 most recent)
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${account.channel_id}&maxResults=50&order=date&type=video`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      const channelData = await channelResponse.json();
      const videoIds = (channelData.items || []).map((item: any) => item.id.videoId).join(',');
      
      if (videoIds) {
        const statsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        const statsData = await statsResponse.json();
        videosToAnalyze = statsData.items || [];
      }
    }

    // Calculate performance scores and store in database
    const performances = [];
    let totalScore = 0;

    for (const video of videosToAnalyze) {
      const views = parseInt(video.statistics.viewCount || '0');
      const likes = parseInt(video.statistics.likeCount || '0');
      const comments = parseInt(video.statistics.commentCount || '0');

      // Calculate engagement rate
      const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;
      
      // Performance score calculation (0-100)
      // Weight: Views (40%), Engagement (40%), Recency (20%)
      const viewScore = Math.min((views / 1000) * 10, 40); // Max 40 points
      const engagementScore = Math.min(engagementRate * 400, 40); // Max 40 points
      
      const publishedDate = new Date(video.snippet.publishedAt);
      const daysSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(20 - (daysSincePublished / 30), 0); // Decay over 30 days
      
      const performanceScore = Math.round(viewScore + engagementScore + recencyScore);
      totalScore += performanceScore;

      // Upsert performance data
      await supabase
        .from('video_performance_tracking')
        .upsert({
          user_id: user.id,
          video_id: video.id,
          video_title: video.snippet.title,
          views,
          likes,
          comments,
          performance_score: performanceScore,
          optimization_suggested: performanceScore < 40,
          last_checked: new Date().toISOString(),
        }, {
          onConflict: 'user_id,video_id'
        });

      performances.push({
        videoId: video.id,
        title: video.snippet.title,
        views,
        likes,
        comments,
        engagementRate: engagementRate.toFixed(2),
        performanceScore,
        needsOptimization: performanceScore < 40,
      });
    }

    const avgScore = videosToAnalyze.length > 0 ? Math.round(totalScore / videosToAnalyze.length) : 0;
    const underperforming = performances.filter(p => p.needsOptimization).length;

    return new Response(
      JSON.stringify({
        success: true,
        channelAvgScore: avgScore,
        totalVideos: videosToAnalyze.length,
        underperformingCount: underperforming,
        performances,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in analyze-video-performance:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});