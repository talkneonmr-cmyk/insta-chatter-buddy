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

    const { videoIds, operation } = await req.json();
    console.log(`Bulk operation: ${operation.type} for ${videoIds.length} videos`);

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

    // Process bulk operation
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const videoId of videoIds) {
      try {
        // Fetch current video details
        const videoResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${videoId}`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          }
        );

        if (!videoResponse.ok) {
          throw new Error(`Failed to fetch video ${videoId}`);
        }

        const videoData = await videoResponse.json();
        const video = videoData.items[0];
        
        if (!video) {
          throw new Error(`Video ${videoId} not found`);
        }

        // Prepare updated snippet based on operation type
        const snippet = { ...video.snippet };
        const status = { ...video.status };
        let wasModified = false;

        switch (operation.type) {
          case 'findReplace':
            if (operation.target === 'title' || operation.target === 'both') {
              const newTitle = snippet.title.split(operation.find).join(operation.replace);
              if (newTitle !== snippet.title) {
                snippet.title = newTitle;
                wasModified = true;
              }
            }
            if (operation.target === 'description' || operation.target === 'both') {
              const newDesc = snippet.description.split(operation.find).join(operation.replace);
              if (newDesc !== snippet.description) {
                snippet.description = newDesc;
                wasModified = true;
              }
            }
            break;

          case 'appendText':
            if (operation.target === 'title') {
              snippet.title = `${snippet.title}${operation.text}`;
              wasModified = true;
            } else if (operation.target === 'description') {
              snippet.description = `${snippet.description}\n\n${operation.text}`;
              wasModified = true;
            }
            break;

          case 'prependText':
            if (operation.target === 'title') {
              snippet.title = `${operation.text}${snippet.title}`;
              wasModified = true;
            } else if (operation.target === 'description') {
              snippet.description = `${operation.text}\n\n${snippet.description}`;
              wasModified = true;
            }
            break;

          case 'changePrivacy':
            status.privacyStatus = operation.privacyStatus;
            wasModified = true;
            break;

          case 'addTags':
            const currentTags = snippet.tags || [];
            const newTags = operation.tags.filter((tag: string) => !currentTags.includes(tag));
            if (newTags.length > 0) {
              snippet.tags = [...currentTags, ...newTags];
              wasModified = true;
            }
            break;

          case 'removeTags':
            if (snippet.tags && snippet.tags.length > 0) {
              const filteredTags = snippet.tags.filter((tag: string) => !operation.tags.includes(tag));
              if (filteredTags.length !== snippet.tags.length) {
                snippet.tags = filteredTags;
                wasModified = true;
              }
            }
            break;
        }

        // Only update if something changed
        if (wasModified) {
          const updateResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,status`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: videoId,
                snippet,
                status,
              }),
            }
          );

          if (!updateResponse.ok) {
            const error = await updateResponse.text();
            throw new Error(`Update failed: ${error}`);
          }

          successCount++;
          results.push({ videoId, status: 'success' });
        } else {
          results.push({ videoId, status: 'skipped', reason: 'No changes needed' });
        }
      } catch (error: any) {
        console.error(`Error processing video ${videoId}:`, error);
        failureCount++;
        results.push({ 
          videoId, 
          status: 'failed', 
          error: error?.message || 'Unknown error'
        });
      }
    }

    // Log bulk operation
    await supabase.from('bulk_operation_logs').insert({
      user_id: user.id,
      operation_type: operation.type,
      videos_affected: videoIds.length,
      success_count: successCount,
      failure_count: failureCount,
      details: { operation, results },
    });

    return new Response(
      JSON.stringify({
        success: true,
        total: videoIds.length,
        successCount,
        failureCount,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in youtube-bulk-update:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});