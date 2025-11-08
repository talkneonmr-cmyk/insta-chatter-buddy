import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, FileText, Loader2, Copy, Sparkles, Check, FileCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";


const TextSummarizer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inputText, setInputText] = useState("");
  const [summary, setSummary] = useState("");
  const [processing, setProcessing] = useState(false);
  const [summaryLength, setSummaryLength] = useState([50]);
  const [copied, setCopied] = useState(false);

  const handleSummarize = async () => {
    if (!inputText.trim()) {
      toast({
        title: "No text to summarize",
        description: "Please enter some text first",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    toast({
      title: "Summarizing...",
      description: "AI is generating your summary"
    });

    try {
      const { data, error } = await supabase.functions.invoke('summarize-text', {
        body: { 
          text: inputText,
          maxLength: summaryLength[0]
        }
      });

      if (error) {
        throw error;
      }

      if (!data?.summary) {
        throw new Error('No summary generated');
      }

      setSummary(data.summary);
      
      // Increment usage tracking
      await supabase.functions.invoke('increment-usage', {
        body: { usageType: 'ai_text_summarizer' }
      });

      toast({
        title: "Summary complete!",
        description: "Your text has been summarized"
      });
    } catch (error: any) {
      console.error('Summarization error:', error);
      let errorMessage = "Failed to summarize text";
      
      if (error.message?.includes('Rate limit')) {
        errorMessage = "Too many requests. Please wait a moment.";
      } else if (error.message?.includes('credits')) {
        errorMessage = "AI credits depleted. Please try again later.";
      }
      
      toast({
        title: "Summarization failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Summary copied to clipboard"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4 md:p-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate("/")} 
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <FileCheck className="h-10 w-10" />
            AI Text Summarizer
          </h1>
          <p className="text-muted-foreground text-lg">
            Condense long texts into concise summaries
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Summarize Text
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text">Text to Summarize *</Label>
              <Textarea
                id="text"
                placeholder="Paste your text here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={10}
              />
            </div>

            <Button 
              onClick={handleSummarize}
              disabled={processing}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Summarizing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Summarize
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {summary && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Summary</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={summary}
                readOnly
                className="min-h-[200px]"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TextSummarizer;
