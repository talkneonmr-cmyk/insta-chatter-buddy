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
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageData } = requestBody;

    if (!imageData) {
      return new Response(
        JSON.stringify({ error: 'No image data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Detecting objects with Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image and detect all visible objects. For each object, identify its type and location.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'detect_objects',
              description: 'Return detected objects with their labels, confidence scores, and bounding box coordinates',
              parameters: {
                type: 'object',
                properties: {
                  detections: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        label: { type: 'string', description: 'Object name/type' },
                        score: { type: 'number', description: 'Confidence score between 0 and 1' },
                        box: {
                          type: 'object',
                          properties: {
                            xmin: { type: 'number', description: 'Left coordinate as percentage 0-100' },
                            ymin: { type: 'number', description: 'Top coordinate as percentage 0-100' },
                            xmax: { type: 'number', description: 'Right coordinate as percentage 0-100' },
                            ymax: { type: 'number', description: 'Bottom coordinate as percentage 0-100' }
                          },
                          required: ['xmin', 'ymin', 'xmax', 'ymax'],
                          additionalProperties: false
                        }
                      },
                      required: ['label', 'score', 'box'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['detections'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'detect_objects' } },
        max_completion_tokens: 2000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI API error: ${errorText}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== 'detect_objects') {
      throw new Error('No valid tool call in AI response');
    }

    console.log('AI Tool Call:', toolCall.function.arguments);

    let detections;
    try {
      const args = JSON.parse(toolCall.function.arguments);
      detections = args.detections || [];
    } catch (e) {
      console.error('Failed to parse tool call arguments:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown parse error';
      throw new Error(`Could not parse AI response: ${errorMessage}`);
    }

    // Sort by score
    detections = detections.sort((a: any, b: any) => b.score - a.score);

    console.log('Object detection complete:', detections.length, 'objects found');

    return new Response(
      JSON.stringify({ detections }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in detect-objects function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Object detection failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
