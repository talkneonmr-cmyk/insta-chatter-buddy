import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Preset {
  id: string;
  name: string;
  description: string;
  prompt_template: string;
  tags: string[];
  bpm: number;
  instrumental: boolean;
  icon: string;
  is_system_preset: boolean;
  usage_count: number;
}

interface MusicPresetsProps {
  onApplyPreset: (preset: Preset) => void;
}

export default function MusicPresets({ onApplyPreset }: MusicPresetsProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      const { data, error } = await supabase
        .from("music_presets")
        .select("*")
        .order("is_system_preset", { ascending: false })
        .order("usage_count", { ascending: false });

      if (error) throw error;
      setPresets(data || []);
    } catch (error) {
      console.error("Error fetching presets:", error);
      toast({
        title: "Error",
        description: "Failed to load presets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = async (preset: Preset) => {
    try {
      // Increment usage count
      await supabase
        .from("music_presets")
        .update({ usage_count: preset.usage_count + 1 })
        .eq("id", preset.id);

      onApplyPreset(preset);
      
      toast({
        title: "Preset Applied",
        description: `${preset.name} preset has been applied`,
      });
    } catch (error) {
      console.error("Error applying preset:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Quick Presets
        </h3>
        <p className="text-muted-foreground">
          Start with a pre-configured style or create your own custom preset
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {presets.map((preset) => (
          <Card
            key={preset.id}
            className="group relative overflow-hidden border-2 hover:border-primary transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 cursor-pointer"
            onClick={() => handleApplyPreset(preset)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative p-6 space-y-3">
              <div className="text-4xl mb-2">{preset.icon}</div>
              
              <div>
                <h4 className="font-bold text-lg mb-1">{preset.name}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {preset.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-1">
                {preset.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                <span>{preset.bpm} BPM</span>
                <span>{preset.instrumental ? "Instrumental" : "With Vocals"}</span>
              </div>

              {preset.usage_count > 0 && (
                <div className="text-xs text-muted-foreground">
                  Used {preset.usage_count} times
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
