import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AutomationStats {
  activeRules: number;
  commentsProcessed: number;
  dmsSent: number;
  lastUpdated: Date;
}

export const useAutomationStats = () => {
  const [stats, setStats] = useState<AutomationStats>({
    activeRules: 0,
    commentsProcessed: 0,
    dmsSent: 0,
    lastUpdated: new Date(),
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Fetch active rules count
      const { count: rulesCount } = await supabase
        .from("automation_rules")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_active", true);

      // Fetch comments processed count
      const { count: commentsCount } = await supabase
        .from("comments_log")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch DMs sent count
      const { count: dmsCount } = await supabase
        .from("dms_sent")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setStats({
        activeRules: rulesCount || 0,
        commentsProcessed: commentsCount || 0,
        dmsSent: dmsCount || 0,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Set up realtime subscriptions
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "automation_rules",
        },
        () => fetchStats()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments_log",
        },
        () => fetchStats()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dms_sent",
        },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { stats, loading, refetch: fetchStats };
};
