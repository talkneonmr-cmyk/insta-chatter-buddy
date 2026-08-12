import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Wrench, Save, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MaintenanceSettings {
  enabled: boolean;
  message: string;
}

export default function MaintenanceToggle() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<MaintenanceSettings>({
    enabled: false,
    message: "We are currently performing scheduled maintenance. Please check back soon.",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<MaintenanceSettings | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (originalSettings) {
      const changed =
        settings.enabled !== originalSettings.enabled ||
        settings.message !== originalSettings.message;
      setHasChanges(changed);
    }
  }, [settings, originalSettings]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .single();

      if (error) throw error;

      const value = data?.value as { enabled?: boolean; message?: string } | null;
      const fetchedSettings = {
        enabled: value?.enabled || false,
        message: value?.message || "We are currently performing scheduled maintenance. Please check back soon.",
      };
      setSettings(fetchedSettings);
      setOriginalSettings(fetchedSettings);
    } catch (error) {
      console.error("Error fetching maintenance settings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch maintenance settings",
        variant: "destructive",
      });
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
          value: { enabled: settings.enabled, message: settings.message },
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq("key", "maintenance_mode");

      if (error) throw error;

      setOriginalSettings(settings);
      setHasChanges(false);

      toast({
        title: "Success",
        description: settings.enabled
          ? "Maintenance mode enabled. Users will see the maintenance page."
          : "Maintenance mode disabled. Users can access the app normally.",
      });
    } catch (error: any) {
      console.error("Error saving maintenance settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleMaintenanceMode = (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, enabled }));
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
    <Card className={settings.enabled ? "border-orange-500/50" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${settings.enabled ? "bg-orange-500/10" : "bg-muted"}`}>
              <Wrench className={`h-5 w-5 ${settings.enabled ? "text-orange-500" : "text-muted-foreground"}`} />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Maintenance Mode
                {settings.enabled && (
                  <Badge variant="destructive" className="bg-orange-500">
                    Active
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                When enabled, users will see a maintenance page instead of the app
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={toggleMaintenanceMode}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {settings.enabled && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-orange-500">Maintenance mode is active</p>
              <p className="text-muted-foreground">
                All non-admin users are currently seeing the maintenance page.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="maintenance-message">Maintenance Message</Label>
          <Textarea
            id="maintenance-message"
            placeholder="Enter the message users will see..."
            value={settings.message}
            onChange={(e) => setSettings((prev) => ({ ...prev, message: e.target.value }))}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            This message will be displayed to users on the maintenance page.
          </p>
        </div>

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
