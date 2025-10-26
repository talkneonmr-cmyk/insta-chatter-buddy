import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetadataRequest {
  videoTitle?: string;
  videoDescription?: string;
  videoContent?: string;
  tags?: string[];
  model?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoTitle, videoDescription, videoContent, tags, model = 'google/gemini-2.5-flash' }: MetadataRequest = await req.json();

    if (!videoTitle && !videoDescription && !videoContent) {
      return new Response(
        JSON.stringify({ error: 'At least one of videoTitle, videoDescription, or videoContent is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert YouTube content strategist and SEO specialist. Generate optimized metadata for YouTube videos including:
- Engaging, click-worthy titles (max 100 characters)
- SEO-optimized descriptions (detailed but concise)
- Relevant, high-ranking tags (mix of broad and specific)

Focus on maximizing discoverability, engagement, and click-through rates while maintaining authenticity.`;

    let userPrompt = 'Generate YouTube video metadata based on:\n';
    if (videoTitle) userPrompt += `\nProposed Title: ${videoTitle}`;
    if (videoDescription) userPrompt += `\nProposed Description: ${videoDescription}`;
    if (videoContent) userPrompt += `\nVideo Content Summary: ${videoContent}`;
    if (tags && tags.length > 0) userPrompt += `\nProposed Tags: ${tags.join(', ')}`;

    userPrompt += `\n\nProvide your response in this exact JSON format:
{
  "title": "optimized video title",
  "description": "detailed SEO-optimized description with timestamps if applicable",
  "tags": ["tag1", "tag2", "tag3", "..."],
  "category_suggestion": "category name (e.g., Education, Entertainment, Gaming)"
}`;

    console.log('Calling Lovable AI API with model:', model);

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
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Too many requests. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to generate metadata. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices?.[0]?.message?.content;

    if (!aiMessage) {
      throw new Error('No content in AI response');
    }

    console.log('AI Response:', aiMessage);

    const metadata = JSON.parse(aiMessage);

    return new Response(
      JSON.stringify({
        title: metadata.title || videoTitle,
        description: metadata.description || videoDescription,
        tags: metadata.tags || tags || [],
        category_suggestion: metadata.category_suggestion || 'Entertainment',
        ai_model_used: model
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-video-metadata function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate metadata. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});