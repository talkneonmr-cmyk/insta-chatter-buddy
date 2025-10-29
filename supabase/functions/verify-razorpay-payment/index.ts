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

    const { paymentLinkId } = await req.json();

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
      // Update user subscription
      const currentDate = new Date();
      const nextMonthDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));

      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          plan: 'pro',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: nextMonthDate.toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        throw updateError;
      }

      console.log('Subscription updated successfully for user:', user.id);

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
