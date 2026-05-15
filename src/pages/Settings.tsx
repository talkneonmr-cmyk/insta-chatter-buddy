import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User as UserIcon, Bell, Link2, Shield, Sparkles, Dna, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import InstagramAccountConnect from "@/components/InstagramAccountConnect";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useIsAdmin();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [savingTargeting, setSavingTargeting] = useState(false);
  const [targeting, setTargeting] = useState({
    primary_country: "US",
    target_countries: "US",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    niche: "",
    audience_notes: "",
    ai_upload_mode: "assisted",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session) {
        navigate("/auth");
      } else {
        loadTargetingSettings(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        loadTargetingSettings(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleDeleteAccount = async () => {
    toast({
      title: "Account Deletion",
      description: "Please contact support to delete your account.",
      variant: "destructive",
    });
  };

  const loadTargetingSettings = async (userId: string) => {
    const { data } = await supabase
      .from("creator_ai_settings" as any)
      .select("primary_country,target_countries,timezone,niche,audience_notes,ai_upload_mode")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      const row = data as any;
      setTargeting({
        primary_country: row.primary_country || "US",
        target_countries: Array.isArray(row.target_countries) ? row.target_countries.join(", ") : "US",
        timezone: row.timezone || "UTC",
        niche: row.niche || "",
        audience_notes: row.audience_notes || "",
        ai_upload_mode: row.ai_upload_mode || "assisted",
      });
    }
  };

  const saveTargetingSettings = async () => {
    if (!user) return;
    setSavingTargeting(true);
    try {
      const payload = {
        user_id: user.id,
        primary_country: targeting.primary_country,
        target_countries: targeting.target_countries.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean),
        timezone: targeting.timezone || "UTC",
        niche: targeting.niche.trim() || null,
        audience_notes: targeting.audience_notes.trim() || null,
        ai_upload_mode: targeting.ai_upload_mode,
      };

      const { error } = await supabase
        .from("creator_ai_settings" as any)
        .upsert(payload as any, { onConflict: "user_id" });
      if (error) throw error;
      toast({ title: "AI targeting saved", description: "Upload timing and metadata generation now use these settings." });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message || "Try again", variant: "destructive" });
    } finally {
      setSavingTargeting(false);
    }
  };

  const [resettingDna, setResettingDna] = useState(false);
  const handleResetDna = async () => {
    if (!user) return;
    setResettingDna(true);
    try {
      const { error } = await supabase
        .from("channel_dna_profiles")
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;
      toast({
        title: "Channel DNA reset",
        description: "Your AI profile was cleared. Run a new scan from the Growth Engine to rebuild it.",
      });
    } catch (e: any) {
      toast({ title: "Reset failed", description: e.message || "Try again", variant: "destructive" });
    } finally {
      setResettingDna(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Top Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="btn-3d">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-bold text-xl gradient-text">Settings</h1>
                <p className="text-xs text-muted-foreground">Manage your preferences</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* User Profile */}
          <Card className="border-2 slide-in">
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-primary" />
                <CardTitle>Profile Information</CardTitle>
              </div>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Email Address</Label>
                <p className="text-lg font-medium">{user?.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">User ID</Label>
                <p className="text-sm font-mono text-muted-foreground">{user?.id}</p>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-secondary" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>Manage how you receive updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about automation activity via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get instant browser notifications for important events
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* API Status */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-accent" />
                <CardTitle>API Connections</CardTitle>
              </div>
              <CardDescription>Status of external integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InstagramAccountConnect />
            </CardContent>
          </Card>

          {/* AI Targeting */}
          <Card className="border-2 border-primary/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle>AI Targeting & Upload Mode</CardTitle>
              </div>
              <CardDescription>Used by metadata generation, hashtags, Channel DNA, and best-time scheduling.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Primary country</Label>
                  <Input value={targeting.primary_country} onChange={(e) => setTargeting((p) => ({ ...p, primary_country: e.target.value.toUpperCase() }))} placeholder="US" maxLength={2} />
                </div>
                <div className="space-y-2">
                  <Label>Target audience countries</Label>
                  <Input value={targeting.target_countries} onChange={(e) => setTargeting((p) => ({ ...p, target_countries: e.target.value }))} placeholder="US, IN, GB" />
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Input value={targeting.timezone} onChange={(e) => setTargeting((p) => ({ ...p, timezone: e.target.value }))} placeholder="America/New_York" />
                </div>
                <div className="space-y-2">
                  <Label>Creator niche</Label>
                  <Input value={targeting.niche} onChange={(e) => setTargeting((p) => ({ ...p, niche: e.target.value }))} placeholder="Gaming, finance, fitness..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Audience notes</Label>
                <Textarea value={targeting.audience_notes} onChange={(e) => setTargeting((p) => ({ ...p, audience_notes: e.target.value }))} placeholder="Who you want to reach, language, age, interests..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>AI upload mode</Label>
                <Select value={targeting.ai_upload_mode} onValueChange={(v) => setTargeting((p) => ({ ...p, ai_upload_mode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual — I approve every change</SelectItem>
                    <SelectItem value="assisted">AI Assisted — AI fills, I review</SelectItem>
                    <SelectItem value="automatic">Fully Automatic — AI chooses metadata and time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={saveTargetingSettings} disabled={savingTargeting}>
                {savingTargeting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Save AI Targeting
              </Button>
            </CardContent>
          </Card>

          {/* Admin Panel - Only visible to admins */}
          {isAdmin && (
            <Card className="border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-yellow-500" />
                  <CardTitle className="text-yellow-500">Admin Panel</CardTitle>
                </div>
                <CardDescription>Manage users, subscriptions, and system settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Administrator Access</p>
                    <p className="text-sm text-muted-foreground">
                      Access advanced settings and user management
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate("/admin")}
                    className="border-yellow-500/50 hover:bg-yellow-500/10"
                  >
                    Open Admin Panel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Channel DNA */}
          <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Dna className="w-5 h-5 text-primary" />
                <CardTitle>AI Channel DNA</CardTitle>
              </div>
              <CardDescription>
                Your evolving creator intelligence profile. Auto-refreshes every 2 days. Reset to rebuild from scratch.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Reset Channel DNA</p>
                  <p className="text-sm text-muted-foreground">
                    Clears all stored DNA. Next Growth Engine scan rebuilds it from your latest channel data.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={resettingDna}>
                      <RefreshCw className={`w-4 h-4 mr-2 ${resettingDna ? "animate-spin" : ""}`} />
                      Reset DNA
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset your AI Channel DNA?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently deletes your stored creator profile (niche, audience, viral patterns,
                        recommendations, growth score). You'll need to run a fresh DNA scan from the Growth Engine
                        afterwards. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetDna}>
                        Reset DNA
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-2 border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-destructive" />
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </div>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove all your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
