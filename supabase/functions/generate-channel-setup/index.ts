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
    const { niche, targetAudience, contentType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log('Generating channel setup for:', { niche, targetAudience, contentType });

    const prompt = `You are a YouTube growth expert. Create a comprehensive viral-optimized channel setup for a ${niche} channel.

${targetAudience ? `Target Audience: ${targetAudience}` : ''}
${contentType ? `Content Type: ${contentType}` : ''}

Generate the following in a structured format:

1. CHANNEL NAMES: Create 5 catchy, memorable, and SEO-friendly channel name options that are unique and brandable. Make them viral-worthy and easy to remember.

2. CHANNEL DESCRIPTION: Write a compelling 150-200 word channel description that:
   - Hooks viewers immediately
   - Clearly states what the channel offers
   - Uses relevant keywords naturally
   - Includes a call-to-action
   - Feels authentic and engaging

3. SEO KEYWORDS: Provide 15-20 highly relevant keywords/tags that will help with discoverability. Include both broad and specific terms.

4. CONTENT STRATEGY: Outline a detailed content strategy for viral growth including:
   - Types of videos to create
   - Content pillars
   - Trending topics to cover
   - Engagement tactics
   - Collaboration opportunities

5. UPLOAD SCHEDULE: Recommend an optimal upload schedule with specific days and times, explaining why this schedule maximizes reach.

6. THUMBNAIL TIPS: Provide specific, actionable tips for creating viral thumbnails including:
   - Color schemes
   - Text usage
   - Facial expressions
   - Common viral thumbnail patterns

Format your response as a valid JSON object with these exact keys:
{
  "channelNames": ["name1", "name2", "name3", "name4", "name5"],
  "description": "channel description text",
  "keywords": ["keyword1", "keyword2", ...],
  "contentStrategy": "detailed strategy text",
  "uploadSchedule": "schedule recommendations text",
  "thumbnailTips": "thumbnail tips text"
}

Make it highly specific to the ${niche} niche and designed for maximum viral potential.`;

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
            content: prompt
          }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('AI Response:', content);

    // Parse the JSON from the response
    let setup;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      setup = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      throw new Error('Failed to parse AI response');
    }

    return new Response(
      JSON.stringify({ setup }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in generate-channel-setup function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
