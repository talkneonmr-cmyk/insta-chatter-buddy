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
    
    // Check for OAuth callback code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    console.log('[YouTube OAuth] URL params - code:', code, 'state:', state);
    
    if (code && state) {
      handleOAuthCallback(code, state);
    }
  }, []);

  const handleOAuthCallback = async (code: string, state: string) => {
    try {
      setLoading(true);
      console.log('[YouTube OAuth] Exchanging code for tokens...');
      
      // Exchange code for tokens
      const { data, error } = await supabase.functions.invoke('youtube-oauth', {
        body: { code, state },
      });

      if (error) throw error as any;

      console.log('[YouTube OAuth] Exchange success:', data);
      
      // Increment usage for connecting a YouTube channel
      await supabase.functions.invoke('increment-usage', {
        body: { usageType: 'youtube_channels' }
      });
      
      toast({
        title: "Success",
        description: `Connected to YouTube channel: ${data.channelTitle}`,
      });

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      await checkConnection();
    } catch (error) {
      console.error('[YouTube OAuth] Token exchange error:', error);
      toast({
        title: "Error",
        description: "Failed to complete YouTube connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handleConnect = async () => {
    try {
      setLoading(true);
      
      // Get OAuth URL
      const { data: authData, error: authError } = await supabase.functions.invoke('youtube-oauth/auth-url');
      
      if (authError) {
        // Check if it's a limit error
        if (authError.message && authError.message.includes('limit')) {
          toast({
            title: "Limit Reached",
            description: authError.message,
            variant: "destructive",
          });
          return;
        }
        throw authError;
      }

      // Try top-level redirect; fallback to new tab; final fallback copies link
      try {
        if (window.top && window.top !== window) {
          (window.top as Window).location.href = authData.authUrl;
          return;
        }
        window.location.assign(authData.authUrl);
      } catch (navErr) {
        const popup = window.open(authData.authUrl, '_blank', 'noopener,noreferrer');
        if (!popup) {
          try {
            await navigator.clipboard.writeText(authData.authUrl);
            toast({
              title: 'Open YouTube authorization',
              description: 'Popup blocked. Auth link copied to clipboard—paste it in a new tab.',
            });
          } catch {
            toast({
              title: 'Open YouTube authorization',
              description: 'Popup blocked. Please allow popups or open the link manually from your browser address bar.',
            });
          }
        }
      } finally {
        setLoading(false);
      }

    } catch (error) {
      console.error('OAuth initiation error:', error);
      toast({
        title: "Error",
        description: "Failed to start YouTube connection.",
        variant: "destructive",
      });
      setLoading(false);
    }
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