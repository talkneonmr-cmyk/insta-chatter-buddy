import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Youtube,
  Compass,
  Rocket,
  Brain,
  Radio
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

const researchModes = [
  { id: "search", label: "Web Search", icon: Globe, color: "from-blue-500 to-cyan-500", description: "Search the entire web" },
  { id: "research", label: "Deep Research", icon: Brain, color: "from-violet-500 to-purple-500", description: "AI-powered analysis" },
  { id: "news", label: "Live News", icon: Radio, color: "from-orange-500 to-red-500", description: "Real-time updates" },
  { id: "rag", label: "AI Analysis", icon: Sparkles, color: "from-pink-500 to-rose-500", description: "Smart summaries" },
  { id: "namecheck", label: "Name Check", icon: AtSign, color: "from-emerald-500 to-teal-500", description: "Brand availability" },
];

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
    { label: "Viral Content", query: "What types of videos are going viral on YouTube right now?", icon: Zap },
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

  const activeMode = researchModes.find(m => m.id === activeTab) || researchModes[0];

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Mesh */}
        <div className="absolute inset-0 bg-mesh opacity-60" />
        
        {/* Floating Orbs */}
        <div className="absolute top-20 left-[10%] w-72 h-72 bg-gradient-to-br from-violet-500/20 to-purple-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-[15%] w-96 h-96 bg-gradient-to-br from-pink-500/15 to-rose-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-1.5s' }} />
        <div className="absolute bottom-20 left-[20%] w-80 h-80 bg-gradient-to-br from-blue-500/15 to-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute bottom-40 right-[10%] w-64 h-64 bg-gradient-to-br from-orange-500/15 to-amber-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/dashboard')} 
                className="rounded-full hover:bg-primary/10 transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="relative p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                    <Compass className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight">
                    You Research
                  </h1>
                  <p className="text-sm text-muted-foreground hidden sm:block">
                    AI-Powered Real-Time Intelligence
                  </p>
                </div>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-600 border-violet-500/20 px-4 py-2 gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="hidden sm:inline">Powered by</span> You.com
            </Badge>
          </div>
        </div>
      </div>

      <div className="relative container mx-auto px-4 py-6 sm:py-10 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-sm text-muted-foreground animate-fade-in">
            <Rocket className="h-4 w-4 text-primary" />
            Discover what's trending across the internet
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Research Smarter,
            <span className="gradient-text block sm:inline"> Create Better</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Harness the power of AI to find trending topics, analyze competitors, and discover your next viral content idea.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="mb-6 sm:mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center scrollbar-hide">
            {researchModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setActiveTab(mode.id)}
                className={`
                  flex items-center gap-2 px-4 sm:px-5 py-3 rounded-2xl font-medium text-sm whitespace-nowrap transition-all duration-300 flex-shrink-0
                  ${activeTab === mode.id 
                    ? `bg-gradient-to-r ${mode.color} text-white shadow-lg scale-105` 
                    : 'bg-card/80 hover:bg-card border border-border/50 hover:border-primary/30 hover:scale-102'}
                `}
              >
                <mode.icon className="h-4 w-4" />
                <span>{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Search Card */}
        <Card className="card-glass border-border/50 shadow-xl mb-6 sm:mb-8 animate-fade-in overflow-hidden" style={{ animationDelay: '0.4s' }}>
          {/* Gradient Top Border */}
          <div className={`h-1 bg-gradient-to-r ${activeMode.color}`} />
          
          <CardHeader className="pb-4 px-4 sm:px-6 pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${activeMode.color}`}>
                <activeMode.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-heading">{activeMode.label}</CardTitle>
                <CardDescription>{activeMode.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-5 px-4 sm:px-6 pb-6">
            {activeTab !== "namecheck" ? (
              <>
                {/* Search Input */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="What do you want to research today?"
                        className="pl-12 h-14 text-base rounded-xl border-border/50 bg-background/50 focus:bg-background focus:border-primary/50 transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleSearch} 
                    disabled={isLoading}
                    size="lg"
                    className={`h-14 px-8 rounded-xl bg-gradient-to-r ${activeMode.color} hover:opacity-90 shadow-lg transition-all btn-3d`}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2" />
                        Research
                      </>
                    )}
                  </Button>
                </div>

                {/* Quick Prompts */}
                <div>
                  <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Quick research ideas
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-hide">
                    {quickPrompts.map((prompt, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickPrompt(prompt.query)}
                        className="text-xs rounded-full hover:bg-primary/5 hover:border-primary/30 hover:text-primary whitespace-nowrap flex-shrink-0 transition-all"
                        disabled={isLoading}
                      >
                        <prompt.icon className="h-3 w-3 mr-1.5" />
                        {prompt.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Name Checker Input */
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className="relative">
                      <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        value={nameToCheck}
                        onChange={(e) => setNameToCheck(e.target.value)}
                        placeholder="Enter your brand name..."
                        className="pl-12 h-14 text-base rounded-xl border-border/50 bg-background/50 focus:bg-background focus:border-emerald-500/50 transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && checkNameAvailability()}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={checkNameAvailability} 
                    disabled={isCheckingName}
                    size="lg"
                    className="h-14 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 shadow-lg transition-all btn-3d"
                  >
                    {isCheckingName ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2" />
                        Check Name
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Check if a YouTube channel (@username) and .com domain are available
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Name Check Loading */}
        {isCheckingName && (
          <Card className="card-glass border-emerald-500/20 animate-fade-in overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 blur-2xl opacity-40 animate-pulse" />
                  <div className="relative p-5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-xl">
                    <AtSign className="h-8 w-8 text-white animate-spin" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="font-heading font-semibold text-lg">Checking availability...</p>
                  <p className="text-sm text-muted-foreground">Scanning YouTube & domain registries</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Name Check Results */}
        {nameCheckResult && !isCheckingName && (
          <Card className={`card-glass border-2 animate-fade-in overflow-hidden ${nameCheckResult.bothAvailable ? 'border-emerald-500/30' : 'border-orange-500/30'}`}>
            <div className={`h-1 bg-gradient-to-r ${nameCheckResult.bothAvailable ? 'from-emerald-500 to-teal-500' : 'from-orange-500 to-red-500'}`} />
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
              <CardTitle className="flex items-center gap-3 text-lg sm:text-xl font-heading">
                {nameCheckResult.bothAvailable ? (
                  <div className="p-2 rounded-xl bg-emerald-500/10">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-orange-500/10">
                    <XCircle className="h-6 w-6 text-orange-500" />
                  </div>
                )}
                <span>"{nameCheckResult.name}"</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 space-y-4 pb-6">
              {/* Recommendation */}
              <div className={`p-4 rounded-xl border ${nameCheckResult.bothAvailable ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-orange-500/5 border-orange-500/20'}`}>
                <p className="text-sm font-medium">{nameCheckResult.recommendation}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {/* YouTube Result */}
                <div className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:scale-[1.02] ${nameCheckResult.youtube.available ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${nameCheckResult.youtube.available ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      <Youtube className={`h-5 w-5 ${nameCheckResult.youtube.available ? 'text-emerald-500' : 'text-red-500'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">YouTube</p>
                      <p className="text-xs text-muted-foreground">{nameCheckResult.youtube.handle}</p>
                    </div>
                  </div>
                  <Badge className={`${nameCheckResult.youtube.available ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
                    {nameCheckResult.youtube.error || (nameCheckResult.youtube.available ? "Available" : "Taken")}
                  </Badge>
                </div>

                {/* Domain Result */}
                <div className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:scale-[1.02] ${nameCheckResult.domain.available ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${nameCheckResult.domain.available ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      <Globe className={`h-5 w-5 ${nameCheckResult.domain.available ? 'text-emerald-500' : 'text-red-500'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Domain</p>
                      <p className="text-xs text-muted-foreground">{nameCheckResult.domain.name}</p>
                    </div>
                  </div>
                  <Badge className={`${nameCheckResult.domain.available ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
                    {nameCheckResult.domain.error || (nameCheckResult.domain.available ? "Available" : "Taken")}
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                {!nameCheckResult.youtube.available && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => copyToClipboard(`https://www.youtube.com/@${nameCheckResult.name}`)}
                  >
                    <Youtube className="h-3.5 w-3.5 mr-1.5" />
                    Copy Channel Link
                  </Button>
                )}
                {!nameCheckResult.domain.available && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => window.open(`https://${nameCheckResult.domain.name}`, '_blank')}
                  >
                    <Globe className="h-3.5 w-3.5 mr-1.5" />
                    Visit Website
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => copyToClipboard(`YouTube: ${nameCheckResult.youtube.handle} - ${nameCheckResult.youtube.available ? 'Available' : 'Taken'}\nDomain: ${nameCheckResult.domain.name} - ${nameCheckResult.domain.available ? 'Available' : 'Taken'}`)}
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy Results
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card className="card-glass border-primary/20 animate-fade-in overflow-hidden">
            <div className={`h-1 bg-gradient-to-r ${activeMode.color}`} />
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 blur-2xl opacity-40 animate-pulse" />
                  <div className={`relative p-5 rounded-full bg-gradient-to-r ${activeMode.color} shadow-xl`}>
                    <Globe className="h-8 w-8 text-white animate-spin" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="font-heading font-semibold text-lg">Researching the web...</p>
                  <p className="text-sm text-muted-foreground">Finding the latest and most relevant information</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {results && !isLoading && (
          <div className="space-y-4 animate-fade-in">
            {/* AI Answer */}
            {results.data.answer && (
              <Card className="card-glass border-violet-500/20 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
                <CardHeader className="px-4 sm:px-6 py-4">
                  <CardTitle className="flex items-center gap-3 text-lg font-heading">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10">
                      <Sparkles className="h-5 w-5 text-violet-500" />
                    </div>
                    AI Research Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 p-4 rounded-xl">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{results.data.answer}</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="rounded-full"
                      onClick={() => copyToClipboard(results.data.answer || '')}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Copy Summary
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Results */}
            {getResultsList().length > 0 && (
              <Card className="card-glass overflow-hidden">
                <div className={`h-1 bg-gradient-to-r ${activeMode.color}`} />
                <CardHeader className="px-4 sm:px-6 py-4">
                  <CardTitle className="flex items-center justify-between text-lg font-heading">
                    <span className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${activeMode.color.replace('from-', 'from-').replace(' to-', '/10 to-')}/10`}>
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      Search Results
                    </span>
                    <Badge variant="secondary" className="rounded-full px-3">{getResultsList().length} results</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-6">
                  <ScrollArea className="h-[400px] sm:h-[500px] pr-4">
                    <div className="space-y-3">
                      {getResultsList().map((result, idx) => (
                        <div 
                          key={idx} 
                          className="group p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all duration-300"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                                {result.title || 'Untitled'}
                              </h3>
                              {result.url && (
                                <p className="text-xs text-muted-foreground truncate mb-2 flex items-center gap-1">
                                  <Globe className="h-3 w-3" />
                                  {result.url}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {result.description || result.snippet || result.content || 'No description available'}
                              </p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {result.url && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg"
                                  onClick={() => window.open(result.url, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg"
                                onClick={() => copyToClipboard(
                                  `${result.title}\n${result.description || result.snippet || ''}\n${result.url || ''}`
                                )}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Sources */}
            {results.data.sources && results.data.sources.length > 0 && (
              <Card className="card-glass overflow-hidden">
                <CardHeader className="px-4 sm:px-6 py-4">
                  <CardTitle className="flex items-center gap-3 text-lg font-heading">
                    <div className="p-2 rounded-xl bg-muted">
                      <ExternalLink className="h-5 w-5" />
                    </div>
                    Sources
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-6">
                  <div className="flex flex-wrap gap-2">
                    {results.data.sources.map((source: any, idx: number) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 rounded-full px-3 py-1 transition-all"
                        onClick={() => source.url && window.open(source.url, '_blank')}
                      >
                        {source.title || source.name || `Source ${idx + 1}`}
                        <ExternalLink className="h-3 w-3 ml-1.5" />
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Results */}
            {!results.data.answer && getResultsList().length === 0 && (
              <Card className="card-glass">
                <CardContent className="py-16 text-center">
                  <div className="inline-flex p-4 rounded-2xl bg-muted/50 mb-4">
                    <Search className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No results found. Try a different search query.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Features Grid (when no results) */}
        {!results && !isLoading && activeTab !== "namecheck" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            {[
              { icon: TrendingUp, title: "Trend Discovery", desc: "Find what's trending in your niche", color: "from-violet-500 to-purple-500" },
              { icon: Users, title: "Competitor Analysis", desc: "Research successful creators", color: "from-pink-500 to-rose-500" },
              { icon: Newspaper, title: "Live News", desc: "Stay updated with latest news", color: "from-orange-500 to-red-500" },
              { icon: Sparkles, title: "AI Analysis", desc: "Get AI-powered summaries", color: "from-blue-500 to-cyan-500" },
            ].map((feature, idx) => (
              <Card 
                key={idx} 
                className="card-3d group cursor-pointer overflow-hidden"
              >
                <div className={`h-1 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <CardContent className="pt-6 px-4 pb-5">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} w-fit mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-heading font-semibold mb-1 text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground hidden sm:block">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
