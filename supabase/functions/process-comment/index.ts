import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CommentProcessingRequest {
  comment_text: string;
  first_name?: string;
  username: string;
  post_title: string;
  post_url: string;
  creator_name: string;
  tone: string;
  goal: string;
  rule_keywords: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
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
      comment_text,
      first_name,
      username,
      post_title,
      post_url,
      creator_name,
      tone,
      goal,
      rule_keywords,
    }: CommentProcessingRequest = requestBody;

    console.log("Processing comment:", { comment_text, username, goal });

    // Build the system prompt for AI
    const systemPrompt = `You are "Lovable Me Assistant" - a rule evaluator for Instagram comment → DM automations.

INPUT VARIABLES:
- comment_text: "${comment_text}"
- first_name: "${first_name || ''}"
- username: "${username}"
- post_title: "${post_title}"
- post_url: "${post_url}"
- creator_name: "${creator_name}"
- tone: "${tone}"
- goal: "${goal}"
- rule_keywords: "${rule_keywords}"

STEP 1 - Trigger decision:
Decide whether comment_text matches the rule_keywords using fuzzy matching (synonyms, contains, simple paraphrase). Consider phrase negations ("not", "no thanks") as non-matching.

STEP 2 - Safety & opt-out check:
- If comment contains hate/safety violations, return action: "BLOCK"
- If commenter wrote opt-out words (stop, unsubscribe, no thanks, nahi chahiye, stop DM), return action: "DO_NOT_CONTACT"

STEP 3 - DM generation:
If trigger matches and not blocked:
- Generate a single personalized DM message, max 300 characters
- Use first_name if present; otherwise use "@username"
- Include clear CTA aligned with goal
- Keep tone as specified
- Do not ask for passwords, bank details, SSN, or other sensitive info

Output ONLY valid JSON in this exact format:
{
  "trigger_match": "YES" | "NO",
  "trigger_reason": "one-line reason",
  "action": "SEND" | "BLOCK" | "DO_NOT_CONTACT",
  "message_text": "the DM text or empty string",
  "delay_seconds": 2,
  "retry_on_failure": true,
  "tags": ["tag1", "tag2"],
  "safety_check": "CLEAN" | "BLOCK_REASON",
  "notes": "optional note"
}`;

    // Call Lovable AI
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Process this comment and return the JSON result." },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    console.log("AI raw response:", aiContent);

    // Parse the JSON response from AI
    let result;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiContent.match(/```json\n([\s\S]*?)\n```/) || 
                       aiContent.match(/```\n([\s\S]*?)\n```/) ||
                       [null, aiContent];
      const jsonStr = jsonMatch[1] || aiContent;
      result = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse AI response:", aiContent);
      throw new Error("Invalid JSON response from AI");
    }

    console.log("Processed result:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in process-comment function:", error);
    return new Response(
      JSON.stringify({ error: 'Failed to process comment. Please try again later.' }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
