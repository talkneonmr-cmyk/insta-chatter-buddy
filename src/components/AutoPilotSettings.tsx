import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Settings, Zap } from "lucide-react";

interface AutoPilotSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsUpdate: () => void;
}

interface Settings {
  id?: string;
  enabled: boolean;
  performance_threshold: number;
  check_frequency_hours: number;
  auto_apply: boolean;
}

const AutoPilotSettings = ({ open, onOpenChange, onSettingsUpdate }: AutoPilotSettingsProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    enabled: false,
    performance_threshold: 40,
    check_frequency_hours: 24,
    auto_apply: false,
  });

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('auto_pilot_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        throw error;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error: any) {
      toast.error("Failed to load settings: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (settings.id) {
        const { error } = await supabase
          .from('auto_pilot_settings')
          .update({
            enabled: settings.enabled,
            performance_threshold: settings.performance_threshold,
            check_frequency_hours: settings.check_frequency_hours,
            auto_apply: settings.auto_apply,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('auto_pilot_settings')
          .insert({
            user_id: user.id,
            ...settings,
          });

        if (error) throw error;
      }

      toast.success("Auto-pilot settings saved!");
      onSettingsUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to save settings: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Auto-Pilot Settings
          </DialogTitle>
          <DialogDescription>
            Configure automatic optimization for underperforming videos
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enabled" className="text-base font-semibold">
                  Enable Auto-Pilot
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Automatically detect and optimize underperforming videos
                </p>
              </div>
              <Switch
                id="enabled"
                checked={settings.enabled}
                onCheckedChange={(enabled) => setSettings({ ...settings, enabled })}
              />
            </div>

            {settings.enabled && (
              <>
                {/* Performance Threshold */}
                <Card className="p-4 space-y-3">
                  <Label className="text-sm font-medium">
                    Performance Threshold: {settings.performance_threshold}/100
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Videos scoring below this will be optimized
                  </p>
                  <Slider
                    value={[settings.performance_threshold]}
                    onValueChange={([value]) => setSettings({ ...settings, performance_threshold: value })}
                    min={10}
                    max={70}
                    step={5}
                    className="mt-2"
                  />
                </Card>

                {/* Check Frequency */}
                <Card className="p-4 space-y-3">
                  <Label className="text-sm font-medium">
                    Check Frequency: Every {settings.check_frequency_hours} hours
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    How often to scan for underperforming videos
                  </p>
                  <Slider
                    value={[settings.check_frequency_hours]}
                    onValueChange={([value]) => setSettings({ ...settings, check_frequency_hours: value })}
                    min={6}
                    max={168}
                    step={6}
                    className="mt-2"
                  />
                </Card>

                {/* Auto-Apply Mode */}
                <Card className="p-4 space-y-3">
                  <Label className="text-sm font-medium">Optimization Mode</Label>
                  <RadioGroup
                    value={settings.auto_apply ? "auto" : "review"}
                    onValueChange={(value) => setSettings({ ...settings, auto_apply: value === "auto" })}
                  >
                    <div className="flex items-start space-x-3 p-3 rounded-lg border">
                      <RadioGroupItem value="review" id="review" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="review" className="font-medium cursor-pointer">
                          Review First
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Generate suggestions for review before applying
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-lg border">
                      <RadioGroupItem value="auto" id="auto" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="auto" className="font-medium cursor-pointer flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          Auto-Apply
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Automatically apply optimizations without review
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </Card>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AutoPilotSettings;
