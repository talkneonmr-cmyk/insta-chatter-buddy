import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { plan, status, isLoading } = useSubscription();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkPayment = async () => {
      // Wait a bit for webhook to process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      setChecking(false);
    };

    checkPayment();
  }, [navigate]);

  if (checking || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-center text-muted-foreground">
                Verifying your payment...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSuccess = plan === "pro" && status === "active";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex flex-col items-center space-y-4">
            {isSuccess ? (
              <>
                <div className="p-3 bg-green-500/10 rounded-full">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <CardTitle className="text-2xl text-center">Payment Successful!</CardTitle>
                <CardDescription className="text-center">
                  Your Pro subscription is now active
                </CardDescription>
              </>
            ) : (
              <>
                <div className="p-3 bg-yellow-500/10 rounded-full">
                  <XCircle className="h-12 w-12 text-yellow-500" />
                </div>
                <CardTitle className="text-2xl text-center">Payment Processing</CardTitle>
                <CardDescription className="text-center">
                  Your payment is being processed. Please check back in a few moments.
                </CardDescription>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Plan:</span>
              <span className="text-sm font-medium capitalize">{plan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              <span className="text-sm font-medium capitalize">{status}</span>
            </div>
          </div>

          {isSuccess && (
            <div className="bg-primary/10 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-sm">What's included:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✓ Unlimited video uploads</li>
                <li>✓ Unlimited AI captions</li>
                <li>✓ Unlimited AI music generation</li>
                <li>✓ Up to 3 YouTube channels</li>
                <li>✓ Priority support</li>
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate("/")} className="w-full" size="lg">
              Go to Dashboard
            </Button>
            {!isSuccess && (
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="w-full"
              >
                Refresh Status
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
