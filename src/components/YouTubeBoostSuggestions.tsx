import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, TrendingUp, Clock, Target, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BoostSuggestion {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: string;
}

const YouTubeBoostSuggestions = () => {
  const [videoTopic, setVideoTopic] = useState("");
  const [suggestions, setSuggestions] = useState<BoostSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateSuggestions = async () => {
    if (!videoTopic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a video topic or description",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('generate-video-metadata', {
        body: { 
          videoTopic,
          context: "boost_suggestions"
        }
      });

      if (error) throw error;

      // Generate boost suggestions using AI
      const boostSuggestions: BoostSuggestion[] = [
        {
          title: "Optimize Video Title",
          description: data.title || "Use keywords at the start of your title for better discoverability",
          priority: "high",
          category: "SEO"
        },
        {
          title: "Enhance Description",
          description: data.description?.slice(0, 150) || "Include timestamps, links, and relevant keywords in your description",
          priority: "high",
          category: "Engagement"
        },
        {
          title: "Strategic Tags",
          description: `Use these tags: ${data.tags?.slice(0, 5).join(", ")}`,
          priority: "medium",
          category: "Discovery"
        },
        {
          title: "Best Time to Post",
          description: "Post between 2-4 PM on weekdays for maximum engagement",
          priority: "medium",
          category: "Timing"
        },
        {
          title: "Thumbnail Strategy",
          description: "Use high contrast colors and readable text for better click-through rate",
          priority: "high",
          category: "Visual"
        }
      ];

      setSuggestions(boostSuggestions);
      
      toast({
        title: "Success",
        description: "Boost suggestions generated!",
      });
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate suggestions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "low": return "bg-green-500/10 text-green-500 border-green-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "SEO": return <Target className="h-4 w-4" />;
      case "Timing": return <Clock className="h-4 w-4" />;
      case "Discovery": return <TrendingUp className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Get Content Boost Suggestions</h3>
        </div>
        
        <div className="space-y-4">
          <Textarea
            placeholder="Enter your video topic or description to get personalized boost suggestions..."
            value={videoTopic}
            onChange={(e) => setVideoTopic(e.target.value)}
            className="min-h-[100px]"
          />
          
          <Button 
            onClick={generateSuggestions}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Boost Suggestions
              </>
            )}
          </Button>
        </div>
      </Card>

      {suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    {getCategoryIcon(suggestion.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{suggestion.title}</h4>
                      <Badge variant="outline" className={getPriorityColor(suggestion.priority)}>
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    <Badge variant="secondary" className="mt-2">
                      {suggestion.category}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default YouTubeBoostSuggestions;