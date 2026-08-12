import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ShieldOff, Save, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WebsiteClosedToggle() {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [originalEnabled, setOriginalEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const hasChanges = enabled !== originalEnabled;

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "website_closed")
        .single();

      if (error) throw error;
      const value = data?.value as { enabled?: boolean } | null;
      const isEnabled = value?.enabled || false;
      setEnabled(isEnabled);
      setOriginalEnabled(isEnabled);
    } catch (error) {
      console.error("Error fetching website closed settings:", error);
      toast({ title: "Error", description: "Failed to fetch settings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("app_settings")
        .update({
          value: { enabled },
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq("key", "website_closed");

      if (error) throw error;

      setOriginalEnabled(enabled);
      toast({
        title: "Success",
        description: enabled
          ? "Website is now closed. Only admins can access it."
          : "Website is now open. All users can access it.",
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({ title: "Error", description: error.message || "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={enabled ? "border-destructive/50" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${enabled ? "bg-destructive/10" : "bg-muted"}`}>
              <ShieldOff className={`h-5 w-5 ${enabled ? "text-destructive" : "text-muted-foreground"}`} />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Website Closed
                {enabled && (
                  <Badge variant="destructive">Active</Badge>
                )}
              </CardTitle>
              <CardDescription>
                When enabled, the entire website is closed. Only admins can access it via a secret login URL.
              </CardDescription>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {enabled && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Website is closed</p>
              <p className="text-muted-foreground">
                All non-admin users see a "Website Closed" page. Admins can log in at{" "}
                <code className="bg-muted px-1 rounded text-xs">/admin-login</code> to manage the site.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={saveSettings} disabled={saving || !hasChanges}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
