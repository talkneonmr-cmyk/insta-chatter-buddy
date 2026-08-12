import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Instagram, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PENDING_KEY = "pending_oauth_provider";

const InstagramAccountConnect = () => {
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkConnection();

    // Handle OAuth callback only if we initiated an Instagram connect
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const pending = sessionStorage.getItem(PENDING_KEY);

    if (code && state && pending === "instagram") {
      sessionStorage.removeItem(PENDING_KEY);
      window.history.replaceState({}, document.title, window.location.pathname);
      handleCallback(code, state);
    }
  }, []);

  const checkConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("instagram_accounts")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setAccount(data);
    } finally {
      setLoading(false);
    }
  };

  const handleCallback = async (code: string, state: string) => {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("instagram-oauth", {
        body: { code, state, redirectOrigin: window.location.origin },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Instagram connected", description: `@${data.username}` });
      await checkConnection();
    } catch (err: any) {
      toast({
        title: "Connection failed",
        description: err?.message || "Could not connect Instagram",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("instagram-oauth/auth-url", {
        body: { redirectOrigin: window.location.origin },
      });
      if (error) throw error;
      if (!data?.authUrl) throw new Error("No auth URL");

      sessionStorage.setItem(PENDING_KEY, "instagram");
      window.location.href = data.authUrl;
    } catch (err: any) {
      toast({
        title: "Connection failed",
        description: err?.message || "Could not start Instagram connection",
        variant: "destructive",
      });
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!account) return;
    try {
      await supabase.from("instagram_accounts").delete().eq("id", account.id);
      setAccount(null);
      toast({ title: "Disconnected", description: "Instagram account removed" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to disconnect",
        variant: "destructive",
      });
    }
  };

  if (loading) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-pink-500/10">
            <Instagram className="h-5 w-5 text-pink-500" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold">Instagram Reels</h3>
            {account ? (
              <p className="text-sm text-muted-foreground inline-flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Connected as @{account.username}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground inline-flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Not connected — required for cross-posting Shorts to Reels
              </p>
            )}
          </div>
        </div>
        {account ? (
          <Button variant="outline" size="sm" onClick={handleDisconnect}>
            Disconnect
          </Button>
        ) : (
          <Button size="sm" onClick={handleConnect} disabled={connecting}>
            {connecting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Connecting...</>
            ) : (
              <>Connect Instagram</>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default InstagramAccountConnect;
