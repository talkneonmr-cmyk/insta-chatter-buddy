import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OAuthCallbackRequest {
  code: string;
  state: string;
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
    if (req.method === 'POST' && body.code) {
      user = { id: body.state || body.userId };
    } else {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Unauthorized');
      }
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !authUser) {
        throw new Error('Unauthorized');
      }
      user = authUser;
    }

    // Generate OAuth URL
    if (url.pathname.endsWith('/auth-url')) {
      const clientId = Deno.env.get('INSTAGRAM_CLIENT_ID');
      const referer = req.headers.get('referer') || req.headers.get('origin') || '';
      const appUrl = new URL(referer);
      const redirectUri = `${appUrl.origin}/`;
      
      const authUrl = new URL('https://api.instagram.com/oauth/authorize');
      authUrl.searchParams.set('client_id', clientId!);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'user_profile,user_media');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('state', user.id);

      console.log('Instagram OAuth redirect URI:', redirectUri);

      return new Response(
        JSON.stringify({ authUrl: authUrl.toString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle OAuth callback
    if (req.method === 'POST' && body.code) {
      const { code } = body as OAuthCallbackRequest;

      const clientId = Deno.env.get('INSTAGRAM_CLIENT_ID');
      const clientSecret = Deno.env.get('INSTAGRAM_CLIENT_SECRET');
      const referer = req.headers.get('referer') || req.headers.get('origin') || '';
      const appUrl = new URL(referer);
      const redirectUri = `${appUrl.origin}/`;

      // Exchange code for access token
      const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
      }

      // Get long-lived token
      const longLivedResponse = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${tokenData.access_token}`
      );

      const longLivedData = await longLivedResponse.json();
      const accessToken = longLivedData.access_token || tokenData.access_token;
      const expiresIn = longLivedData.expires_in || 5184000; // 60 days default

      // Get user profile
      const profileResponse = await fetch(
        `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`
      );

      const profileData = await profileResponse.json();

      if (!profileData.id) {
        throw new Error('No Instagram user found');
      }

      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      // Store in database
      const { error: insertError } = await supabase
        .from('instagram_accounts')
        .upsert({
          user_id: user.id,
          instagram_user_id: profileData.id,
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
    return new Response(
      JSON.stringify({ error: 'An error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
