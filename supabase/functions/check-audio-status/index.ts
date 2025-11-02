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
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { task_id } = requestBody;

    if (!task_id) {
      throw new Error('task_id is required');
    }

    const SONAUTO_API_KEY = Deno.env.get('SONAUTO_API_KEY');
    if (!SONAUTO_API_KEY) {
      throw new Error('SONAUTO_API_KEY is not configured');
    }

    console.log('Checking audio generation status for task:', task_id);

    // Check the status of the generation task
    const response = await fetch(`https://api.sonauto.ai/v1/generations/${task_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SONAUTO_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sonauto API error:', response.status, errorText);
      throw new Error(`Sonauto API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Audio generation status:', data.status);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in check-audio-status function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
