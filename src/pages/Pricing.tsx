import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Pricing() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
    "2 Video Uploads per month",
    "2 AI Captions per month",
    "2 AI Thumbnails per day",
    "5 AI Scripts per day",
    "5 AI Music tracks per month",
    "1 YouTube Channel",
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
    "Unlimited YouTube Channels",
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
          <Card className="relative scale-in">
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
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/auth')}
              >
                Get Started
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Plan */}
          <Card className="relative border-primary shadow-lg scale-in glow-effect">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                Most Popular
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
              <Button
                variant="gradient"
                className="w-full"
                onClick={handleSubscribe}
                disabled={loading}
              >
                {loading ? "Processing..." : "Upgrade to Pro"}
              </Button>
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