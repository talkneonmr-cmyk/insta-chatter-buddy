import { useEffect, useState } from "react";
import { Wrench, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function Maintenance() {
  const [message, setMessage] = useState("We are currently performing scheduled maintenance. Please check back soon.");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchMaintenanceMessage();
  }, []);

  const fetchMaintenanceMessage = async () => {
    try {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .single();

      const value = data?.value as { message?: string } | null;
      if (value?.message) {
        setMessage(value.message);
      }
    } catch (error) {
      console.error("Error fetching maintenance message:", error);
    }
  };

  const checkStatus = async () => {
    setChecking(true);
    try {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .single();

      const value = data?.value as { enabled?: boolean } | null;
      if (!value?.enabled) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error checking status:", error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Animated Icon */}
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-orange-500 to-yellow-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
          <div className="relative bg-gradient-to-br from-muted to-muted/50 p-8 rounded-full border border-border/50">
            <Wrench className="h-16 w-16 text-primary animate-bounce" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-orange-500 to-yellow-500 bg-clip-text text-transparent">
            Under Maintenance
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">We'll be back shortly</span>
          </div>
        </div>

        {/* Message */}
        <p className="text-lg text-muted-foreground leading-relaxed px-4">
          {message}
        </p>

        {/* Progress Animation */}
        <div className="flex justify-center gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-pulse"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>

        {/* Check Status Button */}
        <Button
          variant="outline"
          size="lg"
          onClick={checkStatus}
          disabled={checking}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
          {checking ? "Checking..." : "Check Status"}
        </Button>

        {/* Footer */}
        <p className="text-xs text-muted-foreground/60">
          Thank you for your patience. If this persists, please contact support.
        </p>
      </div>
    </div>
  );
}
