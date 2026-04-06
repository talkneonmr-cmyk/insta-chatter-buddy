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

Write ONLY the words to speak. Make it flow naturally like talking to a friend. No formatting, no directions, no labels - just pure conversational speech.`;

    // Priority: Anthropic Claude (best writer) → OpenAI → Lovable AI
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    let scriptContent: string;
    let modelUsed: string;

    if (ANTHROPIC_API_KEY) {
      console.log("Generating script with Anthropic Claude (best writing quality)...");
      try {
        const result = await callAnthropic(ANTHROPIC_API_KEY, systemPrompt, userPrompt);
        scriptContent = result;
        modelUsed = 'claude-sonnet-4-20250514';
      } catch (e) {
        console.error("Anthropic failed, falling back:", e);
        if (OPENAI_API_KEY) {
          scriptContent = await callOpenAIScript(OPENAI_API_KEY, systemPrompt, userPrompt);
          modelUsed = 'gpt-4o';
        } else if (LOVABLE_API_KEY) {
          scriptContent = await callLovableAIScript(LOVABLE_API_KEY, systemPrompt, userPrompt);
          modelUsed = 'google/gemini-2.5-flash';
        } else {
          throw e;
        }
      }
    } else if (OPENAI_API_KEY) {
      console.log("Generating script with OpenAI GPT-4o...");
      scriptContent = await callOpenAIScript(OPENAI_API_KEY, systemPrompt, userPrompt);
      modelUsed = 'gpt-4o';
    } else if (LOVABLE_API_KEY) {
      console.log("Generating script with Lovable AI...");
      scriptContent = await callLovableAIScript(LOVABLE_API_KEY, systemPrompt, userPrompt);
      modelUsed = 'google/gemini-2.5-flash';
    } else {
      throw new Error('No AI API key configured');
    }

    if (!scriptContent) {
      throw new Error('No script generated');
    }

    // Parse script into structured format
    const hookMatch = scriptContent.match(/HOOK[\s\S]*?:([\s\S]*?)(?=INTRODUCTION|$)/i);
    const ctaMatch = scriptContent.match(/CALL[- ]TO[- ]ACTION[\s\S]*?:([\s\S]*?)(?=TIMESTAMPS|$)/i);
    const timestampsMatch = scriptContent.match(/TIMESTAMPS[\s\S]*?:([\s\S]*?)(?=B-ROLL|$)/i);

    const hook = hookMatch ? hookMatch[1].trim() : '';
    const callToAction = ctaMatch ? ctaMatch[1].trim() : '';
    
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

    const mainContentMatch = scriptContent.match(/MAIN CONTENT[\s\S]*?:([\s\S]*?)(?=CALL-TO-ACTION|$)/i);
    const mainContent = mainContentMatch ? mainContentMatch[1].trim() : '';
    const keyPoints = mainContent
      .split(/\d+\.|•/)
      .filter((point: string) => point.trim().length > 20)
      .map((point: string) => point.trim());

    const generationTime = Date.now() - startTime;

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
        ai_model_used: modelUsed
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to save script: ${dbError.message}`);
    }

    await supabase.functions.invoke('increment-usage', {
      body: { usageType: 'ai_scripts' }
    });

    console.log('Script generated successfully:', script.id, 'using', modelUsed);

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

async function callAnthropic(apiKey: string, system: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callOpenAIScript(apiKey: string, system: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callLovableAIScript(apiKey: string, system: string, prompt: string): Promise<string> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lovable AI error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
