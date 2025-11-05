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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8 relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-mesh opacity-50" />
      
      {/* Animated floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-primary/30 via-secondary/20 to-transparent rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-accent/30 via-primary/20 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '1s', animationDuration: '8s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-secondary/30 via-accent/20 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s', animationDuration: '10s' }} />
        <div className="absolute top-40 right-1/4 w-48 h-48 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl animate-float" style={{ animationDelay: '3s', animationDuration: '12s' }} />
        <div className="absolute bottom-40 left-1/4 w-56 h-56 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-2xl animate-float" style={{ animationDelay: '4s', animationDuration: '9s' }} />
      </div>
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] opacity-20" />

      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
        {/* Left Side - Branding & Hero */}
        <div className="hidden lg:block space-y-8 animate-fade-in">
          <div className="space-y-6">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3 group cursor-pointer animate-scale-in">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-all duration-500 animate-pulse" />
                <div className="relative bg-gradient-to-br from-primary via-secondary to-accent p-4 rounded-2xl shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="w-10 h-10 text-white animate-pulse" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Fabuos</h1>
                <p className="text-sm text-muted-foreground">AI-Powered Content Studio</p>
              </div>
            </div>

            {/* Hero Content */}
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-5xl font-bold leading-tight">
                Create Amazing <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-pulse">Content</span> in Minutes
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Transform your ideas into professional content with AI-powered tools. Generate scripts, thumbnails, music, and more - all in one place.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-3 pt-4">
              {[
                { icon: "✨", title: "AI Script Writer", desc: "Generate engaging scripts instantly" },
                { icon: "🎵", title: "Music Generator", desc: "Create custom background music" },
                { icon: "🎨", title: "Thumbnail Designer", desc: "Design eye-catching thumbnails" },
                { icon: "🎙️", title: "Voice Tools", desc: "Text-to-speech & voice cloning" },
              ].map((feature, i) => (
                <div 
                  key={i} 
                  className="group flex items-start gap-4 p-5 rounded-xl bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-md border border-border/50 hover:border-primary/50 transition-all duration-300 hover:translate-x-2 hover:shadow-lg hover:shadow-primary/20 animate-fade-in cursor-pointer"
                  style={{ animationDelay: `${0.4 + i * 0.1}s` }}
                >
                  <div className="text-3xl group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 animate-fade-in" style={{ animationDelay: '0.8s' }}>
              {[
                { value: "10K+", label: "Active Users" },
                { value: "50K+", label: "Content Created" },
                { value: "4.9/5", label: "User Rating" },
              ].map((stat, i) => (
                <div key={i} className="group text-center p-4 rounded-xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border border-primary/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:scale-105 cursor-pointer">
                  <div className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent group-hover:scale-110 transition-transform">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <Card className="w-full card-glass border-border/50 overflow-hidden shadow-2xl backdrop-blur-xl animate-scale-in relative group">
          {/* Animated gradient border */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent opacity-20 animate-pulse" />
          <div className="absolute inset-[1px] bg-background/95 backdrop-blur-xl rounded-lg" />
          
          {/* Content container */}
          <div className="relative z-10">
            {/* Mobile Logo */}
            <div className="lg:hidden p-6 pb-0 animate-fade-in">
              <div className="flex items-center gap-3 justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-xl blur-lg opacity-75 animate-pulse" />
                  <div className="relative bg-gradient-to-br from-primary via-secondary to-accent p-3 rounded-xl shadow-xl">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Fabuos</h1>
                  <p className="text-xs text-muted-foreground">AI Content Studio</p>
                </div>
              </div>
            </div>

            {/* Decorative top gradient bar */}
            <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-accent relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[slide-in-right_2s_ease-in-out_infinite]" />
            </div>
        
            <CardHeader className="space-y-4 text-center pb-6 animate-fade-in">
              <div className="flex justify-center mb-2">
                <div className="relative group/icon">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-full blur-xl opacity-75 group-hover/icon:opacity-100 transition-opacity animate-pulse" />
                  <div className="relative p-5 rounded-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 backdrop-blur-md border border-primary/30 group-hover/icon:scale-110 transition-transform duration-300 shadow-lg">
                    {showForgotPassword ? (
                      <KeyRound className="w-8 h-8 text-primary animate-pulse" />
                    ) : showOtpInput ? (
                      <Mail className="w-8 h-8 text-primary animate-pulse" />
                    ) : isTesterLogin ? (
                      <Lock className="w-8 h-8 text-accent animate-pulse" />
                    ) : (
                      <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  {showForgotPassword 
                    ? (resetSent ? "Email Sent" : window.location.search.includes('reset=true') ? "Set New Password" : "Reset Password")
                    : showOtpInput 
                      ? "Verify Your Email" 
                      : isTesterLogin 
                        ? "Tester Access" 
                        : (isSignUp ? "Create Account" : "Welcome Back")
                  }
                </CardTitle>
                <CardDescription className="text-base">
                  {showForgotPassword
                    ? (resetSent ? "Check your inbox for the reset link" : window.location.search.includes('reset=true') ? "Enter your new password" : "We'll send you a reset link")
                    : showOtpInput 
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
                <Alert variant="info" className="mb-6 animate-fade-in border-destructive/50 bg-destructive/10 backdrop-blur-sm">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Acc disabled please appeal
                  </AlertDescription>
                </Alert>
              )}
              
              {showForgotPassword ? (
                // Password Reset Flow
                resetSent ? (
                  <div className="text-center space-y-4 animate-fade-in py-8">
                    <div className="flex justify-center mb-4">
                      <div className="p-4 rounded-full bg-green-500/10">
                        <Mail className="w-12 h-12 text-green-500" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">Check your email</h3>
                      <p className="text-muted-foreground">
                        We've sent a password reset link to<br />
                        <span className="font-medium text-foreground">{resetEmail}</span>
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetSent(false);
                        setResetEmail("");
                      }}
                      className="mt-4"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to login
                    </Button>
                  </div>
                ) : window.location.search.includes('reset=true') ? (
                  // New Password Form
                  <form onSubmit={handleResetPassword} className="space-y-5 animate-fade-in">
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
                      <div className="relative group">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-all duration-300 group-focus-within:scale-110" />
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="Enter new password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          minLength={6}
                          className="pl-10 h-12 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary focus:bg-background/80 focus:shadow-lg focus:shadow-primary/20 transition-all duration-300"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-primary/50 relative overflow-hidden group"
                      disabled={isLoading}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Updating password...
                        </>
                      ) : (
                        <>
                          <KeyRound className="mr-2 h-5 w-5" />
                          Update Password
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  // Request Reset Form
                  <form onSubmit={handleForgotPassword} className="space-y-5 animate-fade-in">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-sm font-medium">Email Address</Label>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-all duration-300 group-focus-within:scale-110" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="you@example.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                          disabled={isLoading}
                          className="pl-10 h-12 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary focus:bg-background/80 focus:shadow-lg focus:shadow-primary/20 transition-all duration-300"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">We'll send you a reset link</p>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-primary/50 relative overflow-hidden group"
                      disabled={isLoading}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-5 w-5" />
                          Send Reset Link
                        </>
                      )}
                    </Button>
                    <div className="text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowForgotPassword(false)}
                        disabled={isLoading}
                        className="text-sm hover:text-primary transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to login
                      </Button>
                    </div>
                  </form>
                )
              ) : !showOtpInput && !isTesterLogin ? (
                <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-5 animate-fade-in">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-all duration-300 group-focus-within:scale-110" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="pl-10 h-12 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary focus:bg-background/80 focus:shadow-lg focus:shadow-primary/20 transition-all duration-300"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-all duration-300 group-focus-within:scale-110" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        minLength={6}
                        className="pl-10 h-12 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary focus:bg-background/80 focus:shadow-lg focus:shadow-primary/20 transition-all duration-300"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-primary/50 relative overflow-hidden group"
                    disabled={isLoading}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
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
                    {!isSignUp && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setResetEmail(email);
                        }}
                        disabled={isLoading}
                        className="text-sm text-primary hover:text-primary/80 p-0 h-auto font-medium"
                      >
                        Forgot password?
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSignUp(!isSignUp)}
                      disabled={isLoading}
                      className="text-sm hover:text-primary transition-colors block mx-auto"
                    >
                      {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                    </Button>
                  </div>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  {/* Google Sign In Button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full h-12 border-2 hover:bg-accent/5 hover:border-primary/30 transition-all duration-300 group"
                  >
                    <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="font-medium">Continue with Google</span>
                  </Button>
                </form>
              ) : isTesterLogin ? (
                <form onSubmit={handleTesterLogin} className="space-y-5 animate-fade-in">
                  <div className="space-y-2">
                    <Label htmlFor="testerKey" className="text-sm font-medium">Tester Access Key</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-accent transition-all duration-300 group-focus-within:scale-110" />
                      <Input
                        id="testerKey"
                        type="text"
                        placeholder="Enter your tester key"
                        value={testerKey}
                        onChange={(e) => setTesterKey(e.target.value.trim())}
                        required
                        disabled={isLoading}
                        className="pl-10 h-12 font-mono bg-background/50 backdrop-blur-sm border-border/50 focus:border-accent focus:bg-background/80 focus:shadow-lg focus:shadow-accent/20 transition-all duration-300"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-accent via-accent to-accent-glow hover:opacity-90 hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-accent/50 relative overflow-hidden group"
                    disabled={isLoading || !testerKey}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
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
                <form onSubmit={handleVerifyOTP} className="space-y-5 animate-fade-in">
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
                      className="text-center text-3xl tracking-widest font-mono h-14 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary focus:bg-background/80 focus:shadow-lg focus:shadow-primary/20 transition-all duration-300"
                    />
                    <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Code expires in 10 minutes
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-primary/50 relative overflow-hidden group"
                    disabled={isLoading || otp.length !== 6}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
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
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
