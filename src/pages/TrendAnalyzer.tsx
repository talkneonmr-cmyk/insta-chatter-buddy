import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, Sparkles } from "lucide-react";

import SubscriptionGuard from "@/components/SubscriptionGuard";
import TesterGuard from "@/components/TesterGuard";

export default function TrendAnalyzer() {
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!niche.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your content niche.",
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

      const { data, error } = await supabase.functions.invoke('analyze-trends', {
        body: { niche, platform }
      });

      if (error) throw error;

      if (data.analysis) {
        setAnalysis(data.analysis);
        
        // Increment usage
        await supabase.functions.invoke('increment-usage', {
          body: { usageType: 'ai_trend_analysis' }
        });
        
        toast({
          title: "Trend Analysis Complete!",
          description: "Your trend analysis is ready.",
        });
      }
    } catch (error: any) {
      console.error('Error analyzing trends:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze trends",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    
      <TesterGuard featureName="Trend Analyzer">
        <SubscriptionGuard>
          <div className="max-w-6xl mx-auto p-4 space-y-8">
          <div className="text-center space-y-2 slide-in">
            <h1 className="text-4xl font-bold gradient-text flex items-center justify-center gap-2">
              <TrendingUp className="h-10 w-10" />
              AI Trend Analyzer
            </h1>
            <p className="text-muted-foreground text-lg">
              Discover trending topics and viral opportunities in your niche
            </p>
          </div>

          <Card className="card-3d border-2">
            <CardHeader>
              <CardTitle>Analyze Trends</CardTitle>
              <CardDescription>
                Get AI-powered insights on current trends and content opportunities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="niche">Content Niche *</Label>
                <Input
                  id="niche"
                  placeholder="e.g., Tech Reviews, Fitness, Cooking..."
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="general">All Platforms</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full"
                variant="gradient"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Trends...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze Trends
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {analysis && (
            <Card className="card-3d border-primary scale-in">
              <CardHeader>
                <CardTitle>Trend Analysis Results</CardTitle>
                <CardDescription>
                  Generated on {new Date(analysis.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                  <Textarea
                    value={analysis.analysis_content}
                    readOnly
                    className="min-h-[500px] font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SubscriptionGuard>
      </TesterGuard>
    
  );
}
