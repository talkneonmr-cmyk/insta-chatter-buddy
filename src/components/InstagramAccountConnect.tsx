import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Instagram, LogOut, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function InstagramAccountConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const queryClient = useQueryClient();

  const { data: instagramAccount } = useQuery({
    queryKey: ["instagram_account"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("instagram_accounts")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("instagram_accounts")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram_account"] });
      toast.success("Instagram account disconnected");
    },
    onError: () => {
      toast.error("Failed to disconnect Instagram account");
    },
  });

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in first");
        return;
      }

      const { data, error } = await supabase.functions.invoke('instagram-oauth/auth-url', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error("Error connecting Instagram:", error);
      toast.error("Failed to connect Instagram account");
    } finally {
      setIsConnecting(false);
    }
  };

  if (instagramAccount) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Instagram className="w-5 h-5 text-primary" />
              <CardTitle>Instagram Connected</CardTitle>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <CardDescription>@{instagramAccount.username}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Instagram className="w-5 h-5 text-primary" />
          <CardTitle>Connect Instagram</CardTitle>
        </div>
        <CardDescription>Connect your Instagram account to enable automation</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleConnect} disabled={isConnecting}>
          <Instagram className="w-4 h-4 mr-2" />
          {isConnecting ? "Connecting..." : "Connect Instagram"}
        </Button>
      </CardContent>
    </Card>
  );
}
