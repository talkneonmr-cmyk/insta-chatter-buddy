import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionPlan = "free" | "pro";

export interface SubscriptionStatus {
  plan: SubscriptionPlan;
  status: string;
  isLoading: boolean;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    plan: "free",
    status: "active",
    isLoading: true,
  });

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setSubscription({ plan: "free", status: "active", isLoading: false });
          return;
        }

        const { data, error } = await supabase
          .from("user_subscriptions")
          .select("plan, status")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching subscription:", error);
          setSubscription({ plan: "free", status: "active", isLoading: false });
          return;
        }

        if (!data) {
          // Create a default free subscription row for the user
          const { error: insertError } = await supabase
            .from("user_subscriptions")
            .insert({ user_id: user.id, plan: "free", status: "active" });
          if (insertError) {
            console.warn("Could not create default subscription row:", insertError);
          }
          setSubscription({ plan: "free", status: "active", isLoading: false });
          return;
        }

        const normalizedPlan = (data.plan === 'free_trial' ? 'free' : data.plan) as SubscriptionPlan;
        setSubscription({
          plan: normalizedPlan,
          status: data.status,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error in subscription hook:", error);
        setSubscription({ plan: "free", status: "active", isLoading: false });
      }
    };

    fetchSubscription();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("subscription-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_subscriptions",
        },
        () => {
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return subscription;
}
