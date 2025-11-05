import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ViralMoment {
  timestamp: string;
  timeInSeconds: number;
  title: string;
  description: string;
  viralPotential: number;
  suggestedCaption: string;
  tags: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { videoUrl } = await req.json();
    console.log('Analyzing video:', videoUrl);

    if (!videoUrl) {
      throw new Error('Video URL is required');
    }

    // Extract video ID from URL
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // Fetch transcript using YouTube Transcript API
    const transcript = await fetchTranscript(videoId);
    if (!transcript || transcript.length === 0) {
      throw new Error('Could not fetch transcript. Make sure the video has captions enabled.');
    }

    // Get video title
    const videoTitle = await fetchVideoTitle(videoId);

    console.log('Transcript fetched, analyzing with AI...');

    // Analyze with Lovable AI
    const viralMoments = await analyzeWithAI(transcript, videoTitle);

    // Save to database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('video_analyses')
      .insert({
        user_id: user.id,
        video_url: videoUrl,
        video_id: videoId,
        video_title: videoTitle,
        viral_moments: viralMoments,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving analysis:', saveError);
      throw saveError;
    }

    console.log('Analysis complete and saved');

    return new Response(
      JSON.stringify({
        success: true,
        analysis: savedAnalysis,
        videoTitle,
        moments: viralMoments,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

async function fetchTranscript(videoId: string): Promise<any[]> {
  try {
    // Using a public YouTube transcript API endpoint
    const response = await fetch(
      `https://youtube-transcript-api.p.rapidapi.com/transcript?videoId=${videoId}`,
      {
        headers: {
          'X-RapidAPI-Key': Deno.env.get('RAPID_API_KEY') || '',
        },
      }
    );

    if (!response.ok) {
      // Fallback: try alternative method
      return await fetchTranscriptAlternative(videoId);
    }

    const data = await response.json();
    return data.transcript || [];
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return await fetchTranscriptAlternative(videoId);
  }
}

async function fetchTranscriptAlternative(videoId: string): Promise<any[]> {
  // Alternative: fetch from YouTube's timedtext API
  try {
    const response = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`
    );
    const html = await response.text();
    
    // Extract captions URL from HTML
    const captionsMatch = html.match(/"captions":\s*({[^}]+})/);
    if (!captionsMatch) {
      throw new Error('No captions found');
    }

    // For now, return a simple structure
    // In production, you'd parse the actual caption data
    return [];
  } catch (error) {
    console.error('Alternative transcript fetch failed:', error);
    throw new Error('Could not fetch transcript from YouTube');
  }
}

async function fetchVideoTitle(videoId: string): Promise<string> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    const data = await response.json();
    return data.title || 'Unknown Video';
  } catch (error) {
    console.error('Error fetching video title:', error);
    return 'Unknown Video';
  }
}

async function analyzeWithAI(
  transcript: any[],
  videoTitle: string
): Promise<ViralMoment[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  // Format transcript for AI
  const transcriptText = transcript
    .map((item) => `[${item.start}s] ${item.text}`)
    .join('\n');

  const systemPrompt = `You are a viral content expert analyzing YouTube videos. Your job is to identify 5-10 moments in the video that have the highest viral potential for short-form content (Shorts, Reels, TikTok).

Consider:
- Hook potential (first 3 seconds)
- Emotional impact
- Quotable moments
- Visual appeal
- Trend alignment
- Storytelling peaks

Return a JSON array of viral moments with this structure:
[
  {
    "timestamp": "MM:SS",
    "timeInSeconds": 120,
    "title": "Catchy 5-word title",
    "description": "Why this moment is viral-worthy (20-30 words)",
    "viralPotential": 85,
    "suggestedCaption": "Short hook caption for social media",
    "tags": ["tag1", "tag2", "tag3"]
  }
]`;

  const userPrompt = `Video Title: ${videoTitle}

Transcript:
${transcriptText.substring(0, 8000)}

Analyze this video and identify 5-10 viral moments. Return ONLY the JSON array, no other text.`;

  console.log('Calling Lovable AI for analysis...');

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  console.log('AI response received, parsing...');

  // Parse JSON from response
  let moments: ViralMoment[];
  try {
    // Remove markdown code blocks if present
    const jsonText = content.replace(/```json\n?|\n?```/g, '').trim();
    moments = JSON.parse(jsonText);
  } catch (parseError) {
    console.error('Error parsing AI response:', parseError);
    console.log('Raw content:', content);
    throw new Error('Failed to parse AI response');
  }

  // Sort by viral potential
  moments.sort((a, b) => b.viralPotential - a.viralPotential);

  return moments;
}
