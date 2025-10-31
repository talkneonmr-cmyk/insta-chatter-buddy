import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Star, StarOff, Trash2, Copy, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface Script {
  id: string;
  title: string;
  video_topic: string;
  video_length: string;
  tone: string;
  script_content: string;
  created_at: string;
  is_favorite: boolean;
}

const ScriptHistory = () => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingScript, setViewingScript] = useState<Script | null>(null);
  const { toast } = useToast();

  const fetchScripts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('generated_scripts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setScripts(data || []);
    } catch (error) {
      console.error('Error fetching scripts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScripts();

    // Set up realtime subscription
    const channel = supabase
      .channel('scripts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generated_scripts'
        },
        () => {
          fetchScripts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleFavorite = async (id: string, currentFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('generated_scripts')
        .update({ is_favorite: !currentFavorite })
        .eq('id', id);

      if (error) throw error;

      setScripts(prev => 
        prev.map(s => s.id === id ? { ...s, is_favorite: !currentFavorite } : s)
      );

      toast({
        title: currentFavorite ? "Removed from favorites" : "Added to favorites"
      });
    } catch (error) {
      toast({
        title: "Error updating favorite",
        variant: "destructive"
      });
    }
  };

  const deleteScript = async (id: string) => {
    try {
      const { error } = await supabase
        .from('generated_scripts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setScripts(prev => prev.filter(s => s.id !== id));

      toast({
        title: "Script deleted"
      });
    } catch (error) {
      toast({
        title: "Error deleting script",
        variant: "destructive"
      });
    }
  };

  const copyScript = (script: string) => {
    navigator.clipboard.writeText(script);
    toast({
      title: "Copied to clipboard!"
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading history...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (scripts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No scripts yet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Generate your first AI script to see it here!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Script History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scripts.map((script) => (
              <div
                key={script.id}
                className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{script.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{script.video_length}</span>
                    <span>•</span>
                    <span className="capitalize">{script.tone}</span>
                    <span>•</span>
                    <span>{format(new Date(script.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(script.id, script.is_favorite)}
                  >
                    {script.is_favorite ? (
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ) : (
                      <StarOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingScript(script)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyScript(script.script_content)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteScript(script.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* View Script Dialog */}
      <Dialog open={!!viewingScript} onOpenChange={() => setViewingScript(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{viewingScript?.title}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap">{viewingScript?.script_content}</div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ScriptHistory;
