import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, AlertCircle, Lock, ArrowLeft, KeyRound, Check } from "lucide-react";
import fabulousLogo from "@/assets/fabulous-logo.png";

type View = "main" | "otp" | "tester" | "forgot" | "reset";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [view, setView] = useState<View>("main");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [showDisabledAlert, setShowDisabledAlert] = useState(false);
  const [testerKey, setTesterKey] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("mode") === "signup") setIsSignUp(true);
    if (urlParams.get("reset") === "true") setView("reset");

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && urlParams.get("reset") !== "true") navigate("/dashboard");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setView("reset");
      else if (session && urlParams.get("reset") !== "true") navigate("/dashboard");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowDisabledAlert(false);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes("banned")) {
          setShowDisabledAlert(true);
          throw new Error("disabled");
        }
        throw error;
      }
      toast({ title: "Welcome back!", description: "You're signed in." });
      navigate("/dashboard");
    } catch (error: any) {
      if (error.message !== "disabled") {
        toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const generatedOTP = generateOTP();
      sessionStorage.setItem("otp_email", email);
      sessionStorage.setItem("otp_password", password);
      sessionStorage.setItem("otp_code", generatedOTP);
      sessionStorage.setItem("otp_timestamp", Date.now().toString());
      const { error: emailError } = await supabase.functions.invoke("send-otp-email", {
        body: { email, otp: generatedOTP },
      });
      if (emailError) throw emailError;
      setView("otp");
      setResendTimer(60);
      toast({ title: "Code sent!", description: "Check your email for the verification code." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send code", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const storedEmail = sessionStorage.getItem("otp_email");
      const storedPassword = sessionStorage.getItem("otp_password");
      const storedOTP = sessionStorage.getItem("otp_code");
      const timestamp = sessionStorage.getItem("otp_timestamp");
      if (storedEmail !== email) throw new Error("Email mismatch");
      if (timestamp && Date.now() - parseInt(timestamp) > 10 * 60 * 1000)
        throw new Error("Code expired. Request a new one.");
      if (otp !== storedOTP) throw new Error("Invalid verification code");

      const { error } = await supabase.auth.signUp({
        email,
        password: storedPassword || password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;

      ["otp_email", "otp_password", "otp_code", "otp_timestamp"].forEach((k) =>
        sessionStorage.removeItem(k),
      );
      toast({ title: "Account created!", description: "Welcome to Fabuos." });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setOtp("");
    await handleSignUp(new Event("submit") as any);
  };

  const handleTesterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-tester-key", {
        body: { keyCode: testerKey },
      });
      if (error) throw error;
      localStorage.setItem("tester_session_token", data.sessionToken);
      localStorage.setItem("is_tester", "true");
      toast({ title: "Welcome, tester!" });
      window.location.href = "/dashboard";
    } catch (error: any) {
      toast({ title: "Invalid key", description: error.message, variant: "destructive" });
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
      toast({ title: "Check your email!", description: "Password reset link sent." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Password updated!" });
      window.history.replaceState({}, "", "/auth");
      setView("main");
      navigate("/dashboard");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: { access_type: "offline", prompt: "consent" },
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (data?.url) {
        if (window.top && window.top !== window) (window.top as Window).location.href = data.url;
        else window.location.assign(data.url);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    "15+ AI tools in one platform",
    "No credit card required",
    "Generate scripts, music, thumbnails & more",
    "Trusted by 10,000+ creators",
  ];

  return (
    <div className="min-h-screen bg-background text-foreground grid lg:grid-cols-2">
      {/* ─── Left: Brand panel (desktop only) ─── */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-r border-border/50">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[120px]" />
        </div>

        <button onClick={() => navigate("/")} className="relative flex items-center gap-2.5 group w-fit">
          <img src={fabulousLogo} alt="Fabuos" className="h-9 w-9 rounded-xl group-hover:scale-105 transition-transform" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Fabuos
          </span>
        </button>

        <div className="relative space-y-8 max-w-md">
          <div className="space-y-4">
            <h2 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
              Create content that
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                breaks the internet.
              </span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              The all-in-one AI studio for modern creators.
            </p>
          </div>

          <ul className="space-y-3">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                  <Check className="w-3 h-3" strokeWidth={3} />
                </span>
                <span className="text-foreground/90">{b}</span>
              </li>
            ))}
          </ul>

          <blockquote className="relative rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-5">
            <p className="text-sm leading-relaxed text-foreground/90">
              "Fabuos cut my content creation time by 70%. The AI script writer alone is worth it."
            </p>
            <footer className="mt-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[11px] font-bold text-white">
                AR
              </div>
              <div className="text-xs">
                <div className="font-semibold">Alex R.</div>
                <div className="text-muted-foreground">YouTuber · 500K subs</div>
              </div>
            </footer>
          </blockquote>
        </div>

        <p className="relative text-xs text-muted-foreground">
          © {new Date().getFullYear()} Fabulous Creators
        </p>
      </div>

      {/* ─── Right: Form panel ─── */}
      <div className="relative flex flex-col min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-5 border-b border-border/50">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5">
            <img src={fabulousLogo} alt="Fabuos" className="h-8 w-8 rounded-lg" />
            <span className="font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Fabuos
            </span>
          </button>
          <button
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 sm:px-10 py-10">
          <div className="w-full max-w-sm space-y-6 animate-fade-in">
            {showDisabledAlert && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your account has been disabled. Contact support for help.
                </AlertDescription>
              </Alert>
            )}

            {/* MAIN: sign in / sign up */}
            {view === "main" && (
              <>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight">
                    {isSignUp ? "Create your account" : "Welcome back"}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    {isSignUp
                      ? "Start creating in minutes. Free forever — no credit card."
                      : "Sign in to continue creating amazing content."}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full h-11 font-medium"
                >
                  <svg className="w-5 h-5 mr-2.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/60" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-wider">
                    <span className="bg-background px-3 text-muted-foreground">or</span>
                  </div>
                </div>

                <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Password
                      </Label>
                      {!isSignUp && (
                        <button
                          type="button"
                          onClick={() => setView("forgot")}
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-gradient-to-r from-primary via-secondary to-accent text-primary-foreground font-medium shadow-lg shadow-primary/25 hover:opacity-90 hover:shadow-primary/40 transition-all"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isSignUp ? (
                      "Create account"
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </form>

                <div className="text-center text-sm text-muted-foreground">
                  {isSignUp ? "Already have an account? " : "New to Fabuos? "}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-primary font-medium hover:underline"
                  >
                    {isSignUp ? "Sign in" : "Create one"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setView("tester")}
                  className="w-full text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-3 h-3" />
                  Have a tester key?
                </button>

                {isSignUp && (
                  <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                    By signing up, you agree to our Terms of Service and Privacy Policy.
                  </p>
                )}
              </>
            )}

            {/* OTP */}
            {view === "otp" && (
              <>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight">Verify your email</h1>
                  <p className="text-muted-foreground text-sm">
                    Enter the 6-digit code sent to <span className="text-foreground font-medium">{email}</span>
                  </p>
                </div>
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <Input
                    id="otp"
                    inputMode="numeric"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    maxLength={6}
                    required
                    disabled={isLoading}
                    className="h-14 text-center text-2xl tracking-[0.5em] font-mono"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="w-full h-11 bg-gradient-to-r from-primary via-secondary to-accent text-primary-foreground font-medium"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & continue"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResendOTP}
                    disabled={resendTimer > 0}
                    className="w-full text-sm"
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setView("main"); setOtp(""); }}
                    className="w-full text-xs text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" /> Back
                  </button>
                </form>
              </>
            )}

            {/* Tester */}
            {view === "tester" && (
              <>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight">Tester access</h1>
                  <p className="text-muted-foreground text-sm">Enter your tester key to continue.</p>
                </div>
                <form onSubmit={handleTesterLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="testerKey" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Tester key
                    </Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="testerKey"
                        value={testerKey}
                        onChange={(e) => setTesterKey(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-11 pl-10"
                        placeholder="Enter your tester key"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-gradient-to-r from-primary via-secondary to-accent text-primary-foreground font-medium"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue as tester"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setView("main")}
                    className="w-full text-xs text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" /> Back to login
                  </button>
                </form>
              </>
            )}

            {/* Forgot */}
            {view === "forgot" && (
              <>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight">
                    {resetSent ? "Check your inbox" : "Reset your password"}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    {resetSent
                      ? "We sent a reset link. Don't see it? Check spam."
                      : "We'll email you a link to reset it."}
                  </p>
                </div>

                {!resetSent ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="resetEmail" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="resetEmail"
                          type="email"
                          placeholder="you@example.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                          disabled={isLoading}
                          className="h-11 pl-10"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 bg-gradient-to-r from-primary via-secondary to-accent text-primary-foreground font-medium"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send reset link"}
                    </Button>
                  </form>
                ) : (
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      Check your email for the password reset link.
                    </AlertDescription>
                  </Alert>
                )}

                <button
                  type="button"
                  onClick={() => { setView("main"); setResetSent(false); }}
                  className="w-full text-xs text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to login
                </button>
              </>
            )}

            {/* Reset (post recovery email) */}
            {view === "reset" && (
              <>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight">Set a new password</h1>
                  <p className="text-muted-foreground text-sm">Choose a strong password you haven't used before.</p>
                </div>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      New password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-gradient-to-r from-primary via-secondary to-accent text-primary-foreground font-medium"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update password"}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
