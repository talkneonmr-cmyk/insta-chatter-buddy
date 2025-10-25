import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CaptionRequest {
  reelIdea: string;
  contentType?: 'reel' | 'post' | 'story';
  targetAudience?: string;
  brandVoice?: 'professional' | 'casual' | 'humorous' | 'inspiring' | 'friendly';
  includeHashtags?: boolean;
  includeEmojis?: boolean;
  captionLength?: 'short' | 'medium' | 'long';
  model?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const {
      reelIdea,
      contentType = 'reel',
      targetAudience = 'general audience',
      brandVoice = 'friendly',
      includeHashtags = true,
      includeEmojis = true,
      captionLength = 'medium',
      model = 'google/gemini-2.5-flash'
    }: CaptionRequest = await req.json();

    if (!reelIdea || reelIdea.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Reel idea is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lengthGuide = {
      short: 'under 100 characters',
      medium: 'between 100-200 characters',
      long: 'between 200-300 characters'
    };

    const systemPrompt = `You are an expert Instagram content creator and viral marketing specialist. Your task is to generate high-performing, engaging captions for Instagram ${contentType}s.

BRAND VOICE: ${brandVoice}
TARGET AUDIENCE: ${targetAudience}
CAPTION LENGTH: ${lengthGuide[captionLength]}

Generate a complete caption package that includes:
1. A hook line (first 1-2 sentences to grab attention)
2. Main caption (engaging, value-driven, storytelling)
3. Call-to-action (encourage engagement)
${includeHashtags ? '4. 10-15 relevant hashtags (mix of popular and niche)' : ''}
${includeEmojis ? '5. Strategic emoji placement (2-4 emojis max for professionalism)' : ''}

VIRAL FORMULA TO FOLLOW:
- Start with a pattern interrupt (question, bold statement, or curiosity gap)
- Provide value or entertainment
- Create emotional connection
- End with clear call-to-action
- Use line breaks for readability
- ${includeEmojis ? 'Use emojis to enhance (not overwhelm)' : 'No emojis'}

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "caption": "full caption with line breaks",
  "hookLine": "attention-grabbing opening line",
  "callToAction": "specific engagement prompt",
  "hashtags": ["hashtag1", "hashtag2", ...],
  "emojiSuggestions": ["😊", "🚀", ...],
  "description": "brief explanation of why this caption works"
}`;

    const userPrompt = `Create a viral Instagram ${contentType} caption for this idea:

"${reelIdea}"

Make it ${brandVoice}, targeted at ${targetAudience}, and optimized for maximum engagement.`;

    console.log('Calling Lovable AI with model:', model);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 1000
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    let resultText = aiData.choices?.[0]?.message?.content;

    if (!resultText) {
      throw new Error('No response from AI');
    }

    console.log('Raw AI response:', resultText);

    // Parse JSON (handle potential markdown code blocks)
    resultText = resultText.trim();
    if (resultText.startsWith('```json')) {
      resultText = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (resultText.startsWith('```')) {
      resultText = resultText.replace(/```\n?/g, '');
    }

    const parsedResult = JSON.parse(resultText);
    const processingTime = Date.now() - startTime;

    const response = {
      success: true,
      data: {
        caption: parsedResult.caption,
        hookLine: parsedResult.hookLine,
        callToAction: parsedResult.callToAction,
        hashtags: parsedResult.hashtags || [],
        emojiSuggestions: parsedResult.emojiSuggestions || [],
        description: parsedResult.description,
        metadata: {
          model: model,
          processingTime: processingTime,
          contentType: contentType,
          brandVoice: brandVoice
        }
      }
    };

    console.log('Caption generated successfully:', processingTime + 'ms');

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-caption:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate caption',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
