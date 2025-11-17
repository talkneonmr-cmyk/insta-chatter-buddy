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
    const systemPrompt = `You are an expert YouTube script writer specializing in creating scripts that sound NATURAL and HUMAN when spoken aloud. Your scripts are designed for real people to deliver on camera, not robots. Focus on:
1. Conversational, natural speech patterns - how real people actually talk
2. Short, punchy sentences that are easy to speak and breathe while delivering
3. Emotional connection and authenticity - make it feel personal and genuine
4. Natural pauses and rhythm for comfortable speaking
5. Avoiding robotic, overly formal, or awkward phrasing
6. Words and phrases that flow smoothly when spoken out loud
7. Energy and enthusiasm that translates well on camera`;

    const languageInstruction = language !== 'english' 
      ? `\n\nCRITICAL: Write the ENTIRE script in ${language.toUpperCase()}. Every single word, sentence, and section must be in native ${language}. Use natural ${language} expressions and idioms.`
      : '';

    const userPrompt = `Create a YouTube video script that sounds NATURAL when a human speaks it on camera.

Topic: ${videoTopic}
Length: ${videoLength}
Tone: ${tone}
Target Audience: ${targetAudience || 'General audience'}
Language: ${language.charAt(0).toUpperCase() + language.slice(1)}${languageInstruction}

CRITICAL REQUIREMENTS FOR NATURAL SPEECH:
- Write EXACTLY how a real person would speak on camera
- Use contractions (I'm, you'll, we're, don't) to sound natural
- Include filler phrases like "you know", "actually", "honestly" where appropriate
- Break up long sentences - humans need to breathe while speaking
- Add emotional cues like [smile], [pause], [emphasis] where helpful
- Use simple, everyday language - not corporate or robotic jargon
- Make it sound like a conversation with a friend, not a lecture
- Include rhetorical questions to engage the audience naturally
- Add natural transitions like "So here's the thing...", "Now, check this out..."

Structure the script with:
1. HOOK (0:00-0:05) - An attention-grabbing opening line that sounds excited and natural
2. INTRODUCTION (0:05-0:30) - Friendly welcome, what they'll learn, why it matters
3. MAIN CONTENT - Break into clear sections with:
   - Natural speaking rhythm
   - Personal anecdotes or examples
   - Conversational transitions between points
   - Easy-to-speak explanations
4. CALL-TO-ACTION - Natural, friendly request (not pushy)
5. OUTRO - Warm, authentic closing

Add [SPEAKING TIPS] throughout for:
- Where to pause for emphasis
- Which words to stress
- Where to smile or show emotion
- Pacing suggestions

Make this script so natural that when someone reads it, they'll sound like a confident, engaging human - not a robot reading a teleprompter.`;


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
