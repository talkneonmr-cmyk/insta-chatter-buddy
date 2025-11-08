import { useState, useEffect } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2 } from "lucide-react";
import { GeneratedCaption } from "@/pages/CaptionGenerator";

const formSchema = z.object({
  reelIdea: z.string().min(10, "Please provide more details (at least 10 characters)"),
  contentType: z.enum(["reel", "post", "story"]),
  targetAudience: z.string(),
  brandVoice: z.enum(["professional", "casual", "humorous", "inspiring", "friendly"]),
  includeHashtags: z.boolean(),
  includeEmojis: z.boolean(),
  captionLength: z.enum(["short", "medium", "long"]),
});

type FormValues = z.infer<typeof formSchema>;

interface CaptionGeneratorFormProps {
  onCaptionGenerated: (caption: GeneratedCaption) => void;
  templateText?: string;
}

const CaptionGeneratorForm = ({ onCaptionGenerated, templateText }: CaptionGeneratorFormProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reelIdea: "",
      contentType: "reel",
      targetAudience: "general audience",
      brandVoice: "friendly",
      includeHashtags: true,
      includeEmojis: true,
      captionLength: "medium",
    },
  });

  const { plan } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    if (templateText) {
      form.setValue("reelIdea", templateText);
    }
  }, [templateText, form]);

  const onSubmit = async (values: FormValues) => {
    setIsGenerating(true);
    try {
      // Check usage limit
      const { data: limitCheck, error: limitError } = await supabase.functions.invoke('check-usage-limit', {
        body: { limitType: 'ai_captions' }
      });

      if (limitError) throw limitError;
      
      if (!limitCheck.canUse) {
        toast({
          title: "Limit Reached",
          description: limitCheck.message,
          variant: "destructive",
        });
        
        if (plan === 'free') {
          setTimeout(() => navigate('/pricing'), 2000);
        }
        setIsGenerating(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-caption', {
        body: {
          reelIdea: values.reelIdea,
          contentType: values.contentType,
          targetAudience: values.targetAudience,
          brandVoice: values.brandVoice,
          includeHashtags: values.includeHashtags,
          includeEmojis: values.includeEmojis,
          captionLength: values.captionLength,
        }
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        onCaptionGenerated(data.data);
        
        // Save to database
        const { error: dbError } = await supabase.from('generated_captions').insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          reel_idea: values.reelIdea,
          content_type: values.contentType,
          target_audience: values.targetAudience,
          brand_voice: values.brandVoice,
          caption: data.data.caption,
          hashtags: data.data.hashtags,
          description: data.data.description,
          hook_line: data.data.hookLine,
          call_to_action: data.data.callToAction,
          emoji_suggestions: data.data.emojiSuggestions,
          ai_model_used: data.data.metadata?.model,
          generation_time_ms: data.data.metadata?.processingTime,
        });

        if (dbError) console.error('Error saving caption:', dbError);

        toast({
          title: "Caption Generated! ✨",
          description: `Created in ${data.data.metadata?.processingTime}ms`,
        });
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error: any) {
      console.error('Error generating caption:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate caption. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const charCount = form.watch("reelIdea")?.length || 0;

  return (
    <Card className="border-2 shadow-lg slide-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary float-animation" />
          Generate Caption
        </CardTitle>
        <CardDescription>
          Describe your reel idea and let AI create a viral caption for you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="reelIdea"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reel/Post Idea *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Example: A before/after transformation showing how I organized my workspace using 5 simple IKEA hacks. Focus on the dramatic reveal at the end."
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <FormMessage />
                    <span>{charCount} characters</span>
                  </div>
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="reel">Reel</SelectItem>
                        <SelectItem value="post">Post</SelectItem>
                        <SelectItem value="story">Story</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brandVoice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Voice</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="humorous">Humorous</SelectItem>
                        <SelectItem value="inspiring">Inspiring</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="targetAudience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Audience</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general audience">General Audience</SelectItem>
                        <SelectItem value="fitness enthusiasts">Fitness Enthusiasts</SelectItem>
                        <SelectItem value="small business owners">Small Business Owners</SelectItem>
                        <SelectItem value="young professionals">Young Professionals</SelectItem>
                        <SelectItem value="content creators">Content Creators</SelectItem>
                        <SelectItem value="parents">Parents</SelectItem>
                        <SelectItem value="students">Students</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="captionLength"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caption Length: {field.value}</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        min={0}
                        max={2}
                        step={1}
                        value={[field.value === "short" ? 0 : field.value === "medium" ? 1 : 2]}
                        onValueChange={(value) => {
                          const lengths = ["short", "medium", "long"] as const;
                          field.onChange(lengths[value[0]]);
                        }}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Short (&lt;100)</span>
                        <span>Medium (100-200)</span>
                        <span>Long (200-300)</span>
                      </div>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="includeHashtags"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Include Hashtags</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Generate relevant hashtags for better reach
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="includeEmojis"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Include Emojis</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Add emojis to make the caption more engaging
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full"
              size="lg"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Caption
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CaptionGeneratorForm;
