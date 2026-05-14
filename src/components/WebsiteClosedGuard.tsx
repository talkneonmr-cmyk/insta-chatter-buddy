import { useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import WebsiteClosed from "@/pages/WebsiteClosed";
import { Loader2 } from "lucide-react";

interface WebsiteClosedGuardProps {
  children: ReactNode;
}

export function WebsiteClosedGuard({ children }: WebsiteClosedGuardProps) {
  const [isClosed, setIsClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();

  useEffect(() => {
    checkClosedStatus();

    const channel = supabase
      .channel("website_closed_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "app_settings",
          filter: "key=eq.website_closed",
        },
        (payload) => {
          const newValue = payload.new as { value: { enabled: boolean } };
          setIsClosed(newValue.value?.enabled || false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkClosedStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "website_closed")
        .single();

      if (error) throw error;
      const value = data?.value as { enabled?: boolean } | null;
      setIsClosed(value?.enabled || false);
    } catch (error) {
      console.error("Error checking website closed status:", error);
      setIsClosed(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center ucs-surface-0 ucs-text">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isClosed && !isAdmin) {
    return <WebsiteClosed />;
  }

  return <>{children}</>;
}
