import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Sparkles, Copy, Check } from "lucide-react";
import { Layout } from "@/components/Layout";
import SubscriptionGuard from "@/components/SubscriptionGuard";

export default function ContentRepurposer() {
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState("long-video");
  const [targetFormat, setTargetFormat] = useState("youtube-shorts");
  const [loading, setLoading] = useState(false);
  const [repurposing, setRepurposing] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const copyContent = () => {
    if (repurposing?.repurposed_content) {
      navigator.clipboard.writeText(repurposing.repurposed_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Repurposed content copied to clipboard",
      });
    }
  };

  const handleRepurpose = async () => {
    if (!content.trim()) {
      toast({
        title: "Missing Content",
        description: "Please enter content to repurpose.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.functions.invoke('repurpose-content', {
        body: { content, contentType, targetFormat }
      });

      if (error) throw error;

      if (data.repurposing) {
        setRepurposing(data.repurposing);
        toast({
          title: "Content Repurposed!",
          description: "Your content has been adapted for the target format.",
        });
      }
    } catch (error: any) {
      console.error('Error repurposing content:', error);
      toast({
        title: "Repurposing Failed",
        description: error.message || "Failed to repurpose content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <SubscriptionGuard>
        <div className="max-w-6xl mx-auto p-4 space-y-8">
          <div className="text-center space-y-2 slide-in">
            <h1 className="text-4xl font-bold gradient-text flex items-center justify-center gap-2">
              <RefreshCw className="h-10 w-10" />
              AI Content Repurposer
            </h1>
            <p className="text-muted-foreground text-lg">
              Transform your content for different platforms and maximize its value
            </p>
          </div>

          <Card className="card-3d border-2">
            <CardHeader>
              <CardTitle>Repurpose Content</CardTitle>
              <CardDescription>
                Convert your content into different formats optimized for each platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contentType">Source Format</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="long-video">Long-form Video</SelectItem>
                      <SelectItem value="blog-post">Blog Post</SelectItem>
                      <SelectItem value="podcast">Podcast Script</SelectItem>
                      <SelectItem value="social-post">Social Media Post</SelectItem>
                      <SelectItem value="script">Video Script</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetFormat">Target Format</Label>
                  <Select value={targetFormat} onValueChange={setTargetFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube-shorts">YouTube Shorts</SelectItem>
                      <SelectItem value="instagram-reels">Instagram Reels</SelectItem>
                      <SelectItem value="tiktok">TikTok Video</SelectItem>
                      <SelectItem value="twitter-thread">Twitter Thread</SelectItem>
                      <SelectItem value="linkedin-post">LinkedIn Post</SelectItem>
                      <SelectItem value="blog-outline">Blog Outline</SelectItem>
                      <SelectItem value="podcast-script">Podcast Script</SelectItem>
                      <SelectItem value="email-newsletter">Email Newsletter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Original Content *</Label>
                <Textarea
                  id="content"
                  placeholder="Paste your content here (video script, blog post, etc.)..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              <Button
                onClick={handleRepurpose}
                disabled={loading}
                className="w-full"
                variant="gradient"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Repurposing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Repurpose Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {repurposing && (
            <Card className="card-3d border-primary scale-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Repurposed Content</CardTitle>
                    <CardDescription>
                      Optimized for {targetFormat.replace('-', ' ')}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyContent}
                  >
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                  <Textarea
                    value={repurposing.repurposed_content}
                    readOnly
                    className="min-h-[400px] font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SubscriptionGuard>
    </Layout>
  );
}
