import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2';

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
    const audioBlob = await audioResponse.blob();
    console.log('Audio file fetched, size:', audioBlob.size);

    // Step 2: Transcribe audio using Whisper
    console.log('Transcribing audio with Whisper...');
    const hf = new HfInference(HF_TOKEN);
    
    const transcriptionResult = await hf.automaticSpeechRecognition({
      data: audioBlob,
      model: 'openai/whisper-large-v3',
    });

    const transcribedText = transcriptionResult.text;
    console.log('Transcription complete:', transcribedText);
    
    if (!transcribedText) {
      throw new Error('No transcription text received');
    }

    // Step 3: Translate text using NLLB-200
    console.log('Translating text...');
    const translationResult = await hf.translation({
      model: 'facebook/nllb-200-distilled-600M',
      inputs: transcribedText,
    });

    const translatedText = translationResult.translation_text || transcribedText;
    console.log('Translation complete:', translatedText);

    // Step 4: Generate speech using HuggingFace TTS
    console.log('Generating speech with HuggingFace TTS...');
    
    const ttsResult = await hf.textToSpeech({
      model: 'facebook/mms-tts-eng',
      inputs: translatedText,
    });

    const audioArrayBuffer = await ttsResult.arrayBuffer();
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
