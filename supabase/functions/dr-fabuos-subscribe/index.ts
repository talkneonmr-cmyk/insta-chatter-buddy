import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    const { planType } = await req.json(); // 'trial' | 'pro'
    const amount = planType === 'pro' ? 39900 : 9900; // ₹399 or ₹99 (paise)
    const description = planType === 'pro'
      ? 'Dr. Fabuos AI — Monthly Subscription (₹399)'
      : 'Dr. Fabuos AI — 1 Month Trial (₹99)';

    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) throw new Error('Razorpay credentials not configured');
    const auth = btoa(`${keyId}:${keySecret}`);

    const { data: profile } = await supabase
      .from('profiles').select('email').eq('id', user.id).maybeSingle();
    const email = profile?.email || user.email || 'user@example.com';

    const baseUrl = req.headers.get('origin') || 'https://fabuos.com';
    const callbackUrl = `${baseUrl}/dr-fabuos?dr_payment=1`;

    const resp = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        description,
        customer: { name: email, email },
        notify: { email: true },
        reminder_enable: true,
        callback_url: callbackUrl,
        callback_method: 'get',
        notes: { user_id: user.id, product: 'dr_fabuos', plan: planType === 'pro' ? 'pro' : 'trial' },
      }),
    });

    if (!resp.ok) {
      const err = await resp.json();
      console.error('Razorpay error', err);
      throw new Error(err.error?.description || 'Failed to create payment link');
    }
    const link = await resp.json();
    return new Response(JSON.stringify({ paymentLinkId: link.id, shortUrl: link.short_url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('dr-fabuos-subscribe error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
