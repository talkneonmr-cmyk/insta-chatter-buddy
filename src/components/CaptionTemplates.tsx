import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Heart, BookOpen, Megaphone, MessageCircle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Template {
  id: string;
  name: string;
  category: string;
  template_structure: string;
  suggested_hashtags: string[];
  icon: string;
  usage_count: number;
}

const iconMap: Record<string, any> = {
  Zap,
  Heart,
  BookOpen,
  Megaphone,
  MessageCircle,
  Sparkles,
};

interface CaptionTemplatesProps {
  onTemplateApply: (template: string) => void;
}

const CaptionTemplates = ({ onTemplateApply }: CaptionTemplatesProps) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('caption_templates')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = async (template: Template) => {
    // Pre-fill the form immediately
    onTemplateApply(template.template_structure);

    // Increment usage count in the background (ignore RLS failures)
    (async () => {
      const { error } = await supabase
        .from('caption_templates')
        .update({ usage_count: template.usage_count + 1 })
        .eq('id', template.id);
      if (error) console.warn('Template usage update failed:', error);
    })();

    // Attempt to copy to clipboard, but don't fail UX if it doesn't work
    let copied = false;
    try {
      await navigator.clipboard.writeText(template.template_structure);
      copied = true;
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }

    toast({
      title: "Template Applied! ✨",
      description: copied
        ? `${template.name} copied to clipboard`
        : `${template.name} applied to form. You can paste manually if needed.`,
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading templates...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Viral Templates
        </CardTitle>
        <CardDescription>Quick-start with proven caption structures</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {templates.map((template) => {
            const Icon = iconMap[template.icon] || Sparkles;
            return (
              <div
                key={template.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => applyTemplate(template)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">{template.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
                  {template.template_structure}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {template.suggested_hashtags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-xs text-primary">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm">
                    Use Template
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CaptionTemplates;
