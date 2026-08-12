import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Gamepad2, Video, BookOpen, Briefcase, Laugh, Cpu, Dumbbell, UtensilsCrossed } from "lucide-react";

const presets = [
  {
    name: "Gaming",
    icon: Gamepad2,
    prompt: "Epic gaming moment with vibrant neon colors, dramatic lighting, and bold text overlay",
    style: "gaming",
    color: "text-red-500"
  },
  {
    name: "Vlog",
    icon: Video,
    prompt: "Friendly and authentic personal moment with natural lighting and warm tones",
    style: "vlog",
    color: "text-orange-500"
  },
  {
    name: "Tutorial",
    icon: BookOpen,
    prompt: "Clean and professional layout with step-by-step indicators and easy-to-read text",
    style: "tutorial",
    color: "text-blue-500"
  },
  {
    name: "Business",
    icon: Briefcase,
    prompt: "Corporate and modern design with professional colors and authority-building elements",
    style: "business",
    color: "text-slate-500"
  },
  {
    name: "Comedy",
    icon: Laugh,
    prompt: "Funny and expressive moment with bright colors and humorous elements",
    style: "comedy",
    color: "text-yellow-500"
  },
  {
    name: "Tech",
    icon: Cpu,
    prompt: "Modern tech aesthetic with sleek design, digital elements, and futuristic feel",
    style: "tech",
    color: "text-purple-500"
  },
  {
    name: "Fitness",
    icon: Dumbbell,
    prompt: "Dynamic action shot with motivational text, energetic colors, and strong lighting",
    style: "fitness",
    color: "text-green-500"
  },
  {
    name: "Food",
    icon: UtensilsCrossed,
    prompt: "Appetizing food presentation with natural colors and mouth-watering details",
    style: "food",
    color: "text-pink-500"
  }
];

interface ThumbnailPresetsProps {
  onSelectPreset: (prompt: string, style: string) => void;
}

const ThumbnailPresets = ({ onSelectPreset }: ThumbnailPresetsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Start Templates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              className="h-auto flex-col gap-2 p-4"
              onClick={() => onSelectPreset(preset.prompt, preset.style)}
            >
              <preset.icon className={`h-6 w-6 ${preset.color}`} />
              <span className="text-xs">{preset.name}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ThumbnailPresets;
