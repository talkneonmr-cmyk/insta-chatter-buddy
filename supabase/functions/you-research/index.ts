import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const YOU_COM_API_KEY = Deno.env.get('YOU_COM_API_KEY');
    if (!YOU_COM_API_KEY) {
      console.error('YOU_COM_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'You.com API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query, mode, options } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`You Research - Mode: ${mode}, Query: ${query}`);

    // Build the search URL with query parameters
    const searchParams = new URLSearchParams({
      query: query,
      count: String(options?.limit || 10),
    });

    // Add optional parameters
    if (options?.country) {
      searchParams.append('country', options.country);
    }

    // You.com Search API endpoint (correct domain without api. prefix)
    const endpoint = `https://ydc-index.io/v1/search?${searchParams.toString()}`;
    
    console.log(`Calling You.com API: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'X-API-Key': YOU_COM_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`You.com API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: 'You.com API request failed', 
          details: errorText,
          status: response.status 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('You.com API response received successfully');
    console.log('Response data:', JSON.stringify(data, null, 2));

    // Transform the response to a consistent format
    const transformedData = {
      hits: data.hits || [],
      news: data.news || [],
      answer: data.answer || null,
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        mode,
        data: transformedData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in you-research function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
