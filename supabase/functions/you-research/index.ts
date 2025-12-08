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

    let endpoint = '';
    let body: any = {};

    switch (mode) {
      case 'search':
        // Web search with AI-powered results
        endpoint = 'https://api.you.com/search';
        body = {
          query,
          num_results: options?.limit || 10,
          country: options?.country || 'US',
          safesearch: 'moderate',
        };
        break;

      case 'research':
        // Deep research mode - AI-powered comprehensive research
        endpoint = 'https://api.you.com/smart';
        body = {
          query,
          instructions: options?.instructions || 'Provide comprehensive, well-researched information with sources.',
        };
        break;

      case 'news':
        // Real-time news search
        endpoint = 'https://api.you.com/search';
        body = {
          query: `${query} latest news`,
          num_results: options?.limit || 10,
          country: options?.country || 'US',
          recency: 'day', // Get recent results
        };
        break;

      case 'rag':
        // RAG mode for AI answers with citations
        endpoint = 'https://api.you.com/smart';
        body = {
          query,
          chat_mode: 'research',
          instructions: options?.instructions || 'Provide detailed analysis with citations and sources.',
        };
        break;

      default:
        endpoint = 'https://api.you.com/search';
        body = {
          query,
          num_results: 10,
        };
    }

    console.log(`Calling You.com API: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-API-Key': YOU_COM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`You.com API error: ${response.status} - ${errorText}`);
      
      // Fallback: Try the simple search endpoint with GET
      console.log('Trying fallback search endpoint...');
      const fallbackUrl = `https://api.you.com/search?query=${encodeURIComponent(query)}`;
      const fallbackResponse = await fetch(fallbackUrl, {
        method: 'GET',
        headers: {
          'X-API-Key': YOU_COM_API_KEY,
        },
      });

      if (!fallbackResponse.ok) {
        const fallbackError = await fallbackResponse.text();
        console.error(`Fallback also failed: ${fallbackResponse.status} - ${fallbackError}`);
        return new Response(
          JSON.stringify({ 
            error: 'You.com API request failed', 
            details: errorText,
            status: response.status 
          }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const fallbackData = await fallbackResponse.json();
      console.log('Fallback search successful');
      return new Response(
        JSON.stringify({ 
          success: true, 
          mode,
          data: fallbackData 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('You.com API response received successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        mode,
        data 
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
