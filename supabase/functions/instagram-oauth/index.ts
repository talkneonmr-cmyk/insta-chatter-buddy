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

    // Generate OAuth URL - Using Facebook OAuth for Instagram Graph API
    if (url.pathname.endsWith('/auth-url')) {
      const clientId = Deno.env.get('INSTAGRAM_CLIENT_ID'); // This should be your Facebook App ID
      const referer = req.headers.get('referer') || req.headers.get('origin') || '';
      const appUrl = new URL(referer);
      const redirectUri = `${appUrl.origin}/`;
      
      // Use Facebook OAuth with Instagram permissions
      const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
      authUrl.searchParams.set('client_id', clientId!);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'instagram_basic,instagram_content_publish,pages_read_engagement,pages_manage_metadata');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('state', user.id);

      console.log('Instagram OAuth redirect URI:', redirectUri);
      console.log('Generated auth URL:', authUrl.toString());

      return new Response(
        JSON.stringify({ authUrl: authUrl.toString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle OAuth callback
    if (req.method === 'POST' && body.code) {
      const { code } = body as OAuthCallbackRequest;

      const clientId = Deno.env.get('INSTAGRAM_CLIENT_ID'); // Facebook App ID
      const clientSecret = Deno.env.get('INSTAGRAM_CLIENT_SECRET'); // Facebook App Secret
      const referer = req.headers.get('referer') || req.headers.get('origin') || '';
      const appUrl = new URL(referer);
      const redirectUri = `${appUrl.origin}/`;

      console.log('Exchanging code for token...');

      // Exchange code for Facebook access token
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
      );

      const tokenData = await tokenResponse.json();
      console.log('Token response:', tokenData);

      if (!tokenResponse.ok || tokenData.error) {
        throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
      }

      const accessToken = tokenData.access_token;

      // Get user's Facebook pages
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
      );

      const pagesData = await pagesResponse.json();
      console.log('Pages response:', pagesData);

      if (!pagesData.data || pagesData.data.length === 0) {
        throw new Error('No Facebook Pages found. You need a Facebook Page connected to your Instagram Business account.');
      }

      // Get the first page (you might want to let users choose)
      const pageId = pagesData.data[0].id;
      const pageAccessToken = pagesData.data[0].access_token;

      // Get Instagram Business Account connected to this page
      const igAccountResponse = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
      );

      const igAccountData = await igAccountResponse.json();
      console.log('IG Account response:', igAccountData);

      if (!igAccountData.instagram_business_account) {
        throw new Error('No Instagram Business Account connected to your Facebook Page.');
      }

      const instagramAccountId = igAccountData.instagram_business_account.id;

      // Get Instagram account details
      const profileResponse = await fetch(
        `https://graph.facebook.com/v18.0/${instagramAccountId}?fields=id,username&access_token=${pageAccessToken}`
      );

      const profileData = await profileResponse.json();
      console.log('Profile response:', profileData);

      if (!profileData.id) {
        throw new Error('Failed to get Instagram profile');
      }

      // Long-lived tokens last 60 days for Instagram
      const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

      // Store in database
      const { error: insertError } = await supabase
        .from('instagram_accounts')
        .upsert({
          user_id: user.id,
          instagram_user_id: profileData.id,
          username: profileData.username,
          access_token: pageAccessToken,
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
