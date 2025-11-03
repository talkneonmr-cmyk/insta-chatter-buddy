import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useIsTester() {
  const [isTester, setIsTester] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkTester = async () => {
      try {
        // Check if there's a tester session token in localStorage
        const testerSessionToken = localStorage.getItem('tester_session_token');
        
        if (testerSessionToken) {
          // Verify the tester session token
          const { data, error } = await supabase
            .from("tester_sessions")
            .select("id, expires_at")
            .eq("session_token", testerSessionToken)
            .maybeSingle();

          if (error) {
            console.error("Error checking tester session:", error);
            localStorage.removeItem('tester_session_token');
            setIsTester(false);
          } else if (data && new Date(data.expires_at) > new Date()) {
            setIsTester(true);
          } else {
            localStorage.removeItem('tester_session_token');
            setIsTester(false);
          }
        } else {
          // Check if user has tester role in user_roles table (legacy support)
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data, error } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", user.id)
              .eq("role", "tester" as any)
              .maybeSingle();

            if (error) {
              console.error("Error checking tester role:", error);
              setIsTester(false);
            } else {
              setIsTester(!!data);
            }
          } else {
            setIsTester(false);
          }
        }
      } catch (error) {
        console.error("Error in tester check:", error);
        setIsTester(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkTester();
  }, []);

  return { isTester, isLoading };
}
