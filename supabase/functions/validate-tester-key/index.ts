import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateTesterKeyRequest {
  keyCode: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { keyCode }: ValidateTesterKeyRequest = await req.json();

    if (!keyCode) {
      throw new Error('Tester key is required');
    }

    console.log('Validating tester key:', keyCode.substring(0, 8) + '...');

    // Check if the key exists and is active
    const { data: keyData, error: keyError } = await supabaseClient
      .from('tester_keys')
      .select('id, is_active, expires_at, usage_count')
      .eq('key_code', keyCode)
      .maybeSingle();

    if (keyError) {
      console.error('Error checking tester key:', keyError);
      throw new Error('Failed to validate tester key');
    }

    if (!keyData) {
      throw new Error('Invalid tester key');
    }

    if (!keyData.is_active) {
      throw new Error('This tester key has been deactivated');
    }

    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      throw new Error('This tester key has expired');
    }

    // Generate a session token
    const sessionToken = crypto.randomUUID();

    // Create a tester session
    const { error: sessionError } = await supabaseClient
      .from('tester_sessions')
      .insert({
        tester_key_id: keyData.id,
        session_token: sessionToken,
      });

    if (sessionError) {
      console.error('Error creating tester session:', sessionError);
      throw new Error('Failed to create tester session');
    }

    // Update key usage
    await supabaseClient
      .from('tester_keys')
      .update({
        usage_count: keyData.usage_count + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', keyData.id);

    console.log('Tester key validated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        sessionToken,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in validate-tester-key function:', err);
    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});