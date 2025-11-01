import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, FileText, Loader2, Copy, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { pipeline } from "@huggingface/transformers";

const TextSummarizer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inputText, setInputText] = useState("");
  const [summary, setSummary] = useState("");
  const [processing, setProcessing] = useState(false);
  const [summaryLength, setSummaryLength] = useState([50]);

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
    try {
      toast({
        title: "Loading AI model...",
        description: "First time may take a moment"
      });

      const summarizer = await pipeline(
        "summarization",
        "Xenova/distilbart-cnn-6-6",
        { device: "webgpu" }
      );

      toast({
        title: "Summarizing...",
        description: "AI is generating your summary"
      });

      const output: any = await summarizer(inputText, {
        max_length: summaryLength[0],
        min_length: Math.floor(summaryLength[0] / 2),
      } as any);
      
      setSummary(output[0]?.summary_text || output?.summary_text || "");
      
      toast({
        title: "Summary complete!",
        description: "Your text has been summarized"
      });
    } catch (error: any) {
      console.error('Summarization error:', error);
      toast({
        title: "Summarization failed",
        description: error.message || "Make sure WebGPU is supported",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    toast({
      title: "Copied!",
      description: "Summary copied to clipboard"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 slide-in">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="btn-3d"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg float-animation">
              <FileText className="h-6 w-6 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Text Summarizer</h1>
              <p className="text-muted-foreground">Summarize long text with AI - 100% Free!</p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h3 className="font-semibold text-indigo-500">DistilBART - Fast Summarization</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically generate concise summaries from long texts. Perfect for video descriptions, 
                  blog posts, or any content that needs a quick overview.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                Input Text
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="input-text">Paste your long text here</Label>
                <Textarea
                  id="input-text"
                  placeholder="Enter or paste the text you want to summarize..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={12}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {inputText.length} characters
                </p>
              </div>

              <div className="space-y-3">
                <Label>Summary Length: {summaryLength[0]} words</Label>
                <Slider
                  value={summaryLength}
                  onValueChange={setSummaryLength}
                  min={20}
                  max={200}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Brief (20)</span>
                  <span>Detailed (200)</span>
                </div>
              </div>

              <Button
                onClick={handleSummarize}
                disabled={processing || !inputText.trim()}
                className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90"
                size="lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Summarizing...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Summarize Text
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                <span>Processing in browser - instant results</span>
              </div>
            </CardContent>
          </Card>

          {/* Output Section */}
          {summary ? (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-500" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={12}
                  className="resize-none"
                />
                <Button 
                  variant="outline" 
                  onClick={copyToClipboard}
                  className="w-full"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Summary
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-fit">
              <CardContent className="p-12">
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-20 animate-pulse"></div>
                    <div className="relative p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl">
                      <FileText className="w-10 h-10 text-indigo-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Ready to Summarize</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter text to generate a concise summary
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Use Cases */}
        <Card>
          <CardHeader>
            <CardTitle>Perfect For</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Video Descriptions</h4>
                <p className="text-sm text-muted-foreground">
                  Create short, engaging descriptions from full scripts
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Blog Post Previews</h4>
                <p className="text-sm text-muted-foreground">
                  Generate compelling summaries for social media shares
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Content Reviews</h4>
                <p className="text-sm text-muted-foreground">
                  Quickly understand long documents or articles
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TextSummarizer;
