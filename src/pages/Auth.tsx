import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, AlertCircle, Sparkles, Lock } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [showDisabledAlert, setShowDisabledAlert] = useState(false);
  const [isTesterLogin, setIsTesterLogin] = useState(false);
  const [testerKey, setTesterKey] = useState("");

  // Redirect if already authenticated
  useEffect(() => {

    // Then check regular auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowDisabledAlert(false);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('banned') || 
            error.message.toLowerCase().includes('user is banned')) {
          setShowDisabledAlert(true);
          throw new Error('disabled');
        }
        throw error;
      }

      toast({
        title: "Success!",
        description: "You're now signed in",
      });

      navigate("/");
    } catch (error: any) {
      console.error('Error signing in:', error);
      
      if (error.message !== 'disabled') {
        toast({
          title: "Error",
          description: error.message || "Failed to sign in",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Generate OTP
      const generatedOTP = generateOTP();
      
      // Store OTP and password in session storage
      sessionStorage.setItem('otp_email', email);
      sessionStorage.setItem('otp_password', password);
      sessionStorage.setItem('otp_code', generatedOTP);
      sessionStorage.setItem('otp_timestamp', Date.now().toString());

      // Send OTP email
      const { error: emailError } = await supabase.functions.invoke('send-otp-email', {
        body: { email, otp: generatedOTP }
      });

      if (emailError) throw emailError;

      setShowOtpInput(true);
      setResendTimer(60);
      
      toast({
        title: "Code sent!",
        description: "Check your email for the verification code",
      });
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const storedEmail = sessionStorage.getItem('otp_email');
      const storedPassword = sessionStorage.getItem('otp_password');
      const storedOTP = sessionStorage.getItem('otp_code');
      const timestamp = sessionStorage.getItem('otp_timestamp');

      // Verify email matches
      if (storedEmail !== email) {
        throw new Error("Email mismatch");
      }

      // Check if OTP is expired (10 minutes)
      if (timestamp && Date.now() - parseInt(timestamp) > 10 * 60 * 1000) {
        throw new Error("Verification code expired. Please request a new one.");
      }

      // Verify OTP
      if (otp !== storedOTP) {
        throw new Error("Invalid verification code");
      }

      // Sign up with Supabase
      const { error } = await supabase.auth.signUp({
        email: email,
        password: storedPassword || password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });

      if (error) throw error;

      // Clear OTP data
      sessionStorage.removeItem('otp_email');
      sessionStorage.removeItem('otp_password');
      sessionStorage.removeItem('otp_code');
      sessionStorage.removeItem('otp_timestamp');

      toast({
        title: "Success!",
        description: "Account created successfully",
      });

      navigate("/");
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    setOtp("");
    await handleSignUp(new Event('submit') as any);
  };

  const handleTesterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowDisabledAlert(false);

    try {
      const { data, error } = await supabase.functions.invoke('validate-tester-key', {
        body: { keyCode: testerKey }
      });

      if (error) throw error;

      // Store tester session token in localStorage
      localStorage.setItem('tester_session_token', data.sessionToken);
      localStorage.setItem('is_tester', 'true');
      
      toast({
        title: "Success!",
        description: "Logged in as tester",
      });

      // Force reload to apply tester session
      window.location.href = "/";
    } catch (error: any) {
      console.error('Error with tester key:', error);
      toast({
        title: "Invalid Key",
        description: error.message || "The tester key is invalid or expired",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8 bg-mesh relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl float-animation" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl float-animation" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/20 rounded-full blur-3xl float-animation" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
        {/* Left Side - Branding & Hero */}
        <div className="hidden lg:block space-y-8 slide-in">
          <div className="space-y-6">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-gradient-to-br from-primary to-secondary p-4 rounded-2xl shadow-xl">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold gradient-text">Fabuos</h1>
                <p className="text-sm text-muted-foreground">AI-Powered Content Studio</p>
              </div>
            </div>

            {/* Hero Content */}
            <div className="space-y-4">
              <h2 className="text-5xl font-bold leading-tight">
                Create Amazing <span className="gradient-text">Content</span> in Minutes
              </h2>
              <p className="text-lg text-muted-foreground">
                Transform your ideas into professional content with AI-powered tools. Generate scripts, thumbnails, music, and more - all in one place.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4 pt-4">
              {[
                { icon: "✨", title: "AI Script Writer", desc: "Generate engaging scripts instantly" },
                { icon: "🎵", title: "Music Generator", desc: "Create custom background music" },
                { icon: "🎨", title: "Thumbnail Designer", desc: "Design eye-catching thumbnails" },
                { icon: "🎙️", title: "Voice Tools", desc: "Text-to-speech & voice cloning" },
              ].map((feature, i) => (
                <div 
                  key={i} 
                  className="flex items-start gap-4 p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all hover:translate-x-2"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="text-3xl">{feature.icon}</div>
                  <div>
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6">
              {[
                { value: "10K+", label: "Active Users" },
                { value: "50K+", label: "Content Created" },
                { value: "4.9/5", label: "User Rating" },
              ].map((stat, i) => (
                <div key={i} className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
                  <div className="text-2xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <Card className="w-full card-glass border-border/50 scale-in overflow-hidden shadow-2xl">
          {/* Mobile Logo */}
          <div className="lg:hidden p-6 pb-0">
            <div className="flex items-center gap-3 justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-xl blur-md opacity-75" />
                <div className="relative bg-gradient-to-br from-primary to-secondary p-3 rounded-xl shadow-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">Fabuos</h1>
                <p className="text-xs text-muted-foreground">AI Content Studio</p>
              </div>
            </div>
          </div>

          {/* Decorative top gradient bar */}
          <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-accent" />
        
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-full blur-md opacity-75 animate-pulse" />
              <div className="relative p-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm border border-primary/30">
                {showOtpInput ? (
                  <Mail className="w-8 h-8 text-primary" />
                ) : isTesterLogin ? (
                  <Lock className="w-8 h-8 text-accent" />
                ) : (
                  <Sparkles className="w-8 h-8 text-primary" />
                )}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold gradient-text">
              {showOtpInput ? "Verify Your Email" : isTesterLogin ? "Tester Access" : (isSignUp ? "Create Account" : "Welcome Back")}
            </CardTitle>
            <CardDescription className="text-base">
              {showOtpInput 
                ? "Enter the 6-digit code sent to your email"
                : isTesterLogin 
                  ? "Enter your tester access key"
                  : (isSignUp ? "Sign up to get started" : "Sign in to your account")
              }
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="pb-8">
          {showDisabledAlert && (
            <Alert variant="info" className="mb-6 animate-fade-in border-destructive/50 bg-destructive/5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Acc disabled please appeal
              </AlertDescription>
            </Alert>
          )}
          
          {!showOtpInput && !isTesterLogin ? (
            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-5 slide-in">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:bg-background transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={6}
                    className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:bg-background transition-all"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-all shadow-lg hover:shadow-xl btn-3d"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {isSignUp ? "Creating account..." : "Signing in..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    {isSignUp ? "Create Account" : "Sign In"}
                  </>
                )}
              </Button>
              <div className="text-center space-y-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSignUp(!isSignUp)}
                  disabled={isLoading}
                  className="text-sm hover:text-primary transition-colors"
                >
                  {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                </Button>
              </div>
            </form>
          ) : isTesterLogin ? (
            <form onSubmit={handleTesterLogin} className="space-y-5 slide-in">
              <div className="space-y-2">
                <Label htmlFor="testerKey" className="text-sm font-medium">Tester Access Key</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-accent transition-colors" />
                  <Input
                    id="testerKey"
                    type="text"
                    placeholder="Enter your tester key"
                    value={testerKey}
                    onChange={(e) => setTesterKey(e.target.value.trim())}
                    required
                    disabled={isLoading}
                    className="pl-10 h-12 font-mono bg-background/50 border-border/50 focus:border-accent/50 focus:bg-background transition-all"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-accent to-accent-glow hover:opacity-90 transition-all shadow-lg hover:shadow-xl btn-3d"
                disabled={isLoading || !testerKey}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-5 w-5" />
                    Access as Tester
                  </>
                )}
              </Button>
              <div className="text-center pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsTesterLogin(false);
                    setTesterKey("");
                  }}
                  disabled={isLoading}
                  className="text-sm hover:text-accent transition-colors"
                >
                  Back to regular login
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-5 slide-in">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="pl-10 h-12 bg-muted/50 border-border/50"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="otp" className="text-sm font-medium">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  disabled={isLoading}
                  maxLength={6}
                  className="text-center text-3xl tracking-widest font-mono h-14 bg-background/50 border-border/50 focus:border-primary/50 focus:bg-background transition-all"
                />
                <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Code expires in 10 minutes
                </p>
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-all shadow-lg hover:shadow-xl btn-3d"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Verify & Sign In
                  </>
                )}
              </Button>
              <div className="text-center space-y-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowOtpInput(false);
                    setOtp("");
                  }}
                  disabled={isLoading}
                  className="text-sm hover:text-primary transition-colors"
                >
                  Change email
                </Button>
                <div className="text-sm">
                  {resendTimer > 0 ? (
                    <span className="text-muted-foreground">Resend code in <span className="font-semibold text-primary">{resendTimer}s</span></span>
                  ) : (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={handleResendOTP}
                      disabled={isLoading}
                      className="p-0 h-auto text-primary hover:text-primary/80 font-medium"
                    >
                      Resend verification code
                    </Button>
                  )}
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Auth;
