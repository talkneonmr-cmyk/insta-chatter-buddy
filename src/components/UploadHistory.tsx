import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, History } from "lucide-react";
import { format } from "date-fns";

interface UploadHistory {
  id: string;
  title: string;
  youtube_video_id: string | null;
  status: string;
  upload_date: string;
  error_message: string | null;
}

const UploadHistory = () => {
  const [history, setHistory] = useState<UploadHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('video_uploads_history')
        .select('*')
        .eq('user_id', user.id)
        .order('upload_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching upload history:', error);
      toast({
        title: "Error",
        description: "Failed to load upload history.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading upload history...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No upload history yet</p>
        <p className="text-sm text-muted-foreground">Your uploaded videos will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((item) => (
        <Card key={item.id} className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                {item.status === 'uploaded' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <h4 className="font-semibold">{item.title}</h4>
              </div>
              
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant={item.status === 'uploaded' ? 'default' : 'destructive'}>
                  {item.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(item.upload_date), 'MMM dd, yyyy hh:mm a')}
                </span>
              </div>

              {item.youtube_video_id && (
                <a
                  href={`https://youtube.com/watch?v=${item.youtube_video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline block"
                >
                  View on YouTube
                </a>
              )}

              {item.error_message && (
                <p className="text-sm text-red-500">{item.error_message}</p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default UploadHistory;