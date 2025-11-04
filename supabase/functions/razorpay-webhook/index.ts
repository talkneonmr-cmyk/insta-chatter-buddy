import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Handle GET requests (callback redirects after successful payment)
    if (req.method === 'GET') {
      // Extract origin to redirect back to the app
      const referer = req.headers.get('referer');
      let redirectUrl = 'https://lovable.app/payment-success';
      
      if (referer) {
        try {
          const refererUrl = new URL(referer);
          redirectUrl = `${refererUrl.protocol}//${refererUrl.host}/payment-success`;
        } catch (e) {
          console.error('Invalid referer URL:', e);
        }
      }
      
      // Return HTML that redirects the user
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>Payment Successful</title>
            <meta http-equiv="refresh" content="0;url=${redirectUrl}">
          </head>
          <body>
            <p>Payment successful! Redirecting...</p>
            <script>window.location.href="${redirectUrl}";</script>
          </body>
        </html>`,
        {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        }
      );
    }

    // Only accept POST webhooks for actual payment events
    if (req.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders,
      });
    }

    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
    const signature = req.headers.get('x-razorpay-signature');
    const body = await req.text();

    // Verify webhook signature
    if (webhookSecret && signature) {
      const expectedSignature = createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const event = JSON.parse(body);
    console.log('Webhook event:', event.event);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (event.event) {
      case 'payment.captured': {
        const payment = event.payload.payment.entity;
        const userId = payment.notes?.user_id;
        const plan = payment.notes?.plan;

        if (!userId || plan !== 'pro') {
          console.log('Payment received but no user_id or not pro plan');
          break;
        }

        // Upgrade user to Pro plan
        const currentDate = new Date();
        const nextMonthDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));

        await supabase
          .from('user_subscriptions')
          .update({
            plan: 'pro',
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: nextMonthDate.toISOString(),
          })
          .eq('user_id', userId);

        // Reset usage tracking for new pro user
        const { data: existingUsage } = await supabase
          .from('usage_tracking')
          .select('id')
          .eq('user_id', userId)
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
              reset_at: new Date().toISOString(),
            })
            .eq('user_id', userId);
        } else {
          await supabase
            .from('usage_tracking')
            .insert({
              user_id: userId,
              reset_at: new Date().toISOString(),
            });
        }

        console.log('User upgraded to Pro:', userId);
        break;
      }

      case 'subscription.activated':
      case 'subscription.charged': {
        const subscription = event.payload.subscription.entity;
        const userId = subscription.notes?.user_id;

        if (!userId) {
          console.error('No user_id in subscription notes');
          break;
        }

        await supabase
          .from('user_subscriptions')
          .update({
            plan: 'pro',
            status: 'active',
            razorpay_subscription_id: subscription.id,
            current_period_start: new Date(subscription.current_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_end * 1000).toISOString(),
          })
          .eq('user_id', userId);

        // Reset usage tracking for billing cycle
        const { data: existingUsage } = await supabase
          .from('usage_tracking')
          .select('id')
          .eq('user_id', userId)
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
              reset_at: new Date().toISOString(),
            })
            .eq('user_id', userId);
        } else {
          await supabase
            .from('usage_tracking')
            .insert({
              user_id: userId,
              reset_at: new Date().toISOString(),
            });
        }

        console.log('Subscription activated for user:', userId);
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.expired': {
        const subscription = event.payload.subscription.entity;
        const userId = subscription.notes?.user_id;

        if (!userId) {
          console.error('No user_id in subscription notes');
          break;
        }

        await supabase
          .from('user_subscriptions')
          .update({
            plan: 'free',
            status: 'cancelled',
          })
          .eq('user_id', userId);

        console.log('Subscription cancelled for user:', userId);
        break;
      }

      case 'payment.failed': {
        const payment = event.payload.payment.entity;
        console.log('Payment failed:', payment.id);
        break;
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});