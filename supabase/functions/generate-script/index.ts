import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { videoTopic, videoLength, tone, targetAudience, title } = await req.json();
    console.log('Generating script for topic:', videoTopic);

    const startTime = Date.now();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Check usage limit
    const { data: limitCheck } = await supabase.functions.invoke('check-usage-limit', {
      body: { usageType: 'ai_scripts' }
    });

    if (!limitCheck?.allowed) {
      return new Response(
        JSON.stringify({ error: 'Usage limit reached. Please upgrade to Pro for more scripts.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build comprehensive prompt
    const systemPrompt = `You are an expert YouTube script writer. Create engaging, well-structured video scripts that captivate audiences and drive engagement. Focus on:
1. Strong hooks that grab attention in the first 5 seconds
2. Clear structure with smooth transitions
3. Natural, conversational language
4. Strategic CTAs (Call-to-Actions)
5. Timestamps for better navigation`;

    const userPrompt = `Create a YouTube video script with these specifications:

Topic: ${videoTopic}
Length: ${videoLength}
Tone: ${tone}
Target Audience: ${targetAudience || 'General audience'}

Format your response as a structured script with:
1. HOOK (first 5 seconds - make it attention-grabbing)
2. INTRODUCTION (set expectations, build credibility)
3. MAIN CONTENT (3-5 key points with smooth transitions)
4. CALL-TO-ACTION (encourage likes, comments, subscriptions)
5. TIMESTAMPS (suggested time markers for each section)
6. B-ROLL SUGGESTIONS (visual elements to enhance the video)

Make it engaging, authentic, and optimized for YouTube's algorithm.`;

    // Generate script using Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
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
          JSON.stringify({ error: 'AI credits depleted. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI generation failed: ${errorText}`);
    }

    const data = await response.json();
    const scriptContent = data.choices?.[0]?.message?.content;

    if (!scriptContent) {
      throw new Error('No script generated');
    }

    // Parse script into structured format
    const hookMatch = scriptContent.match(/HOOK[\s\S]*?:([\s\S]*?)(?=INTRODUCTION|$)/i);
    const ctaMatch = scriptContent.match(/CALL[- ]TO[- ]ACTION[\s\S]*?:([\s\S]*?)(?=TIMESTAMPS|$)/i);
    const timestampsMatch = scriptContent.match(/TIMESTAMPS[\s\S]*?:([\s\S]*?)(?=B-ROLL|$)/i);

    const hook = hookMatch ? hookMatch[1].trim() : '';
    const callToAction = ctaMatch ? ctaMatch[1].trim() : '';
    
    // Extract timestamps
    const timestampsText = timestampsMatch ? timestampsMatch[1].trim() : '';
    const timestamps = timestampsText
      .split('\n')
      .filter((line: string) => line.trim())
      .map((line: string) => {
        const match = line.match(/(\d+:\d+)\s*[-–]\s*(.+)/);
        if (match) {
          return { time: match[1], description: match[2].trim() };
        }
        return null;
      })
      .filter(Boolean);

    // Extract key points
    const mainContentMatch = scriptContent.match(/MAIN CONTENT[\s\S]*?:([\s\S]*?)(?=CALL-TO-ACTION|$)/i);
    const mainContent = mainContentMatch ? mainContentMatch[1].trim() : '';
    const keyPoints = mainContent
      .split(/\d+\.|•/)
      .filter((point: string) => point.trim().length > 20)
      .map((point: string) => point.trim());

    const generationTime = Date.now() - startTime;

    // Save to database
    const { data: script, error: dbError } = await supabase
      .from('generated_scripts')
      .insert({
        user_id: user.id,
        title: title || `${videoTopic.substring(0, 50)} Script`,
        video_topic: videoTopic,
        video_length: videoLength,
        tone,
        target_audience: targetAudience || 'General audience',
        script_content: scriptContent,
        hook,
        key_points: keyPoints,
        call_to_action: callToAction,
        timestamps,
        generation_time_ms: generationTime,
        ai_model_used: 'google/gemini-2.5-flash'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to save script: ${dbError.message}`);
    }

    // Increment usage
    await supabase.functions.invoke('increment-usage', {
      body: { usageType: 'ai_scripts' }
    });

    console.log('Script generated successfully:', script.id);

    return new Response(
      JSON.stringify({ script }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-script:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
