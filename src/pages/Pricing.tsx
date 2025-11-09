import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";

export default function Pricing() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const subscription = useSubscription();

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-razorpay-subscription');

      if (error) throw error;

      if (data.shortUrl && data.paymentLinkId) {
        // Store payment link ID for verification after redirect
        localStorage.setItem('razorpay_payment_link_id', data.paymentLinkId);
        window.location.href = data.shortUrl;
      }
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const freePlanFeatures = [
    "3 Video Uploads per day (Resets daily)",
    "4 AI Captions per day (Resets daily)",
    "4 AI Thumbnails per day (Resets daily)",
    "4 AI Scripts per day (Resets daily)",
    "4 AI Music tracks per day (Resets daily)",
    "4 AI Hashtags per day (Resets daily)",
    "4 AI Trend Analyses per day (Resets daily)",
    "4 AI SEO Optimizations per day (Resets daily)",
    "4 YouTube Channels",
    "20 YouTube Operations per day (uploads, analytics, bulk ops, etc.)",
    "All limits reset every 24 hours",
    "10 minutes Text to Speech (Multilingual v2)",
    "20 minutes Text to Speech (Flash v2.5)",
    "Speech to Text API",
    "Voice Isolator API",
    "Voice Changer API",
    "Dubbing API",
    "15 minutes of AI Agents",
    "Basic Support"
  ];

  const proPlanFeatures = [
    "Unlimited Video Uploads",
    "Unlimited AI Captions",
    "10 AI Thumbnails per day",
    "Unlimited AI Scripts",
    "200 AI Music tracks per day",
    "20 AI Trend Analyses per day",
    "20 AI Hashtags per day",
    "20 AI SEO Optimizations per day",
    "Unlimited YouTube Channels",
    "Unlimited YouTube Operations (uploads, analytics, bulk ops, playlists, etc.)",
    "Limits reset daily at 24-hour intervals",
    "New billing cycle resets all limits",
    "Priority Processing",
    "Premium Support"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12 slide-in">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Choose Your Plan</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Start free and upgrade when you need more power
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card className={`relative scale-in ${subscription.plan === 'free' ? 'border-primary' : ''}`}>
            {subscription.plan === 'free' && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1">
                  <Crown className="h-4 w-4" />
                  Current Plan
                </span>
              </div>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 float-animation" />
                Free Plan
              </CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">₹0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {freePlanFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {subscription.plan === 'free' ? (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled
                >
                  Current Plan
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/auth')}
                >
                  Get Started
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Pro Plan */}
          <Card className={`relative shadow-lg scale-in glow-effect ${subscription.plan === 'pro' ? 'border-primary' : 'border-primary/50'}`}>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1">
                {subscription.plan === 'pro' ? (
                  <>
                    <Crown className="h-4 w-4" />
                    Current Plan
                  </>
                ) : (
                  'Most Popular'
                )}
              </span>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary float-animation" />
                Pro Plan
              </CardTitle>
              <CardDescription>For serious content creators</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">₹699</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {proPlanFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {subscription.plan === 'pro' ? (
                <Button
                  variant="gradient"
                  className="w-full"
                  disabled
                >
                  Current Plan
                </Button>
              ) : (
                <Button
                  variant="gradient"
                  className="w-full"
                  onClick={handleSubscribe}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Upgrade to Pro"}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            All plans include secure payment processing via Razorpay
          </p>
        </div>
      </div>
    </div>
  );
}