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
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});