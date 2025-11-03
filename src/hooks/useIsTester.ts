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
        const isTesterFlag = localStorage.getItem('is_tester');
        
        if (testerSessionToken && isTesterFlag === 'true') {
          // Verify the tester session token is still valid
          const { data, error } = await supabase
            .from("tester_sessions")
            .select("id, expires_at")
            .eq("session_token", testerSessionToken)
            .maybeSingle();

          if (error) {
            console.error("Error checking tester session:", error);
            localStorage.removeItem('tester_session_token');
            localStorage.removeItem('is_tester');
            setIsTester(false);
          } else if (data && new Date(data.expires_at) > new Date()) {
            setIsTester(true);
          } else {
            localStorage.removeItem('tester_session_token');
            localStorage.removeItem('is_tester');
            setIsTester(false);
          }
        } else {
          setIsTester(false);
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
