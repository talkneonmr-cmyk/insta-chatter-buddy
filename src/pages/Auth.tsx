import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, AlertCircle, Sparkles, Lock, ArrowLeft, KeyRound } from "lucide-react";

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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    // Check if this is a password reset callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'true') {
      setShowForgotPassword(true);
    }

    // Then check regular auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !urlParams.get('reset')) {
        navigate('/');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setShowForgotPassword(true);
      } else if (session && !urlParams.get('reset')) {
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) throw error;

      setResetSent(true);
      toast({
        title: "Check your email!",
        description: "We've sent you a password reset link",
      });
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your password has been updated",
      });

      // Clear the reset parameter and navigate to login
      window.history.replaceState({}, '', '/auth');
      setShowForgotPassword(false);
      navigate('/');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        try {
          if (window.top && window.top !== window) {
            (window.top as Window).location.href = data.url;
            return;
          }
          window.location.assign(data.url);
        } catch (navErr) {
          const popup = window.open(data.url, '_blank', 'noopener,noreferrer');
          if (!popup) {
            try {
              await navigator.clipboard.writeText(data.url);
              toast({
                title: 'Open Google sign-in',
                description: 'Popup blocked. Sign-in link copied—paste it in a new tab.',
              });
            } catch {
              toast({
                title: 'Open Google sign-in',
                description: 'Popup blocked. Please allow popups or open the link manually.',
              });
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [showAuthForm, setShowAuthForm] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-mesh opacity-30" />
      
      {/* Animated floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-gradient-to-br from-accent/20 via-primary/10 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '1s', animationDuration: '8s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-secondary/20 via-accent/10 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s', animationDuration: '10s' }} />
      </div>

      {!showAuthForm ? (
        // Landing/Welcome Screen
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <header className="p-6 md:p-8 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl blur-xl opacity-75 animate-pulse" />
                <div className="relative bg-gradient-to-br from-primary via-secondary to-accent p-3 rounded-2xl shadow-2xl">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Fabuos</h1>
                <p className="text-xs md:text-sm text-muted-foreground">AI-Powered Content Studio</p>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <div className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
            <div className="max-w-7xl w-full mx-auto space-y-8 md:space-y-12">
              {/* Main Heading */}
              <div className="text-center space-y-4 md:space-y-6 animate-fade-in">
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  Create Amazing Content
                  <br />
                  <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    Powered by AI
                  </span>
                </h2>
                <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto">
                  Transform your ideas into professional content with our AI-powered tools. Generate scripts, music, thumbnails, and more.
                </p>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-scale-in" style={{ animationDelay: '0.2s' }}>
                {[
                  { icon: "✨", title: "AI Script Writer", desc: "Generate engaging scripts instantly", gradient: "from-violet-500/20 to-purple-500/20" },
                  { icon: "🎵", title: "Music Generator", desc: "Create custom background music", gradient: "from-blue-500/20 to-cyan-500/20" },
                  { icon: "🎨", title: "Thumbnail Designer", desc: "Design eye-catching thumbnails", gradient: "from-pink-500/20 to-rose-500/20" },
                  { icon: "🎙️", title: "Voice Tools", desc: "Text-to-speech & voice cloning", gradient: "from-orange-500/20 to-amber-500/20" },
                ].map((feature, i) => (
                  <Card 
                    key={i} 
                    className={`group p-6 md:p-8 card-glass border-border/50 hover:border-primary/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 cursor-pointer animate-fade-in bg-gradient-to-br ${feature.gradient}`}
                    style={{ animationDelay: `${0.3 + i * 0.1}s` }}
                  >
                    <div className="space-y-4">
                      <div className="text-5xl md:text-6xl group-hover:scale-110 transition-transform duration-300">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-sm md:text-base text-muted-foreground">
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <Button 
                  size="lg"
                  onClick={() => {
                    setIsSignUp(true);
                    setShowAuthForm(true);
                  }}
                  className="w-full sm:w-auto text-lg md:text-xl px-8 md:px-12 py-6 md:py-8 bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-all duration-300 shadow-2xl hover:shadow-primary/50 hover:scale-105 group"
                >
                  <Sparkles className="w-6 h-6 mr-2 group-hover:rotate-12 transition-transform" />
                  Sign Up Free
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    setIsSignUp(false);
                    setShowAuthForm(true);
                  }}
                  className="w-full sm:w-auto text-lg md:text-xl px-8 md:px-12 py-6 md:py-8 border-2 border-primary/50 hover:bg-primary/10 hover:border-primary transition-all duration-300 hover:scale-105 group"
                >
                  <Lock className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform" />
                  Login
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.8s' }}>
                {[
                  { value: "10K+", label: "Active Users" },
                  { value: "50K+", label: "Content Created" },
                  { value: "4.9/5", label: "User Rating" },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-4 md:p-6 rounded-xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border border-primary/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:scale-105 cursor-pointer">
                    <div className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Auth Form Screen
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-md">
            <Card className="card-glass border-border/50 overflow-hidden shadow-2xl backdrop-blur-xl animate-scale-in">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent opacity-10 animate-pulse" />
              <div className="relative z-10">
                <CardHeader className="space-y-4 pb-8">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAuthForm(false)}
                    className="absolute top-4 left-4 hover:bg-primary/10"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  
                  <div className="flex items-center gap-3 justify-center pt-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-xl blur-lg opacity-75 animate-pulse" />
                      <div className="relative bg-gradient-to-br from-primary via-secondary to-accent p-3 rounded-xl shadow-xl">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                      Fabuos
                    </h1>
                  </div>

                  {showDisabledAlert && (
                    <Alert variant="destructive" className="animate-fade-in">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Your account has been disabled. Please contact support for assistance.
                      </AlertDescription>
                    </Alert>
                  )}

                  {!isTesterLogin && !showForgotPassword && !showOtpInput && (
                    <>
                      <CardTitle className="text-2xl text-center">
                        {isSignUp ? "Create Account" : "Welcome Back"}
                      </CardTitle>
                      <CardDescription className="text-center">
                        {isSignUp 
                          ? "Start creating amazing content today" 
                          : "Sign in to continue creating"}
                      </CardDescription>
                    </>
                  )}

                  {showOtpInput && (
                    <>
                      <CardTitle className="text-2xl text-center">Verify Email</CardTitle>
                      <CardDescription className="text-center">
                        Enter the 6-digit code sent to {email}
                      </CardDescription>
                    </>
                  )}

                  {isTesterLogin && (
                    <>
                      <CardTitle className="text-2xl text-center">Tester Access</CardTitle>
                      <CardDescription className="text-center">
                        Enter your tester key to access the platform
                      </CardDescription>
                    </>
                  )}

                  {showForgotPassword && (
                    <>
                      <CardTitle className="text-2xl text-center">
                        {resetSent ? "Check Your Email" : "Reset Password"}
                      </CardTitle>
                      <CardDescription className="text-center">
                        {resetSent 
                          ? "We've sent you a password reset link" 
                          : "Enter your email to receive a reset link"}
                      </CardDescription>
                    </>
                  )}
                </CardHeader>

                <CardContent className="space-y-6">
                  {!isTesterLogin && !showForgotPassword && !showOtpInput && (
                    <>
                      <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                            className="h-12"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password" className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Password
                          </Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            className="h-12"
                          />
                        </div>

                        {!isSignUp && (
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-sm text-primary hover:underline"
                          >
                            Forgot password?
                          </button>
                        )}

                        <Button
                          type="submit"
                          className="w-full h-12 bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-all"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isSignUp ? (
                            "Sign Up"
                          ) : (
                            "Sign In"
                          )}
                        </Button>
                      </form>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full h-12"
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                      </Button>

                      <div className="text-center space-y-2">
                        <button
                          type="button"
                          onClick={() => setIsSignUp(!isSignUp)}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {isSignUp ? "Already have an account? " : "Don't have an account? "}
                          <span className="text-primary font-medium">
                            {isSignUp ? "Sign In" : "Sign Up"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsTesterLogin(true)}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 w-full"
                        >
                          <KeyRound className="w-3 h-3" />
                          Tester Login
                        </button>
                      </div>
                    </>
                  )}

                  {showOtpInput && (
                    <form onSubmit={handleVerifyOTP} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="otp">Verification Code</Label>
                        <Input
                          id="otp"
                          type="text"
                          placeholder="000000"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          maxLength={6}
                          required
                          disabled={isLoading}
                          className="h-12 text-center text-2xl tracking-widest"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90"
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Email"}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleResendOTP}
                        disabled={resendTimer > 0}
                        className="w-full"
                      >
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setShowOtpInput(false);
                          setOtp("");
                        }}
                        className="w-full"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Sign Up
                      </Button>
                    </form>
                  )}

                  {isTesterLogin && (
                    <form onSubmit={handleTesterLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="testerKey">Tester Key</Label>
                        <Input
                          id="testerKey"
                          type="text"
                          placeholder="Enter your tester key"
                          value={testerKey}
                          onChange={(e) => setTesterKey(e.target.value)}
                          required
                          disabled={isLoading}
                          className="h-12"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90"
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Login as Tester"}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsTesterLogin(false)}
                        className="w-full"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Regular Login
                      </Button>
                    </form>
                  )}

                  {showForgotPassword && !resetSent && (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="resetEmail">Email Address</Label>
                        <Input
                          id="resetEmail"
                          type="email"
                          placeholder="you@example.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                          disabled={isLoading}
                          className="h-12"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90"
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowForgotPassword(false)}
                        className="w-full"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Login
                      </Button>
                    </form>
                  )}

                  {showForgotPassword && resetSent && (
                    <div className="space-y-4">
                      <Alert>
                        <Mail className="h-4 w-4" />
                        <AlertDescription>
                          Check your email for the password reset link. If you don't see it, check your spam folder.
                        </AlertDescription>
                      </Alert>

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setResetSent(false);
                        }}
                        className="w-full"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Login
                      </Button>
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
