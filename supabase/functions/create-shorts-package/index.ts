import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShortPackage {
  moment: {
    timestamp: string;
    startTime: number;
    endTime: number;
  };
  content: {
    title: string;
    caption: string;
    hashtags: string[];
    thumbnailUrl: string;
  };
  metadata: {
    viralScore: number;
    suggestedPlatforms: string[];
    bestPostingTime: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { videoUrl, transcript } = await req.json();

    if (!videoUrl) {
      return new Response(JSON.stringify({ error: 'Video URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting shorts package creation for video:', videoUrl);

    // Step 1: Analyze video for viral moments
    const { data: analysisData, error: analysisError } = await supabaseClient.functions.invoke(
      'analyze-youtube-video',
      {
        body: { videoUrl, transcript: transcript || '' }
      }
    );

    if (analysisError) {
      console.error('Analysis error:', analysisError);
      return new Response(JSON.stringify({ error: 'Failed to analyze video' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const viralMoments = analysisData.viralMoments || [];
    const videoTitle = analysisData.videoTitle || 'Video';

    // Take top 5 moments
    const topMoments = viralMoments.slice(0, 5);
    console.log(`Found ${topMoments.length} viral moments to process`);

    const shortsPackages: ShortPackage[] = [];
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    // Step 2: Process each moment
    for (const moment of topMoments) {
      console.log(`Processing moment: ${moment.title}`);
      
      // Parse timestamp to get start time in seconds
      const timeMatch = moment.timestamp.match(/(\d+):(\d+)/);
      const startTime = timeMatch ? parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]) : 0;
      const endTime = startTime + 60; // 60 second clips

      // Generate optimized title using AI
      const titlePrompt = `Create a viral YouTube Shorts title for this moment: "${moment.title}". 
Context: ${moment.description}
Requirements:
- Maximum 60 characters
- Use emojis strategically
- Create curiosity/urgency
- SEO-friendly
Return ONLY the title, nothing else.`;

      const titleResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: titlePrompt }],
        }),
      });

      const titleData = await titleResponse.json();
      const optimizedTitle = titleData.choices?.[0]?.message?.content?.trim() || moment.title;

      // Generate thumbnail
      const { data: thumbnailData, error: thumbnailError } = await supabaseClient.functions.invoke(
        'generate-thumbnail',
        {
          body: {
            prompt: moment.title,
            style: 'dynamic',
            title: optimizedTitle,
          }
        }
      );

      if (thumbnailError) {
        console.error('Thumbnail generation error:', thumbnailError);
      }

      // Generate caption
      const { data: captionData, error: captionError } = await supabaseClient.functions.invoke(
        'generate-caption',
        {
          body: {
            reelIdea: `${moment.title}: ${moment.description}`,
            contentType: 'shorts',
            targetAudience: 'YouTube viewers',
            brandVoice: 'engaging',
          }
        }
      );

      if (captionError) {
        console.error('Caption generation error:', captionError);
      }

      // Generate hashtags
      const { data: hashtagData, error: hashtagError } = await supabaseClient.functions.invoke(
        'generate-hashtags',
        {
          body: {
            topic: moment.title,
            niche: videoTitle,
            platform: 'youtube',
          }
        }
      );

      if (hashtagError) {
        console.error('Hashtag generation error:', hashtagError);
      }

      // Determine best posting time based on viral score
      const hour = moment.viralPotential > 80 ? '18:00' : 
                   moment.viralPotential > 60 ? '12:00' : '09:00';

      // Create package
      const shortPackage: ShortPackage = {
        moment: {
          timestamp: moment.timestamp,
          startTime,
          endTime,
        },
        content: {
          title: optimizedTitle,
          caption: captionData?.caption || moment.suggestedCaption || '',
          hashtags: hashtagData?.hashtags?.highVolume || moment.tags || [],
          thumbnailUrl: thumbnailData?.thumbnailUrl || '',
        },
        metadata: {
          viralScore: moment.viralPotential,
          suggestedPlatforms: ['youtube_shorts', 'tiktok', 'instagram_reels'],
          bestPostingTime: hour,
        },
      };

      shortsPackages.push(shortPackage);
    }

    // Step 3: Increment usage
    await supabaseClient.functions.invoke('increment-usage', {
      body: { usageType: 'ai_shorts_packages' }
    });

    console.log(`Successfully created ${shortsPackages.length} shorts packages`);

    return new Response(
      JSON.stringify({
        packages: shortsPackages,
        videoTitle,
        totalPackages: shortsPackages.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-shorts-package:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
