import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Language code mapping for Edge TTS
const edgeTTSLanguages: Record<string, { code: string; voice: string }> = {
  'en': { code: 'en-US', voice: 'en-US-AriaNeural' },
  'es': { code: 'es-ES', voice: 'es-ES-ElviraNeural' },
  'fr': { code: 'fr-FR', voice: 'fr-FR-DeniseNeural' },
  'de': { code: 'de-DE', voice: 'de-DE-KatjaNeural' },
  'it': { code: 'it-IT', voice: 'it-IT-ElsaNeural' },
  'pt': { code: 'pt-BR', voice: 'pt-BR-FranciscaNeural' },
  'ru': { code: 'ru-RU', voice: 'ru-RU-SvetlanaNeural' },
  'ja': { code: 'ja-JP', voice: 'ja-JP-NanamiNeural' },
  'ko': { code: 'ko-KR', voice: 'ko-KR-SunHiNeural' },
  'zh': { code: 'zh-CN', voice: 'zh-CN-XiaoxiaoNeural' },
  'ar': { code: 'ar-SA', voice: 'ar-SA-ZariyahNeural' },
  'hi': { code: 'hi-IN', voice: 'hi-IN-SwaraNeural' },
};

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

    const { audioUrl, targetLanguage } = requestBody;

    if (!audioUrl || !targetLanguage) {
      throw new Error('Audio URL and target language are required');
    }

    const HF_TOKEN = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
    if (!HF_TOKEN) {
      throw new Error('HuggingFace token not configured');
    }

    console.log('Starting dubbing process...');
    console.log('Target language:', targetLanguage);

    // Step 1: Fetch audio file
    console.log('Fetching audio file...');
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error('Failed to fetch audio file');
    }
    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);
    console.log('Audio file fetched, size:', audioBytes.byteLength);

    // Step 2: Transcribe audio using Whisper (direct API call)
    console.log('Transcribing audio with Whisper...');
    
    try {
      const transcriptionResponse = await fetch(
        'https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/octet-stream',
            'Accept': 'application/json',
            'x-wait-for-model': 'true',
            'x-use-cache': 'false',
          },
          body: audioBytes,
        }
      );

      if (!transcriptionResponse.ok) {
        const errorText = await transcriptionResponse.text();
        console.error('Whisper API error:', transcriptionResponse.status, errorText);
        throw new Error(`Whisper API returned ${transcriptionResponse.status}`);
      }

      const transcriptionResult = await transcriptionResponse.json();
      const transcribedText = transcriptionResult.text;
      console.log('Transcription complete:', transcribedText);
      
      if (!transcribedText) {
        throw new Error('No transcription text received');
      }

    // Step 3: Translate text using NLLB-200 (direct API call)
    console.log('Translating text...');
    try {
      const translationResponse = await fetch(
        'https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-600M',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: transcribedText,
            parameters: {
              src_lang: 'eng_Latn',
              tgt_lang: `${targetLanguage}_Latn`,
            },
          }),
        }
      );

      if (!translationResponse.ok) {
        const errorText = await translationResponse.text();
        console.error('Translation API error:', translationResponse.status, errorText);
        // If translation fails, use original text
        console.log('Using original text without translation');
        var translatedText = transcribedText;
      } else {
        const translationResult = await translationResponse.json();
        var translatedText = translationResult[0]?.translation_text || transcribedText;
      }
      console.log('Translation complete:', translatedText);

    // Step 4: Generate speech using HuggingFace TTS (direct API call)
    console.log('Generating speech with HuggingFace TTS...');
    
    try {
      const ttsResponse = await fetch(
        'https://api-inference.huggingface.co/models/facebook/mms-tts-eng',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: translatedText,
          }),
        }
      );

      if (!ttsResponse.ok) {
        const errorText = await ttsResponse.text();
        console.error('TTS API error:', ttsResponse.status, errorText);
        throw new Error(`TTS API returned ${ttsResponse.status}`);
      }

      const audioArrayBuffer = await ttsResponse.arrayBuffer();
      console.log('Speech generation complete, size:', audioArrayBuffer.byteLength);

      // Step 5: Upload to Supabase Storage
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const fileName = `dubbed-audio-${Date.now()}.mp3`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-samples')
        .upload(fileName, new Uint8Array(audioArrayBuffer), {
          contentType: 'audio/mpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload dubbed audio');
      }

      const { data: urlData } = supabase.storage
        .from('voice-samples')
        .getPublicUrl(fileName);

      console.log('Dubbing complete! Audio URL:', urlData.publicUrl);

      return new Response(
        JSON.stringify({ 
          audioUrl: urlData.publicUrl,
          message: 'Dubbing completed successfully!',
          status: 'completed',
          transcript: transcribedText,
          translation: translatedText,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (ttsError) {
      console.error('TTS error:', ttsError);
      const errorMsg = ttsError instanceof Error ? ttsError.message : String(ttsError);
      throw new Error(`Failed to generate speech: ${errorMsg}`);
    }
    } catch (translationError) {
      console.error('Translation error:', translationError);
      const errorMsg = translationError instanceof Error ? translationError.message : String(translationError);
      throw new Error(`Failed to translate text: ${errorMsg}`);
    }
    } catch (transcriptionError) {
      console.error('Transcription error:', transcriptionError);
      const errorMsg = transcriptionError instanceof Error ? transcriptionError.message : String(transcriptionError);
      throw new Error(`Failed to transcribe audio: ${errorMsg}`);
    }
  } catch (error) {
    console.error('Error in dub-audio function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
