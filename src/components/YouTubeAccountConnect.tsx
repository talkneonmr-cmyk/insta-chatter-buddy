import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Youtube, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const YouTubeAccountConnect = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [channelInfo, setChannelInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('youtube_accounts')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setIsConnected(true);
        setChannelInfo(data);
      }
    } catch (error) {
      console.error('Error checking YouTube connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    toast({
      title: "YouTube OAuth Setup Required",
      description: "Please configure YouTube OAuth credentials in your project settings to enable account connection.",
    });
  };

  const handleDisconnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('youtube_accounts')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setIsConnected(false);
      setChannelInfo(null);
      toast({
        title: "Success",
        description: "YouTube account disconnected successfully.",
      });
    } catch (error) {
      console.error('Error disconnecting YouTube account:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect YouTube account.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Youtube className="h-5 w-5 text-red-500 animate-pulse" />
          <p className="text-sm text-muted-foreground">Checking YouTube connection...</p>
        </div>
      </Card>
    );
  }

  if (isConnected && channelInfo) {
    return (
      <Alert className="border-green-500/20 bg-green-500/10">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <p className="font-medium">Connected to YouTube</p>
            <p className="text-sm text-muted-foreground">Channel: {channelInfo.channel_title}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleDisconnect}>
            Disconnect
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-yellow-500/20 bg-yellow-500/10">
      <AlertCircle className="h-4 w-4 text-yellow-500" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <p className="font-medium">YouTube Account Not Connected</p>
          <p className="text-sm text-muted-foreground">Connect your YouTube account to upload and schedule videos</p>
        </div>
        <Button onClick={handleConnect} size="sm">
          <Youtube className="h-4 w-4 mr-2" />
          Connect YouTube
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default YouTubeAccountConnect;