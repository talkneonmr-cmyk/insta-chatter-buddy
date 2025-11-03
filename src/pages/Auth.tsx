import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, AlertCircle } from "lucide-react";

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
    // Check tester session first
    const testerSessionToken = localStorage.getItem('tester_session_token');
    if (testerSessionToken) {
      navigate('/');
      return;
    }

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Mail className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {showOtpInput ? "Verify Your Email" : isTesterLogin ? "Tester Access" : (isSignUp ? "Create Account" : "Welcome Back")}
          </CardTitle>
          <CardDescription>
            {showOtpInput 
              ? "Enter the 6-digit code sent to your email"
              : isTesterLogin 
                ? "Enter your tester access key"
                : (isSignUp ? "Sign up to get started" : "Sign in to your account")
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {showDisabledAlert && (
            <Alert variant="info" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Acc disabled please appeal
              </AlertDescription>
            </Alert>
          )}
          
          {!showOtpInput && !isTesterLogin ? (
            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSignUp ? "Creating account..." : "Signing in..."}
                  </>
                ) : (
                  isSignUp ? "Sign Up" : "Sign In"
                )}
              </Button>
              <div className="text-center space-y-2">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setIsSignUp(!isSignUp)}
                  disabled={isLoading}
                  className="text-sm"
                >
                  {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                </Button>
                <div className="text-sm text-muted-foreground">or</div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTesterLogin(true)}
                  disabled={isLoading}
                  className="text-sm"
                >
                  Login with Tester Key
                </Button>
              </div>
            </form>
          ) : isTesterLogin ? (
            <form onSubmit={handleTesterLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testerKey">Tester Access Key</Label>
                <Input
                  id="testerKey"
                  type="text"
                  placeholder="Enter your tester key"
                  value={testerKey}
                  onChange={(e) => setTesterKey(e.target.value.trim())}
                  required
                  disabled={isLoading}
                  className="font-mono"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !testerKey}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  "Access as Tester"
                )}
              </Button>
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsTesterLogin(false);
                    setTesterKey("");
                  }}
                  disabled={isLoading}
                >
                  Back to regular login
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  disabled={isLoading}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Code expires in 10 minutes
                </p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Sign In"
                )}
              </Button>
              <div className="text-center space-y-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowOtpInput(false);
                    setOtp("");
                  }}
                  disabled={isLoading}
                >
                  Change email
                </Button>
                <div className="text-sm text-muted-foreground">
                  {resendTimer > 0 ? (
                    <span>Resend code in {resendTimer}s</span>
                  ) : (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={handleResendOTP}
                      disabled={isLoading}
                      className="p-0 h-auto"
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
  );
};

export default Auth;
