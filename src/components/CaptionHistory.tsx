import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { History, Trash2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface CaptionHistoryItem {
  id: string;
  reel_idea: string;
  caption: string;
  hashtags: string[];
  content_type: string;
  brand_voice: string;
  created_at: string;
}

const CaptionHistory = () => {
  const { toast } = useToast();
  const [history, setHistory] = useState<CaptionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_captions')
        .select('id, reel_idea, caption, hashtags, content_type, brand_voice, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCaption = async (id: string) => {
    try {
      const { error } = await supabase
        .from('generated_captions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHistory(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Deleted",
        description: "Caption removed from history",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete caption",
        variant: "destructive",
      });
    }
  };

  const copyCaption = async (caption: string, hashtags: string[]) => {
    const fullText = `${caption}\n\n${hashtags.map(h => `#${h}`).join(' ')}`;
    try {
      await navigator.clipboard.writeText(fullText);
      toast({
        title: "Copied!",
        description: "Caption copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Recent Captions
        </CardTitle>
        <CardDescription>Your last 10 generated captions</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No captions generated yet. Create your first one!
          </p>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.content_type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.brand_voice}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  <p className="text-sm font-medium mb-2 line-clamp-2">
                    {item.reel_idea}
                  </p>

                  <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
                    {item.caption}
                  </p>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyCaption(item.caption, item.hashtags)}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCaption(item.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default CaptionHistory;
