import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { nvidiaFallback, hasNvidia } from "../_shared/nvidia.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetadataRequest {
  videoTitle?: string;
  videoDescription?: string;
  videoContent?: string;
  tags?: string[];
  platform?: 'youtube' | 'instagram' | 'both';
  contentType?: 'long' | 'short';
  creatorSettings?: Record<string, unknown>;
  channelDna?: Record<string, unknown>;
  model?: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, init: RequestInit, retries = 3): Promise<Response> {
  let last: Response | undefined;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) return response;
      last = response;
    } catch (error) {
      if (attempt === retries - 1) throw error;
    }
    await sleep(700 * (attempt + 1));
  }
  return last!;
}

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

    const { videoTitle, videoDescription, videoContent, tags, platform = 'youtube', contentType = 'long', creatorSettings, channelDna, model = 'google/gemini-2.5-flash' }: MetadataRequest = requestBody;

    if (!videoTitle && !videoDescription && !videoContent) {
      return new Response(
        JSON.stringify({ error: 'At least one of videoTitle, videoDescription, or videoContent is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if ((videoTitle && videoTitle.length > 500) ||
        (videoDescription && videoDescription.length > 5000) ||
        (videoContent && videoContent.length > 10000) ||
        (tags && (!Array.isArray(tags) || tags.length > 50 || tags.some(t => typeof t !== 'string' || t.length > 100)))) {
      return new Response(
        JSON.stringify({ error: 'Input too large or invalid tags array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an elite AI creator operating system for YouTube and Instagram. Generate metadata that can be applied directly, using channel DNA, country, timezone, niche, audience countries, and platform behavior.
- YouTube titles must be engaging and under 100 characters
- YouTube descriptions must be SEO-optimized and practical
- Instagram captions must be native to Reels and include targeted hashtags
- Tags/hashtags must match niche, country, audience, and platform
- Best upload time must be a real recommendation, not generic, and include a short reason

Focus on maximizing discoverability, engagement, and click-through rates while maintaining authenticity.`;

    let userPrompt = 'Generate YouTube video metadata based on:\n';
    if (videoTitle) userPrompt += `\nProposed Title: ${videoTitle}`;
    if (videoDescription) userPrompt += `\nProposed Description: ${videoDescription}`;
    if (videoContent) userPrompt += `\nVideo Content Summary: ${videoContent}`;
    if (tags && tags.length > 0) userPrompt += `\nProposed Tags: ${tags.join(', ')}`;
    userPrompt += `\nPlatform Target: ${platform}\nContent Type: ${contentType}`;
    if (creatorSettings) userPrompt += `\nCreator Targeting Settings: ${JSON.stringify(creatorSettings)}`;
    if (channelDna) userPrompt += `\nChannel DNA: ${JSON.stringify(channelDna).slice(0, 6000)}`;

    userPrompt += `\n\nProvide your response in this exact JSON format:
{
  "title": "optimized video title",
  "description": "detailed SEO-optimized description with timestamps if applicable",
  "instagram_caption": "native Instagram Reel caption with hashtags",
  "tags": ["tag1", "tag2", "tag3", "..."],
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "best_upload_time_local": "HH:MM",
  "best_upload_day": "weekday name or today",
  "best_time_reason": "why this time fits this niche, audience, country, and platform",
  "category_suggestion": "category name (e.g., Education, Entertainment, Gaming)"
}`;

    console.log('Calling Lovable AI API with model:', model);

    const aiResponse = await fetchWithRetry('https://ai.gateway.lovable.dev/v1/chat/completions', {
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

    let aiMessage: string | undefined;

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);

      if (hasNvidia("8b") || hasNvidia("70b") || hasNvidia("nano")) {
        try {
          const nv = await nvidiaFallback({
            tiers: ["8b", "70b", "nano"],
            systemPrompt: systemPrompt + "\n\nIMPORTANT: Respond with raw JSON only, no markdown.",
            userPrompt,
            temperature: 0.6,
            maxTokens: 1500,
          });
          aiMessage = nv.choices[0]?.message?.content;
          // strip markdown fences if present
          if (aiMessage) aiMessage = aiMessage.replace(/```json\s*|\s*```/g, '').trim();
        } catch (e) {
          console.error('NVIDIA fallback failed:', e);
        }
      }

      if (!aiMessage) {
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
    } else {
      const aiData = await aiResponse.json();
      aiMessage = aiData.choices?.[0]?.message?.content;
    }

    if (!aiMessage) {
      throw new Error('No content in AI response');
    }

    console.log('AI Response:', aiMessage);

    const metadata = JSON.parse(aiMessage);

    return new Response(
      JSON.stringify({
        title: metadata.title || videoTitle,
        description: metadata.description || videoDescription,
        instagram_caption: metadata.instagram_caption || metadata.description || videoDescription,
        tags: metadata.tags || tags || [],
        hashtags: metadata.hashtags || [],
        best_upload_time_local: metadata.best_upload_time_local || '18:00',
        best_upload_day: metadata.best_upload_day || 'today',
        best_time_reason: metadata.best_time_reason || 'Evening audience activity window based on your targeting settings.',
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