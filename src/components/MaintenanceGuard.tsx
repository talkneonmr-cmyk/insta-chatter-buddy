import { useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import Maintenance from "@/pages/Maintenance";
import { Loader2 } from "lucide-react";

interface MaintenanceGuardProps {
  children: ReactNode;
}

export function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();

  useEffect(() => {
    checkMaintenanceMode();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("app_settings_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "app_settings",
          filter: "key=eq.maintenance_mode",
        },
        (payload) => {
          const newValue = payload.new as { value: { enabled: boolean } };
          setIsMaintenanceMode(newValue.value?.enabled || false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkMaintenanceMode = async () => {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .single();

      if (error) throw error;
      const value = data?.value as { enabled?: boolean } | null;
      setIsMaintenanceMode(value?.enabled || false);
    } catch (error) {
      console.error("Error checking maintenance mode:", error);
      setIsMaintenanceMode(false);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking both maintenance mode and admin status
  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If maintenance mode is on and user is NOT admin, show maintenance page
  if (isMaintenanceMode && !isAdmin) {
    return <Maintenance />;
  }

  // Otherwise, render children normally
  return <>{children}</>;
}
