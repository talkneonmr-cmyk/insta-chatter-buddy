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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { paymentLinkId } = requestBody;

    if (!paymentLinkId) {
      throw new Error('Payment link ID required');
    }

    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    
    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

    // Fetch payment link details from Razorpay
    const paymentLinkResponse = await fetch(
      `https://api.razorpay.com/v1/payment_links/${paymentLinkId}`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      }
    );

    if (!paymentLinkResponse.ok) {
      throw new Error('Failed to fetch payment link');
    }

    const paymentLink = await paymentLinkResponse.json();
    console.log('Payment link status:', paymentLink.status);

    // Check if payment was successful
    if (paymentLink.status === 'paid') {
      // Compute period
      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(now.getMonth() + 1);

      // See if a subscription row exists
      const { data: existing, error: selErr } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (selErr) {
        console.error('Error checking existing subscription:', selErr);
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            plan: 'pro',
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: nextMonth.toISOString(),
          })
          .eq('user_id', user.id);
        if (updateError) throw updateError;

        // Reset usage tracking
        const { data: existingUsage } = await supabase
          .from('usage_tracking')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingUsage) {
          await supabase
            .from('usage_tracking')
            .update({
              video_uploads_count: 0,
              ai_captions_count: 0,
              ai_music_count: 0,
              ai_thumbnails_count: 0,
              ai_scripts_count: 0,
              ai_trends_count: 0,
              ai_seo_count: 0,
              ai_hashtags_count: 0,
              reset_at: now.toISOString(),
            })
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('usage_tracking')
            .insert({
              user_id: user.id,
              reset_at: now.toISOString(),
            });
        }
      } else {
        const { error: insertError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            plan: 'pro',
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: nextMonth.toISOString(),
          });
        if (insertError) throw insertError;
      }

      console.log('Subscription set to Pro for user:', user.id);

      return new Response(
        JSON.stringify({ 
          success: true,
          plan: 'pro',
          status: 'active'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Payment not completed yet',
          paymentStatus: paymentLink.status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
