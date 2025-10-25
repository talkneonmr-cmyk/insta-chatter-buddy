import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Shield, MessageCircle, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AutomationResult {
  trigger_match: "YES" | "NO";
  trigger_reason: string;
  action: "SEND" | "BLOCK" | "DO_NOT_CONTACT";
  message_text: string;
  delay_seconds: number;
  retry_on_failure: boolean;
  tags: string[];
  safety_check: string;
  notes: string;
}

const AutomationTester = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AutomationResult | null>(null);

  // Configuration state
  const [ruleKeywords, setRuleKeywords] = useState("interested, yes, send me, want");
  const [tone, setTone] = useState("friendly");
  const [goal, setGoal] = useState("share coupon");
  const [creatorName, setCreatorName] = useState("Lovable Me");
  const [postTitle, setPostTitle] = useState("Amazing Product Launch");
  const [postUrl, setPostUrl] = useState("https://example.com/post");

  // Comment state
  const [commentText, setCommentText] = useState("");
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");

  const fuzzyMatch = (text: string, keywords: string[]): boolean => {
    const lowerText = text.toLowerCase();
    const optOutWords = ["stop", "unsubscribe", "no thanks", "nahi chahiye", "stop dm", "not interested"];
    
    if (optOutWords.some(word => lowerText.includes(word))) {
      return false;
    }
    
    return keywords.some(keyword => 
      lowerText.includes(keyword.toLowerCase()) || 
      lowerText.includes(keyword.toLowerCase().replace(/\s+/g, ''))
    );
  };

  const generateDM = (): string => {
    const greeting = firstName ? `Hi ${firstName}` : `Hi @${username}`;
    const ctaMap: Record<string, string> = {
      "share coupon": "Reply 'YES' to get your exclusive coupon code! 💝",
      "book call": `Book your free call here: ${postUrl}`,
      "send info": "Reply to this message and I'll send you all the details!",
    };
    
    const cta = ctaMap[goal] || "Let me know if you're interested!";
    return `${greeting}! Thanks for your comment on "${postTitle}". ${cta}`;
  };

  const processComment = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      const keywords = ruleKeywords.split(",").map(k => k.trim());
      const matches = fuzzyMatch(commentText, keywords);
      
      const optOutWords = ["stop", "unsubscribe", "no thanks", "nahi chahiye", "stop dm"];
      const isOptOut = optOutWords.some(word => commentText.toLowerCase().includes(word));
      
      const hasSensitiveRequest = commentText.toLowerCase().match(/password|bank|ssn|credit card|payment info/);
      
      let action: "SEND" | "BLOCK" | "DO_NOT_CONTACT" = "SEND";
      let safetyCheck = "CLEAN";
      let message = "";
      
      if (isOptOut) {
        action = "DO_NOT_CONTACT";
        safetyCheck = "User opted out";
      } else if (hasSensitiveRequest) {
        action = "BLOCK";
        safetyCheck = "BLOCK_REASON: Sensitive data request detected";
      } else if (matches) {
        message = generateDM();
      } else {
        action = "SEND";
        message = "";
      }
      
      const automationResult: AutomationResult = {
        trigger_match: matches && !isOptOut ? "YES" : "NO",
        trigger_reason: matches ? `Comment contains keywords: ${keywords.filter(k => commentText.toLowerCase().includes(k.toLowerCase())).join(", ")}` : "No keyword match found",
        action,
        message_text: action === "SEND" ? message : "",
        delay_seconds: matches ? 2 : 0,
        retry_on_failure: true,
        tags: matches ? ["auto_generated", goal.replace(" ", "_"), "followup"] : [],
        safety_check: safetyCheck,
        notes: `Processed at ${new Date().toISOString()}`
      };
      
      setResult(automationResult);
      setIsProcessing(false);
      
      toast({
        title: matches ? "✅ Rule Triggered!" : "ℹ️ No Match",
        description: automationResult.trigger_reason,
      });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 rounded-2xl bg-gradient-to-r from-primary via-secondary to-accent mb-4">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Lovable Me Assistant
          </h1>
          <p className="text-muted-foreground text-lg">
            Instagram Comment → DM Automation Tester
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Configuration Panel */}
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <CardTitle>Automation Rules</CardTitle>
              </div>
              <CardDescription>Configure your automation behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keywords">Trigger Keywords (comma-separated)</Label>
                <Input
                  id="keywords"
                  value={ruleKeywords}
                  onChange={(e) => setRuleKeywords(e.target.value)}
                  placeholder="interested, yes, send me, want"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger id="tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal">Goal</Label>
                  <Select value={goal} onValueChange={setGoal}>
                    <SelectTrigger id="goal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="share coupon">Share Coupon</SelectItem>
                      <SelectItem value="book call">Book Call</SelectItem>
                      <SelectItem value="send info">Send Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="creator">Creator Name</Label>
                <Input
                  id="creator"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postTitle">Post Title</Label>
                <Input
                  id="postTitle"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postUrl">Post URL</Label>
                <Input
                  id="postUrl"
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Testing Panel */}
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-secondary" />
                <CardTitle>Test Comment</CardTitle>
              </div>
              <CardDescription>Simulate an Instagram comment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comment">Comment Text</Label>
                <Textarea
                  id="comment"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Yes! I'm interested, please send me the details"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name (optional)</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Sarah"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="sarah_smith"
                  />
                </div>
              </div>

              <Button
                onClick={processComment}
                disabled={!commentText || !username || isProcessing}
                className="w-full bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity"
                size="lg"
              >
                {isProcessing ? "Processing..." : "Test Automation"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        {result && (
          <Card className="border-2 border-primary/20 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                <CardTitle>Automation Result</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant={result.trigger_match === "YES" ? "default" : "secondary"}>
                  Trigger: {result.trigger_match}
                </Badge>
                <Badge variant={result.action === "SEND" ? "default" : result.action === "BLOCK" ? "destructive" : "secondary"}>
                  Action: {result.action}
                </Badge>
                <Badge variant="outline">{result.safety_check}</Badge>
                {result.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>

              {/* Trigger Reason */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Trigger Reason</Label>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  {result.trigger_reason}
                </p>
              </div>

              {/* Generated DM */}
              {result.message_text && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Generated DM</Label>
                  <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-4 rounded-lg border-2 border-primary/10">
                    <p className="text-sm">{result.message_text}</p>
                  </div>
                </div>
              )}

              {/* JSON Output */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Full JSON Response</Label>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Delay:</span>{" "}
                  <span className="font-semibold">{result.delay_seconds}s</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Retry:</span>{" "}
                  <span className="font-semibold">{result.retry_on_failure ? "Yes" : "No"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AutomationTester;
