import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await admin.auth.getUser(token);
    if (userError || !user) throw new Error('Unauthorized');

    const { paymentLinkId } = await req.json();
    if (!paymentLinkId) throw new Error('Payment link ID required');

    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) throw new Error('Razorpay credentials not configured');
    const auth = btoa(`${keyId}:${keySecret}`);

    const resp = await fetch(`https://api.razorpay.com/v1/payment_links/${paymentLinkId}`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!resp.ok) throw new Error('Failed to fetch payment link');
    const link = await resp.json();

    if (link.status !== 'paid') {
      return new Response(JSON.stringify({ success: false, paymentStatus: link.status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify ownership via notes
    if (link.notes?.user_id && link.notes.user_id !== user.id) {
      throw new Error('Payment does not belong to this user');
    }
    if (link.notes?.product !== 'dr_fabuos') {
      throw new Error('Not a Dr. Fabuos payment');
    }

    const plan = link.notes?.plan === 'pro' ? 'pro' : 'trial';
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 30);

    const { data: existing } = await admin
      .from('dr_fabuos_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      await admin.from('dr_fabuos_subscriptions').update({
        plan, status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: end.toISOString(),
      }).eq('user_id', user.id);
    } else {
      await admin.from('dr_fabuos_subscriptions').insert({
        user_id: user.id, plan, status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: end.toISOString(),
      });
    }

    return new Response(JSON.stringify({ success: true, plan }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('dr-fabuos-verify error', e);
    return new Response(JSON.stringify({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
