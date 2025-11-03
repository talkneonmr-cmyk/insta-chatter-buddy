import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useIsTester() {
  const [isTester, setIsTester] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkTester = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsTester(false);
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "tester")
          .maybeSingle();

        if (error) {
          console.error("Error checking tester role:", error);
          setIsTester(false);
        } else {
          setIsTester(!!data);
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
