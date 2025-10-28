import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, duration = 30, instrumental = false } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const SONAUTO_API_KEY = Deno.env.get('SONAUTO_API_KEY');
    if (!SONAUTO_API_KEY) {
      throw new Error('SONAUTO_API_KEY is not configured');
    }

    console.log('Generating audio with prompt:', prompt);

    // Call Sonauto API to generate audio
    const response = await fetch('https://api.sonauto.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SONAUTO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        duration,
        instrumental,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sonauto API error:', response.status, errorText);
      throw new Error(`Sonauto API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Audio generated successfully');

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-audio function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
