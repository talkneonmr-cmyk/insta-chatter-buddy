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
  Zap,
  AtSign,
  CheckCircle2,
  XCircle,
  Youtube
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

interface NameCheckResult {
  success: boolean;
  name: string;
  youtube: {
    handle: string;
    available: boolean;
    error?: string;
  };
  domain: {
    name: string;
    available: boolean;
    error?: string;
  };
  bothAvailable: boolean;
  recommendation: string;
}

export default function YouResearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  
  // Name checker state
  const [nameToCheck, setNameToCheck] = useState("");
  const [nameCheckResult, setNameCheckResult] = useState<NameCheckResult | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);

  // Quick research prompts for creators
  const quickPrompts = [
    { label: "Trending Topics", query: "What are the top trending YouTube video topics this week?", icon: TrendingUp },
    { label: "Viral Content Ideas", query: "What types of videos are going viral on YouTube right now?", icon: Zap },
    { label: "Audience Insights", query: "What do YouTube audiences want to see in 2024?", icon: Users },
    { label: "Algorithm Tips", query: "Latest YouTube algorithm changes and how to optimize for them", icon: BarChart3 },
    { label: "Thumbnail Ideas", query: "What makes YouTube thumbnails get the most clicks?", icon: Target },
    { label: "SEO Strategies", query: "Best YouTube SEO practices for maximum visibility", icon: Search },
  ];

  const checkNameAvailability = async () => {
    if (!nameToCheck.trim()) {
      toast.error("Please enter a name to check");
      return;
    }

    setIsCheckingName(true);
    setNameCheckResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('check-name-availability', {
        body: { name: nameToCheck }
      });

      if (error) {
        console.error('Name check error:', error);
        toast.error("Failed to check name availability");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setNameCheckResult(data);
      toast.success("Name check complete!");
    } catch (err) {
      console.error('Name check error:', err);
      toast.error("Failed to check name");
    } finally {
      setIsCheckingName(false);
    }
  };

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
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="h-8 w-8 sm:h-10 sm:w-10">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  <Globe className="h-4 w-4 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h1 className="text-base sm:text-xl font-bold">You Research</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">AI-Powered Real-Time Research</p>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-600 border-violet-500/20 text-xs px-2 py-0.5 sm:px-3 sm:py-1">
              <Sparkles className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Powered by </span>You.com
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-6xl">
        {/* Search Section */}
        <Card className="mb-4 sm:mb-8 border-2 border-primary/10 shadow-xl">
          <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Research Hub
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Search the web in real-time for trending topics and content ideas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
            {/* Research Mode Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-5 w-full h-auto p-1">
                <TabsTrigger value="search" className="flex items-center justify-center gap-1 px-1 py-1.5 sm:py-2 text-xs sm:text-sm">
                  <Search className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Web Search</span>
                </TabsTrigger>
                <TabsTrigger value="research" className="flex items-center justify-center gap-1 px-1 py-1.5 sm:py-2 text-xs sm:text-sm">
                  <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Deep Research</span>
                </TabsTrigger>
                <TabsTrigger value="news" className="flex items-center justify-center gap-1 px-1 py-1.5 sm:py-2 text-xs sm:text-sm">
                  <Newspaper className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Live News</span>
                </TabsTrigger>
                <TabsTrigger value="rag" className="flex items-center justify-center gap-1 px-1 py-1.5 sm:py-2 text-xs sm:text-sm">
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">AI Analysis</span>
                </TabsTrigger>
                <TabsTrigger value="namecheck" className="flex items-center justify-center gap-1 px-1 py-1.5 sm:py-2 text-xs sm:text-sm">
                  <AtSign className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Name Check</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search Input - Show for non-namecheck tabs */}
            {activeTab !== "namecheck" ? (
              <>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search for trends, topics..."
                      className="pl-10 h-10 sm:h-12 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Button 
                    onClick={handleSearch} 
                    disabled={isLoading}
                    className="h-10 sm:h-12 px-4 sm:px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 w-full sm:w-auto"
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
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">Quick Research:</p>
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-hide">
                    {quickPrompts.map((prompt, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickPrompt(prompt.query)}
                        className="text-xs hover:bg-primary/5 hover:border-primary/30 whitespace-nowrap flex-shrink-0"
                        disabled={isLoading}
                      >
                        <prompt.icon className="h-3 w-3 mr-1" />
                        {prompt.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Name Checker Input */
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={nameToCheck}
                      onChange={(e) => setNameToCheck(e.target.value)}
                      placeholder="Enter channel/brand name to check..."
                      className="pl-10 h-10 sm:h-12 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && checkNameAvailability()}
                    />
                  </div>
                  <Button 
                    onClick={checkNameAvailability} 
                    disabled={isCheckingName}
                    className="h-10 sm:h-12 px-4 sm:px-6 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 w-full sm:w-auto"
                  >
                    {isCheckingName ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Check Name
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Check if a YouTube channel (@username) and .com domain are available for your brand name.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Name Check Results */}
        {isCheckingName && (
          <Card className="border-2 border-primary/10">
            <CardContent className="py-10 sm:py-16">
              <div className="flex flex-col items-center justify-center gap-3 sm:gap-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 to-pink-500 blur-xl opacity-30 animate-pulse" />
                  <div className="relative p-3 sm:p-4 rounded-full bg-gradient-to-r from-red-500 to-pink-500">
                    <AtSign className="h-6 w-6 sm:h-8 sm:w-8 text-white animate-spin" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm sm:text-base">Checking availability...</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Checking YouTube & domain</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {nameCheckResult && !isCheckingName && (
          <Card className={`border-2 ${nameCheckResult.bothAvailable ? 'border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5' : 'border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-red-500/5'}`}>
            <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                {nameCheckResult.bothAvailable ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-orange-500" />
                )}
                Name Availability: "{nameCheckResult.name}"
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 space-y-4">
              {/* Recommendation */}
              <div className={`p-3 rounded-lg ${nameCheckResult.bothAvailable ? 'bg-green-500/10 border border-green-500/20' : 'bg-orange-500/10 border border-orange-500/20'}`}>
                <p className="text-sm font-medium">{nameCheckResult.recommendation}</p>
              </div>

              {/* YouTube Result */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${nameCheckResult.youtube.available ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    <Youtube className={`h-5 w-5 ${nameCheckResult.youtube.available ? 'text-green-500' : 'text-red-500'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">YouTube Channel</p>
                    <p className="text-xs text-muted-foreground">{nameCheckResult.youtube.handle}</p>
                  </div>
                </div>
                <Badge variant={nameCheckResult.youtube.available ? "default" : "destructive"} className={nameCheckResult.youtube.available ? "bg-green-500" : ""}>
                  {nameCheckResult.youtube.error || (nameCheckResult.youtube.available ? "Available" : "Taken")}
                </Badge>
              </div>

              {/* Domain Result */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${nameCheckResult.domain.available ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    <Globe className={`h-5 w-5 ${nameCheckResult.domain.available ? 'text-green-500' : 'text-red-500'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Domain</p>
                    <p className="text-xs text-muted-foreground">{nameCheckResult.domain.name}</p>
                  </div>
                </div>
                <Badge variant={nameCheckResult.domain.available ? "default" : "destructive"} className={nameCheckResult.domain.available ? "bg-green-500" : ""}>
                  {nameCheckResult.domain.error || (nameCheckResult.domain.available ? "Available" : "Taken")}
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                {!nameCheckResult.youtube.available && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      copyToClipboard(`https://www.youtube.com/@${nameCheckResult.name}`);
                    }}
                  >
                    <Youtube className="h-3 w-3 mr-1" />
                    Copy Channel Link
                  </Button>
                )}
                {!nameCheckResult.domain.available && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://${nameCheckResult.domain.name}`, '_blank')}
                  >
                    <Globe className="h-3 w-3 mr-1" />
                    Visit Website
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(`YouTube: ${nameCheckResult.youtube.handle} - ${nameCheckResult.youtube.available ? 'Available' : 'Taken'}\nDomain: ${nameCheckResult.domain.name} - ${nameCheckResult.domain.available ? 'Available' : 'Taken'}`)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Results
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {isLoading && (
          <Card className="border-2 border-primary/10">
            <CardContent className="py-10 sm:py-16">
              <div className="flex flex-col items-center justify-center gap-3 sm:gap-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 blur-xl opacity-30 animate-pulse" />
                  <div className="relative p-3 sm:p-4 rounded-full bg-gradient-to-r from-violet-500 to-purple-500">
                    <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-white animate-spin" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm sm:text-base">Researching the web...</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Finding the latest information</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {results && !isLoading && (
          <div className="space-y-3 sm:space-y-4">
            {/* AI Answer (for research/rag modes) */}
            {results.data.answer && (
              <Card className="border-2 border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
                <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" />
                    AI Research Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap text-sm">{results.data.answer}</p>
                  </div>
                  <div className="mt-3 sm:mt-4 flex gap-2">
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
                <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                  <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                    <span className="flex items-center gap-2">
                      <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      Search Results
                    </span>
                    <Badge variant="secondary" className="text-xs">{getResultsList().length} results</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <ScrollArea className="h-[400px] sm:h-[600px] pr-2 sm:pr-4">
                    <div className="space-y-3 sm:space-y-4">
                      {getResultsList().map((result, idx) => (
                        <Card key={idx} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-start justify-between gap-2 sm:gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 mb-1">
                                  {result.title || 'Untitled'}
                                </h3>
                                {result.url && (
                                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate mb-1 sm:mb-2">
                                    {result.url}
                                  </p>
                                )}
                                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3">
                                  {result.description || result.snippet || result.content || 'No description available'}
                                </p>
                              </div>
                              <div className="flex flex-row sm:flex-col gap-1">
                                {result.url && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 sm:h-8 sm:w-8"
                                    onClick={() => window.open(result.url, '_blank')}
                                  >
                                    <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 sm:h-8 sm:w-8"
                                  onClick={() => copyToClipboard(
                                    `${result.title}\n${result.description || result.snippet || ''}\n${result.url || ''}`
                                  )}
                                >
                                  <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
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
                <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5" />
                    Sources
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="flex flex-wrap gap-2">
                    {results.data.sources.map((source: any, idx: number) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-primary/10 text-xs"
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
                <CardContent className="py-8 sm:py-12 text-center">
                  <Search className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-50" />
                  <p className="text-sm sm:text-base text-muted-foreground">No results found. Try a different search query.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Features Grid (when no results) */}
        {!results && !isLoading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-8">
            <Card className="border-violet-500/20 hover:border-violet-500/40 transition-colors">
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-violet-500/10 w-fit mb-2 sm:mb-4">
                  <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-violet-500" />
                </div>
                <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Trend Discovery</h3>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Find what's trending right now in your niche with real-time web data
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-500/20 hover:border-purple-500/40 transition-colors">
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-purple-500/10 w-fit mb-2 sm:mb-4">
                  <Users className="h-4 w-4 sm:h-6 sm:w-6 text-purple-500" />
                </div>
                <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Competitor Analysis</h3>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Research what successful creators are doing and find content gaps
                </p>
              </CardContent>
            </Card>

            <Card className="border-pink-500/20 hover:border-pink-500/40 transition-colors">
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-pink-500/10 w-fit mb-2 sm:mb-4">
                  <Newspaper className="h-4 w-4 sm:h-6 sm:w-6 text-pink-500" />
                </div>
                <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Live News</h3>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Stay updated with the latest news in your industry for timely content
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-500/20 hover:border-blue-500/40 transition-colors">
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-blue-500/10 w-fit mb-2 sm:mb-4">
                  <Sparkles className="h-4 w-4 sm:h-6 sm:w-6 text-blue-500" />
                </div>
                <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">AI Analysis</h3>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
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