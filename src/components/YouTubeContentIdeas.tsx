import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Lightbulb, Loader2, TrendingUp, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const YouTubeContentIdeas = () => {
  const [niche, setNiche] = useState("");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<any>(null);
  const { toast } = useToast();

  const generateIdeas = async () => {
    if (!niche.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter your niche or topic",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-trends', {
        body: { niche: niche, platform: 'youtube' }
      });

      if (error) throw error;

      setIdeas(data);
      toast({
        title: "Ideas Generated! 💡",
        description: "Check out your trending content ideas below",
      });
    } catch (error: any) {
      console.error('Error generating ideas:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate ideas. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 slide-in">
      <div>
        <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2 gradient-text">Content Ideas Generator</h3>
        <p className="text-xs md:text-sm text-muted-foreground">Get AI-powered video ideas based on trends</p>
      </div>

      <div className="flex gap-2 md:gap-3">
        <Input
          placeholder="Enter your niche (e.g., gaming, cooking, tech)"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && generateIdeas()}
          className="flex-1"
        />
        <Button onClick={generateIdeas} disabled={loading} variant="gradient">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Lightbulb className="h-4 w-4" />
          )}
        </Button>
      </div>

      {ideas && (
        <div className="space-y-4 animate-fade-in">
          {/* Trending Topics */}
          {ideas.trends && ideas.trends.length > 0 && (
            <Card className="p-4 md:p-6 card-3d">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-gradient-primary">Trending Topics</h4>
              </div>
              <div className="grid gap-3">
                {ideas.trends.map((trend: any, index: number) => (
                  <div key={index} className="p-3 rounded-lg bg-muted/50">
                    <h5 className="font-medium mb-1">{trend.topic}</h5>
                    <p className="text-sm text-muted-foreground">{trend.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Content Suggestions */}
          {ideas.suggestions && ideas.suggestions.length > 0 && (
            <Card className="p-4 md:p-6 card-3d">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-secondary" />
                <h4 className="font-semibold text-gradient-secondary">Video Ideas</h4>
              </div>
              <div className="grid gap-3">
                {ideas.suggestions.map((suggestion: any, index: number) => (
                  <div key={index} className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                    <h5 className="font-medium mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-accent" />
                      {suggestion.title}
                    </h5>
                    <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                    {suggestion.keywords && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {suggestion.keywords.map((keyword: string, i: number) => (
                          <span key={i} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {!ideas && !loading && (
        <Card className="p-8 md:p-12 text-center card-glass">
          <Lightbulb className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h4 className="text-lg md:text-xl font-semibold mb-2">Generate Content Ideas</h4>
          <p className="text-sm md:text-base text-muted-foreground">
            Enter your niche above to get trending topics and video ideas
          </p>
        </Card>
      )}
    </div>
  );
};

export default YouTubeContentIdeas;
