import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OAuthCallbackRequest {
  code: string;
  state: string;
  redirectOrigin?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function fetchWithRetry(url: string, init?: RequestInit, tries = 3): Promise<Response> {
  let last: Response | undefined;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, init);
      if (res.ok || (res.status >= 400 && res.status < 500)) return res;
      last = res;
    } catch (e) {
      if (i === tries - 1) throw e;
    }
    await sleep(500 * (i + 1));
  }
  return last!;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};

    let user;
    let issuedState: string | null = null;
    if (req.method === 'POST' && body.code) {
      const stateValue = body.state;
      if (!stateValue || typeof stateValue !== 'string') throw new Error('Missing OAuth state');
      const { data: stateRow, error: stateErr } = await supabase
        .from('oauth_states')
        .select('user_id, expires_at')
        .eq('state', stateValue)
        .eq('provider', 'instagram')
        .maybeSingle();
      if (stateErr || !stateRow) throw new Error('Invalid OAuth state');
      if (new Date(stateRow.expires_at).getTime() < Date.now()) {
        await supabase.from('oauth_states').delete().eq('state', stateValue);
        throw new Error('OAuth state expired');
      }
      await supabase.from('oauth_states').delete().eq('state', stateValue);
      user = { id: stateRow.user_id };
    } else {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('Unauthorized');
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !authUser) throw new Error('Unauthorized');
      user = authUser;
      issuedState = crypto.randomUUID();
      await supabase.from('oauth_states').insert({
        state: issuedState,
        user_id: user.id,
        provider: 'instagram',
      });
    }

    // ---- Generate OAuth URL (Instagram Login flow) ----
    if (url.pathname.endsWith('/auth-url')) {
      const clientId = Deno.env.get('INSTAGRAM_CLIENT_ID');
      const referer = req.headers.get('referer') || req.headers.get('origin') || '';
      const redirectOrigin = body.redirectOrigin || (referer ? new URL(referer).origin : '');
      if (!redirectOrigin) throw new Error('Unable to determine redirect origin');
      const redirectUri = `${redirectOrigin}/youtube-manager`;

      const authUrl = new URL('https://www.instagram.com/oauth/authorize');
      authUrl.searchParams.set('client_id', clientId!);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_comments,instagram_business_manage_messages');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('state', issuedState!);

      console.log('Instagram OAuth redirect URI:', redirectUri);

      return new Response(
        JSON.stringify({ authUrl: authUrl.toString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ---- Handle OAuth callback ----
    if (req.method === 'POST' && body.code) {
      const { code } = body as OAuthCallbackRequest;
      const clientId = Deno.env.get('INSTAGRAM_CLIENT_ID')!;
      const clientSecret = Deno.env.get('INSTAGRAM_CLIENT_SECRET')!;
      const referer = req.headers.get('referer') || req.headers.get('origin') || '';
      const redirectOrigin = body.redirectOrigin || (referer ? new URL(referer).origin : '');
      if (!redirectOrigin) throw new Error('Unable to determine redirect origin');
      const redirectUri = `${redirectOrigin}/youtube-manager`;

      // Step 1: Exchange code for SHORT-lived access token (form-encoded POST)
      const form = new FormData();
      form.append('client_id', clientId);
      form.append('client_secret', clientSecret);
      form.append('grant_type', 'authorization_code');
      form.append('redirect_uri', redirectUri);
      form.append('code', code.replace(/#_$/, ''));

      const shortRes = await fetchWithRetry('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        body: form,
      });
      const shortData = await shortRes.json();
      console.log('Short-lived token response:', shortData);
      if (!shortRes.ok || !shortData.access_token) {
        throw new Error(`Token exchange failed: ${JSON.stringify(shortData)}`);
      }
      const shortToken = shortData.access_token;
      const igUserId = String(shortData.user_id);

      // Step 2: Exchange short for LONG-lived (60 days)
      const longRes = await fetchWithRetry(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(clientSecret)}&access_token=${encodeURIComponent(shortToken)}`
      );
      const longData = await longRes.json();
      console.log('Long-lived token response:', longData);
      if (!longRes.ok || !longData.access_token) {
        throw new Error(`Long-lived token exchange failed: ${JSON.stringify(longData)}`);
      }
      const accessToken = longData.access_token as string;
      const expiresIn = (longData.expires_in as number) ?? 60 * 24 * 60 * 60;
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      // Step 3: Get profile
      const profileRes = await fetchWithRetry(
        `https://graph.instagram.com/v21.0/me?fields=user_id,username&access_token=${encodeURIComponent(accessToken)}`
      );
      const profileData = await profileRes.json();
      console.log('Profile response:', profileData);
      if (!profileData.username) {
        throw new Error(`Failed to get Instagram profile: ${JSON.stringify(profileData)}`);
      }

      const { error: insertError } = await supabase
        .from('instagram_accounts')
        .upsert({
          user_id: user.id,
          instagram_user_id: igUserId,
          username: profileData.username,
          access_token: accessToken,
          token_expires_at: expiresAt.toISOString(),
        });
      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({ success: true, username: profileData.username }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Instagram OAuth error:', error);
    const msg = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
