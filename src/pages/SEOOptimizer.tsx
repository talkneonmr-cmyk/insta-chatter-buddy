import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Sparkles, Copy, Check } from "lucide-react";

import SubscriptionGuard from "@/components/SubscriptionGuard";
import TesterGuard from "@/components/TesterGuard";

export default function SEOOptimizer() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [niche, setNiche] = useState("");
  const [loading, setLoading] = useState(false);
  const [optimization, setOptimization] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleOptimize = async () => {
    if (!title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a video title.",
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

      // Pre-check usage to provide friendly messaging before hitting AI
      const { data: limitCheck } = await supabase.functions.invoke('check-usage-limit', {
        body: { limitType: 'ai_seo' }
      });

      if (limitCheck && limitCheck.canUse === false) {
        toast({
          title: "Daily limit reached",
          description: "Free: 5/day. Upgrade to Pro for 20/day or check back after reset.",
          action: (
            <Button variant="default" onClick={() => navigate('/pricing')}>
              Upgrade
            </Button>
          ),
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('optimize-seo', {
        body: { title, description, niche }
      });

      if (error) {
        // Handle 403 from backend gracefully
        // @ts-ignore
        if (error.status === 403 || (typeof error.message === 'string' && error.message.toLowerCase().includes('daily limit'))) {
          toast({
            title: "Daily limit reached",
            description: "Free: 5/day. Upgrade to Pro for 20/day or check back after reset.",
            action: (
              <Button variant="default" onClick={() => navigate('/pricing')}>
                Upgrade
              </Button>
            ),
          });
          return;
        }
        throw error;
      }

      if (data.optimization) {
        setOptimization(data.optimization);
        
        // Increment usage tracking
        await supabase.functions.invoke('increment-usage', {
          body: { usageType: 'ai_seo' }
        });

        toast({
          title: "SEO Optimization Complete!",
          description: "Your content has been optimized for search.",
        });
      }
    } catch (error: any) {
      console.error('Error optimizing SEO:', error);
      const msg = (typeof (error as any)?.message === 'string' ? (error as any).message : '') as string;
      if ((error as any)?.status === 403 || msg.toLowerCase().includes('daily limit')) {
        toast({
          title: "Daily limit reached",
          description: "Free: 5/day. Upgrade to Pro for 20/day or check back after reset.",
          action: (
            <Button variant="default" onClick={() => navigate('/pricing')}>
              Upgrade
            </Button>
          ),
        });
      } else {
        toast({
          title: "Optimization Failed",
          description: msg || "Failed to optimize SEO",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    
      <TesterGuard featureName="SEO Optimizer">
        <SubscriptionGuard>
          <div className="max-w-6xl mx-auto p-4 space-y-8">
          <div className="text-center space-y-2 slide-in">
            <h1 className="text-4xl font-bold gradient-text flex items-center justify-center gap-2">
              <Search className="h-10 w-10" />
              AI SEO Optimizer
            </h1>
            <p className="text-muted-foreground text-lg">
              Optimize your content for maximum discoverability and ranking
            </p>
          </div>

          <Card className="card-3d border-2">
            <CardHeader>
              <CardTitle>Optimize for SEO</CardTitle>
              <CardDescription>
                Get AI-powered SEO optimization for your videos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Video Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter your current video title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Enter your current description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="niche">Niche (Optional)</Label>
                <Input
                  id="niche"
                  placeholder="e.g., Tech, Gaming, Education..."
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                />
              </div>

              <Button
                onClick={handleOptimize}
                disabled={loading}
                className="w-full"
                variant="gradient"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Optimize SEO
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {optimization && (
            <div className="space-y-4">
              <Card className="card-3d border-primary scale-in">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Optimized Title</CardTitle>
                    <Badge variant="default">SEO Score: {optimization.seo_score}/100</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-lg font-semibold">{optimization.optimized_title}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(optimization.optimized_title, 'Title')}
                    >
                      {copied === 'Title' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-3d scale-in">
                <CardHeader>
                  <CardTitle>Keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {optimization.keywords?.map((keyword: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => copyToClipboard(optimization.keywords.join(', '), 'Keywords')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-3d scale-in">
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {optimization.tags?.slice(0, 30).map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => copyToClipboard(optimization.tags.join(', '), 'Tags')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All
                  </Button>
                </CardContent>
              </Card>

              {optimization.optimized_description && (
                <Card className="card-3d scale-in">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Optimized Description</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(optimization.optimized_description, 'Description')}
                      >
                        {copied === 'Description' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={optimization.optimized_description}
                      readOnly
                      className="min-h-[200px]"
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </SubscriptionGuard>
      </TesterGuard>
    
  );
}
