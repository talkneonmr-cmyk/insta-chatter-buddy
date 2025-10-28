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
    const { 
      prompt, 
      tags, 
      lyrics, 
      instrumental = false,
      num_songs = 1,
      output_format = 'mp3',
      bpm = null
    } = await req.json();

    // At least one of prompt, tags, or lyrics must be provided
    if (!prompt && !tags && !lyrics) {
      throw new Error('At least one of prompt, tags, or lyrics is required');
    }

    const SONAUTO_API_KEY = Deno.env.get('SONAUTO_API_KEY');
    if (!SONAUTO_API_KEY) {
      throw new Error('SONAUTO_API_KEY is not configured');
    }

    console.log('Generating audio with Sonauto API');

    // Call Sonauto API to start generation
    const response = await fetch('https://api.sonauto.ai/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SONAUTO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        tags,
        lyrics,
        instrumental,
        num_songs,
        output_format,
        bpm,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sonauto API error:', response.status, errorText);
      
      // Parse error message for better user feedback
      let errorMessage = `API error (${response.status})`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.detail && Array.isArray(errorData.detail)) {
          const details = errorData.detail.map((d: any) => d.msg).join(', ');
          errorMessage = details;
        }
      } catch {
        errorMessage = errorText;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Audio generation task created:', data.task_id);

    // Return the task_id so client can poll for status
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-audio function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
