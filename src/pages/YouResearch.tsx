import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  TrendingUp, 
  Globe, 
  Newspaper, 
  Lightbulb, 
  ArrowLeft,
  Loader2,
  ExternalLink,
  Copy,
  Sparkles,
  Target,
  Users,
  BarChart3,
  Zap
} from "lucide-react";

interface SearchResult {
  title?: string;
  description?: string;
  url?: string;
  snippet?: string;
  content?: string;
}

interface ResearchResponse {
  success: boolean;
  mode: string;
  data: {
    hits?: SearchResult[];
    results?: SearchResult[];
    answer?: string;
    sources?: any[];
    web_results?: SearchResult[];
  };
}

export default function YouResearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("search");

  // Quick research prompts for creators
  const quickPrompts = [
    { label: "Trending Topics", query: "What are the top trending YouTube video topics this week?", icon: TrendingUp },
    { label: "Viral Content Ideas", query: "What types of videos are going viral on YouTube right now?", icon: Zap },
    { label: "Audience Insights", query: "What do YouTube audiences want to see in 2024?", icon: Users },
    { label: "Algorithm Tips", query: "Latest YouTube algorithm changes and how to optimize for them", icon: BarChart3 },
    { label: "Thumbnail Ideas", query: "What makes YouTube thumbnails get the most clicks?", icon: Target },
    { label: "SEO Strategies", query: "Best YouTube SEO practices for maximum visibility", icon: Search },
  ];

  const performResearch = async (searchQuery: string, mode: string) => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setIsLoading(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('you-research', {
        body: {
          query: searchQuery,
          mode,
          options: {
            limit: 10,
            country: 'US',
          }
        }
      });

      if (error) {
        console.error('Research error:', error);
        toast.error("Research failed. Please try again.");
        return;
      }

      if (data?.error) {
        console.error('API error:', data.error);
        toast.error(data.error);
        return;
      }

      setResults(data);
      toast.success("Research complete!");
    } catch (err) {
      console.error('Research error:', err);
      toast.error("Failed to perform research");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    performResearch(query, activeTab);
  };

  const handleQuickPrompt = (prompt: string) => {
    setQuery(prompt);
    performResearch(prompt, activeTab);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getResultsList = (): SearchResult[] => {
    if (!results?.data) return [];
    return results.data.hits || results.data.results || results.data.web_results || [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  <Globe className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">You Research</h1>
                  <p className="text-sm text-muted-foreground">AI-Powered Real-Time Research</p>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-600 border-violet-500/20">
              <Sparkles className="h-3 w-3 mr-1" />
              Powered by You.com
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Search Section */}
        <Card className="mb-8 border-2 border-primary/10 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Research Hub
            </CardTitle>
            <CardDescription>
              Search the web in real-time to find trending topics, competitor insights, and content ideas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Research Mode Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="search" className="flex items-center gap-1">
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Web Search</span>
                </TabsTrigger>
                <TabsTrigger value="research" className="flex items-center gap-1">
                  <Lightbulb className="h-4 w-4" />
                  <span className="hidden sm:inline">Deep Research</span>
                </TabsTrigger>
                <TabsTrigger value="news" className="flex items-center gap-1">
                  <Newspaper className="h-4 w-4" />
                  <span className="hidden sm:inline">Live News</span>
                </TabsTrigger>
                <TabsTrigger value="rag" className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">AI Analysis</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for trends, topics, competitors, or any research query..."
                  className="pl-10 h-12"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isLoading}
                className="h-12 px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Research
                  </>
                )}
              </Button>
            </div>

            {/* Quick Prompts */}
            <div className="pt-2">
              <p className="text-sm text-muted-foreground mb-3">Quick Research for Creators:</p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickPrompt(prompt.query)}
                    className="text-xs hover:bg-primary/5 hover:border-primary/30"
                    disabled={isLoading}
                  >
                    <prompt.icon className="h-3 w-3 mr-1" />
                    {prompt.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {isLoading && (
          <Card className="border-2 border-primary/10">
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 blur-xl opacity-30 animate-pulse" />
                  <div className="relative p-4 rounded-full bg-gradient-to-r from-violet-500 to-purple-500">
                    <Globe className="h-8 w-8 text-white animate-spin" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-medium">Researching the web...</p>
                  <p className="text-sm text-muted-foreground">Finding the latest information for you</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {results && !isLoading && (
          <div className="space-y-4">
            {/* AI Answer (for research/rag modes) */}
            {results.data.answer && (
              <Card className="border-2 border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-violet-500" />
                    AI Research Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap">{results.data.answer}</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(results.data.answer || '')}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Results */}
            {getResultsList().length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      Search Results
                    </span>
                    <Badge variant="secondary">{getResultsList().length} results</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                      {getResultsList().map((result, idx) => (
                        <Card key={idx} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                                  {result.title || 'Untitled'}
                                </h3>
                                {result.url && (
                                  <p className="text-xs text-muted-foreground truncate mb-2">
                                    {result.url}
                                  </p>
                                )}
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                  {result.description || result.snippet || result.content || 'No description available'}
                                </p>
                              </div>
                              <div className="flex flex-col gap-1">
                                {result.url && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => window.open(result.url, '_blank')}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => copyToClipboard(
                                    `${result.title}\n${result.description || result.snippet || ''}\n${result.url || ''}`
                                  )}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Sources (for RAG mode) */}
            {results.data.sources && results.data.sources.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ExternalLink className="h-5 w-5" />
                    Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {results.data.sources.map((source: any, idx: number) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-primary/10"
                        onClick={() => source.url && window.open(source.url, '_blank')}
                      >
                        {source.title || source.name || `Source ${idx + 1}`}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Results */}
            {!results.data.answer && getResultsList().length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No results found. Try a different search query.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Features Grid (when no results) */}
        {!results && !isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <Card className="border-violet-500/20 hover:border-violet-500/40 transition-colors">
              <CardContent className="pt-6">
                <div className="p-3 rounded-xl bg-violet-500/10 w-fit mb-4">
                  <TrendingUp className="h-6 w-6 text-violet-500" />
                </div>
                <h3 className="font-semibold mb-2">Trend Discovery</h3>
                <p className="text-sm text-muted-foreground">
                  Find what's trending right now in your niche with real-time web data
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-500/20 hover:border-purple-500/40 transition-colors">
              <CardContent className="pt-6">
                <div className="p-3 rounded-xl bg-purple-500/10 w-fit mb-4">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="font-semibold mb-2">Competitor Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Research what successful creators are doing and find content gaps
                </p>
              </CardContent>
            </Card>

            <Card className="border-pink-500/20 hover:border-pink-500/40 transition-colors">
              <CardContent className="pt-6">
                <div className="p-3 rounded-xl bg-pink-500/10 w-fit mb-4">
                  <Newspaper className="h-6 w-6 text-pink-500" />
                </div>
                <h3 className="font-semibold mb-2">Live News</h3>
                <p className="text-sm text-muted-foreground">
                  Stay updated with the latest news in your industry for timely content
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-500/20 hover:border-blue-500/40 transition-colors">
              <CardContent className="pt-6">
                <div className="p-3 rounded-xl bg-blue-500/10 w-fit mb-4">
                  <Sparkles className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="font-semibold mb-2">AI Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Get AI-powered summaries and insights from multiple web sources
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
