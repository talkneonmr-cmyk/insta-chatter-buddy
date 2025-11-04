import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface SubscriptionGuardProps {
  children: ReactNode;
  requiresPro?: boolean;
  featureName?: string;
}

export default function SubscriptionGuard({ 
  children, 
  requiresPro = false,
  featureName = "this feature"
}: SubscriptionGuardProps) {
  const { plan, isLoading } = useSubscription();
  const navigate = useNavigate();
  const [timedOut, setTimedOut] = useState(false);

  // Prevent indefinite loading from blocking pages
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 6000);
    return () => clearTimeout(t);
  }, []);

  if (isLoading && !timedOut) {
    return (
      <div className="flex items-center justify-center p-8">
        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  if (requiresPro && plan !== "pro") {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Upgrade to Pro</CardTitle>
              <CardDescription>
                Unlock {featureName} with a Pro subscription
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Pro Plan Benefits:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Unlimited video uploads</li>
              <li>✓ Unlimited AI captions</li>
              <li>✓ Up to 3 YouTube channels</li>
              <li>✓ Unlimited AI music generation</li>
              <li>✓ Advanced analytics</li>
              <li>✓ Priority support</li>
            </ul>
          </div>
          <Button 
            onClick={() => navigate("/pricing")} 
            className="w-full" 
            size="lg"
            variant="gradient"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to Pro - Only ₹699/month
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
