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

    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    
    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

    // Create or get customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    let customerId: string;
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('razorpay_customer_id')
      .eq('user_id', user.id)
      .single();

    if (subscription?.razorpay_customer_id) {
      customerId = subscription.razorpay_customer_id;
    } else {
      // Create new customer
      const customerResponse = await fetch('https://api.razorpay.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile?.email || 'User',
          email: profile?.email,
        }),
      });

      if (!customerResponse.ok) {
        throw new Error('Failed to create Razorpay customer');
      }

      const customer = await customerResponse.json();
      customerId = customer.id;

      // Update subscription with customer ID
      await supabase
        .from('user_subscriptions')
        .update({ razorpay_customer_id: customerId })
        .eq('user_id', user.id);
    }

    // Create subscription plan (₹1900/month = ₹19 * 100)
    const subscriptionResponse = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: 'plan_pro', // You need to create this plan in Razorpay dashboard
        customer_id: customerId,
        total_count: 12, // 12 months
        quantity: 1,
        notes: {
          user_id: user.id,
        },
      }),
    });

    if (!subscriptionResponse.ok) {
      const error = await subscriptionResponse.json();
      throw new Error(error.error?.description || 'Failed to create subscription');
    }

    const razorpaySubscription = await subscriptionResponse.json();

    return new Response(
      JSON.stringify({ 
        subscriptionId: razorpaySubscription.id,
        shortUrl: razorpaySubscription.short_url 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating Razorpay subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});