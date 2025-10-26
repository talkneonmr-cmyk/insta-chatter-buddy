import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { usageType } = await req.json();

    // Get current usage
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!usage) {
      throw new Error('Usage tracking not found');
    }

    // Increment the appropriate counter
    let updateData: any = {};
    switch (usageType) {
      case 'video_upload':
        updateData = { video_uploads_count: usage.video_uploads_count + 1 };
        break;
      case 'ai_caption':
        updateData = { ai_captions_count: usage.ai_captions_count + 1 };
        break;
      case 'youtube_channel':
        updateData = { youtube_channels_count: usage.youtube_channels_count + 1 };
        break;
      default:
        throw new Error('Invalid usage type');
    }

    const { error: updateError } = await supabase
      .from('usage_tracking')
      .update(updateData)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error incrementing usage:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});