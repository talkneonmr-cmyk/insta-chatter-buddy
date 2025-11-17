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

    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { videoTopic, videoLength, tone, targetAudience, title, language = 'english' } = requestBody;
    console.log('Generating script for topic:', videoTopic, 'in language:', language);

    const startTime = Date.now();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Check usage limit
    const { data: limitCheck } = await supabase.functions.invoke('check-usage-limit', {
      body: { limitType: 'ai_scripts' }
    });

    if (!limitCheck?.canUse) {
      return new Response(
        JSON.stringify({ error: 'Daily limit reached. Free: 5/day, Pro: Unlimited. Upgrade for more!' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build comprehensive prompt for natural, human speech
    const systemPrompt = `You are an expert YouTube script writer who creates scripts that real people can easily read and speak on camera. Your scripts are CLEAN, SIMPLE, and NATURAL - just the words to say, nothing else.`;

    const languageInstruction = language !== 'english' 
      ? `\n\nCRITICAL: Write the ENTIRE script in ${language.toUpperCase()}. Every single word must be in native ${language}. Use natural ${language} expressions and speaking style.`
      : '';

    const userPrompt = `Create a clean, easy-to-read YouTube video script that a human can speak naturally on camera.

Topic: ${videoTopic}
Length: ${videoLength}
Tone: ${tone}
Target Audience: ${targetAudience || 'General audience'}
Language: ${language.charAt(0).toUpperCase() + language.slice(1)}${languageInstruction}

CRITICAL FORMATTING RULES:
- NO stage directions like [smile], [pause], [emphasis] 
- NO technical markers or timestamps in the script itself
- NO section headers or labels within the speaking text
- Just write EXACTLY what the person should say, word for word
- Write it as one flowing conversation
- Use line breaks between different thoughts/sections for easy reading
- Make it conversational - use "I'm", "you'll", "don't", "gonna" etc.
- Short sentences that are easy to speak without running out of breath

CONTENT STRUCTURE (but don't label these in the script):
1. Start with an exciting hook - first 1-2 sentences grab attention
2. Quick intro - who you are, what the video is about
3. Main content - 3-5 key points explained simply and conversationally
4. Natural call-to-action - ask for likes/comments/subscribes in a friendly way
5. Warm goodbye

Write ONLY the words to speak. Make it flow naturally like talking to a friend. No formatting, no directions, no labels - just pure conversational speech that's easy to read and deliver.

Example of what to write:
"Hey everyone, welcome back! Today I'm gonna show you something super cool that's gonna change how you think about this. So let's jump right in.

First thing you need to know is this..."

NOT like this:
"[HOOK] (0:00-0:05)
HOST: [Enthusiastically] Hey everyone! [Smile and wave]"

Just clean, readable text that flows naturally.`;


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
