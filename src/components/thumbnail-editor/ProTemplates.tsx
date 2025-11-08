import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Zap, TrendingUp, Crown } from "lucide-react";

interface Template {
  id: string;
  name: string;
  style: string;
  prompt: string;
  icon: any;
  category: "viral" | "dramatic" | "educational" | "gaming";
}

const PRO_TEMPLATES: Template[] = [
  {
    id: "mrbeast-challenge",
    name: "MrBeast Challenge",
    style: "extreme",
    prompt: "Ultra dramatic scene with person reacting in SHOCKED expression, bright yellow and red bold text overlay saying '$1,000,000 CHALLENGE', explosive energy, high contrast lighting, professional studio quality, cinematic 16:9 aspect ratio, YouTube thumbnail style",
    icon: Crown,
    category: "viral",
  },
  {
    id: "clickbait-shock",
    name: "Shocked Reaction",
    style: "viral",
    prompt: "Person with EXTREME shocked open mouth expression, hands on face, bright neon colors, dramatic lighting with glow effects, large bold text 'YOU WON\\'T BELIEVE THIS', high energy, professional thumbnail, 16:9 ratio",
    icon: Zap,
    category: "viral",
  },
  {
    id: "vs-battle",
    name: "VS Battle",
    style: "competitive",
    prompt: "Split screen comparison, left side vs right side, large glowing VS text in center, dramatic red and blue color scheme, high contrast, professional gaming thumbnail style, 16:9 YouTube format",
    icon: TrendingUp,
    category: "gaming",
  },
  {
    id: "before-after",
    name: "Before/After",
    style: "transformation",
    prompt: "Dramatic before and after comparison, split down the middle, left side dark and dull, right side bright and vibrant, large arrow pointing from left to right, bold text 'TRANSFORMATION', professional quality, 16:9 aspect ratio",
    icon: Sparkles,
    category: "educational",
  },
  {
    id: "money-giveaway",
    name: "Money Giveaway",
    style: "exciting",
    prompt: "Stacks of money flying through air, dollar bills everywhere, person in center holding cash, excited expression, bright green color scheme, bold yellow text '$100,000 GIVEAWAY', ultra high quality, cinematic lighting, 16:9 YouTube thumbnail",
    icon: Crown,
    category: "viral",
  },
  {
    id: "reaction-face",
    name: "Extreme Reaction",
    style: "dramatic",
    prompt: "Ultra close-up of face with MASSIVE shocked expression, eyes wide open, mouth dropped, dramatic side lighting, high contrast shadows, neon glow effect around face, bold text overlay, professional thumbnail quality, 16:9 format",
    icon: Zap,
    category: "dramatic",
  },
  {
    id: "tech-reveal",
    name: "Tech Unboxing",
    style: "clean",
    prompt: "Sleek tech product floating in center, clean gradient background blue to purple, product glowing with rim lighting, bold modern text 'UNBOXING', professional product photography style, 16:9 YouTube thumbnail",
    icon: Sparkles,
    category: "educational",
  },
  {
    id: "gaming-showdown",
    name: "Gaming Epic",
    style: "intense",
    prompt: "Epic gaming scene with character in action pose, explosive effects, particle effects, dramatic lighting, bold gaming font text overlay, neon colors red and cyan, professional esports style thumbnail, 16:9 aspect ratio",
    icon: TrendingUp,
    category: "gaming",
  },
  {
    id: "impossible-challenge",
    name: "Impossible Challenge",
    style: "extreme",
    prompt: "Person attempting impossible stunt, mid-action shot, dramatic slow-motion feel, bold red and yellow text 'IMPOSSIBLE CHALLENGE', high energy, professional action photography, cinematic lighting, 16:9 YouTube format",
    icon: Crown,
    category: "viral",
  },
  {
    id: "storytime-drama",
    name: "Story Drama",
    style: "mysterious",
    prompt: "Person sitting in dramatic spotlight, dark background, mysterious purple and blue lighting, concerned or serious expression, bold text 'THE TRUTH REVEALED', cinematic mood, professional portrait, 16:9 thumbnail",
    icon: Sparkles,
    category: "dramatic",
  },
];

interface ProTemplatesProps {
  onSelectTemplate: (prompt: string, templateName: string) => void;
  isGenerating?: boolean;
}

export const ProTemplates = ({ onSelectTemplate, isGenerating }: ProTemplatesProps) => {
  const categories = ["viral", "dramatic", "educational", "gaming"] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          Pro Creator Templates
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Viral thumbnail styles used by top YouTubers
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map((category) => (
          <div key={category} className="space-y-3">
            <h3 className="text-sm font-semibold capitalize text-primary">
              {category === "viral" && "🔥"} {category === "dramatic" && "⚡"}{" "}
              {category === "educational" && "📚"} {category === "gaming" && "🎮"}{" "}
              {category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {PRO_TEMPLATES.filter((t) => t.category === category).map((template) => {
                const Icon = template.icon;
                return (
                  <Button
                    key={template.id}
                    variant="outline"
                    className="h-auto py-3 px-4 text-left justify-start hover:bg-primary/10 hover:border-primary transition-all"
                    onClick={() => onSelectTemplate(template.prompt, template.name)}
                    disabled={isGenerating}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="font-semibold text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {template.style}
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};