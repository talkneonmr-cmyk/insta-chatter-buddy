import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Check user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check usage limit
    const { data: limitCheck, error: limitError } = await supabase.functions.invoke('check-usage-limit', {
      body: { limitType: 'ai_music' }
    });

    if (limitError) throw limitError;
    
    if (!limitCheck.canUse) {
      return new Response(
        JSON.stringify({ error: limitCheck.message }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    const { 
      title,
      prompt, 
      tags, 
      lyrics, 
      instrumental = false,
      num_songs = 1,
      output_format = 'mp3',
      bpm = null,
      vocalist_gender = 'female'
    } = requestBody;

    // At least one of prompt, tags, or lyrics must be provided
    if (!prompt && !tags && !lyrics) {
      throw new Error('At least one of prompt, tags, or lyrics is required');
    }

    const SONAUTO_API_KEY = Deno.env.get('SONAUTO_API_KEY');
    if (!SONAUTO_API_KEY) {
      throw new Error('SONAUTO_API_KEY is not configured');
    }

    console.log('Generating audio with Sonauto API');

    // Sanitize tags
    const sanitizedTags = Array.isArray(tags)
      ? Array.from(new Set(
          tags
            .map((t: any) => String(t).toLowerCase().trim())
            .map((t: string) => (t === "lofi" ? "chill" : t === "hiphop" ? "rap" : t))
            .filter(Boolean)
        ))
      : undefined;

    // API limitation: cannot provide all three (tags, lyrics, prompt)
    // Priority: lyrics > tags > prompt
    const payload: any = {
      title,
      instrumental,
      num_songs,
      output_format,
      bpm,
      vocalist_gender,
    };

    if (lyrics) {
      payload.lyrics = lyrics;
      // If lyrics exist, prefer tags over prompt
      if (sanitizedTags && sanitizedTags.length > 0) {
        payload.tags = sanitizedTags;
      } else if (prompt) {
        payload.prompt = prompt;
      }
    } else if (prompt) {
      payload.prompt = prompt;
      if (sanitizedTags && sanitizedTags.length > 0) {
        payload.tags = sanitizedTags;
      }
    } else if (sanitizedTags && sanitizedTags.length > 0) {
      payload.tags = sanitizedTags;
    }

    console.log('Payload:', JSON.stringify(payload));

    // Call Sonauto API to start generation
    const response = await fetch('https://api.sonauto.ai/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SONAUTO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sonauto API error:', response.status, errorText);
      
      // Parse error message for better user feedback
      let errorMessage = `API error (${response.status})`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.detail && Array.isArray(errorData.detail)) {
          const details = errorData.detail.map((d: any) => d.msg).join(', ');
          errorMessage = details;
        }
      } catch {
        errorMessage = errorText;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Audio generation task created:', data.task_id);

    // Return the task_id so client can poll for status
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-audio function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
