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

    // You.com Search API endpoint
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

    // Get the web results
    const webResults = data.results?.web || [];
    const newsResults = data.results?.news || [];
    
    // Combine content from all results for AI synthesis
    const combinedContent = webResults.slice(0, 8).map((result: any, idx: number) => {
      return `Source ${idx + 1}: ${result.title || 'Untitled'}
URL: ${result.url || 'N/A'}
Content: ${result.description || result.snippet || 'No content'}`;
    }).join('\n\n');

    // Generate AI synthesis using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    let aiSynthesis = '';
    
    if (LOVABLE_API_KEY && combinedContent) {
      try {
        console.log('Generating AI synthesis...');
        
        const aiResponse = await fetch('https://api.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai/gpt-5-mini',
            messages: [
              {
                role: 'system',
                content: `You are an expert research analyst and content synthesizer. Your task is to create a comprehensive, well-structured article based on search results.

FORMAT YOUR RESPONSE AS A COMPLETE ARTICLE WITH:
1. **A compelling headline/title** (on its own line, bold)
2. **An executive summary** (2-3 sentences capturing the key insight)
3. **Main content sections** with clear headers using markdown (##)
4. **Key takeaways** as a bulleted list
5. **Conclusion** with actionable insights

STYLE GUIDELINES:
- Write in a professional yet engaging tone
- Use clear, concise language
- Include specific facts, numbers, and examples from the sources
- Make it comprehensive but easy to scan
- Use markdown formatting for headers, bold, bullets, etc.
- Aim for 400-600 words of high-quality content
- DO NOT mention that you're synthesizing from sources - write as if you're the author
- DO NOT include source citations in the text itself`
              },
              {
                role: 'user',
                content: `Research Query: "${query}"

Based on these search results, create a comprehensive article:

${combinedContent}

Write an insightful, well-structured article that answers the query comprehensively.`
              }
            ],
            max_tokens: 2000,
            temperature: 0.7,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiSynthesis = aiData.choices?.[0]?.message?.content || '';
          console.log('AI synthesis generated successfully');
        } else {
          console.error('AI synthesis failed:', await aiResponse.text());
        }
      } catch (aiError) {
        console.error('Error generating AI synthesis:', aiError);
      }
    }

    // Collect source URLs for reference
    const sources = webResults.slice(0, 6).map((result: any) => ({
      title: result.title || 'Source',
      url: result.url || '',
    }));

    return new Response(
      JSON.stringify({ 
        success: true, 
        mode,
        data: {
          synthesis: aiSynthesis,
          sources: sources,
          query: query,
        }
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
