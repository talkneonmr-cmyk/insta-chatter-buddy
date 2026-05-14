import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Maintenance from "@/pages/Maintenance";
import WebsiteClosed from "@/pages/WebsiteClosed";
import { Loader2 } from "lucide-react";

interface AppStatusGuardProps {
  children: ReactNode;
  checkMaintenance?: boolean;
}

type AppSetting = {
  key: string;
  value: { enabled?: boolean } | null;
};

export function AppStatusGuard({ children, checkMaintenance = true }: AppStatusGuardProps) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  useEffect(() => {
    let active = true;

    const loadStatus = async () => {
      try {
        const [{ data: sessionData }, { data: settings }] = await Promise.all([
          supabase.auth.getSession(),
          supabase
            .from("app_settings")
            .select("key, value")
            .in("key", checkMaintenance ? ["website_closed", "maintenance_mode"] : ["website_closed"]),
        ]);

        const userId = sessionData.session?.user?.id;
        let admin = false;

        if (userId) {
          const { data: role } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .eq("role", "admin")
            .maybeSingle();
          admin = !!role;
        }

        if (!active) return;

        const settingRows = (settings || []) as AppSetting[];
        const closed = settingRows.find((row) => row.key === "website_closed")?.value?.enabled || false;
        const maintenance = settingRows.find((row) => row.key === "maintenance_mode")?.value?.enabled || false;

        setIsAdmin(admin);
        setIsClosed(closed);
        setIsMaintenanceMode(maintenance);
      } catch (error) {
        console.error("Error checking app status:", error);
        if (active) {
          setIsClosed(false);
          setIsMaintenanceMode(false);
          setIsAdmin(false);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadStatus();

    const channel = supabase
      .channel("app_status_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "app_settings" },
        (payload) => {
          const row = payload.new as AppSetting;
          if (row.key === "website_closed") setIsClosed(row.value?.enabled || false);
          if (row.key === "maintenance_mode") setIsMaintenanceMode(row.value?.enabled || false);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [checkMaintenance]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isClosed && !isAdmin) return <WebsiteClosed />;
  if (checkMaintenance && isMaintenanceMode && !isAdmin) return <Maintenance />;

  return <>{children}</>;
}
