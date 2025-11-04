import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Get YouTube account
    const { data: ytAccount, error: ytError } = await supabaseClient
      .from('youtube_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (ytError || !ytAccount) {
      throw new Error('YouTube account not connected');
    }

    // Fetch channel statistics from YouTube Data API
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${ytAccount.channel_id}`,
      {
        headers: {
          Authorization: `Bearer ${ytAccount.access_token}`,
        },
      }
    );

    if (!channelResponse.ok) {
      const errorData = await channelResponse.text();
      console.error('YouTube API error:', errorData);
      throw new Error('Failed to fetch channel data');
    }

    const channelData = await channelResponse.json();
    const channel = channelData.items?.[0];

    if (!channel) {
      throw new Error('Channel not found');
    }

    const statistics = {
      viewCount: parseInt(channel.statistics.viewCount),
      subscriberCount: parseInt(channel.statistics.subscriberCount),
      videoCount: parseInt(channel.statistics.videoCount),
      channelTitle: channel.snippet.title,
      thumbnail: channel.snippet.thumbnails.default.url,
    };

    // Fetch recent videos performance
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${ytAccount.channel_id}&order=date&maxResults=5&type=video`,
      {
        headers: {
          Authorization: `Bearer ${ytAccount.access_token}`,
        },
      }
    );

    let recentVideos = [];
    if (videosResponse.ok) {
      const videosData = await videosResponse.json();
      recentVideos = videosData.items?.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.default.url,
        publishedAt: item.snippet.publishedAt,
      })) || [];
    }

    return new Response(
      JSON.stringify({ statistics, recentVideos }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});