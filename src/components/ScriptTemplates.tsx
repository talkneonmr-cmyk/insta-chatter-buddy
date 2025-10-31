import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { ShoppingBag, BookOpen, Package, ThumbsUp, ListOrdered, MessageSquare } from "lucide-react";

const templates = [
  {
    name: "Product Review",
    icon: ShoppingBag,
    topic: "Honest review of [product name] - Is it worth buying?",
    length: "5min",
    tone: "professional"
  },
  {
    name: "Tutorial",
    icon: BookOpen,
    topic: "Step-by-step guide: How to [achieve specific goal]",
    length: "10min",
    tone: "educational"
  },
  {
    name: "Unboxing",
    icon: Package,
    topic: "Unboxing and first impressions of [product]",
    length: "3min",
    tone: "energetic"
  },
  {
    name: "Reaction",
    icon: ThumbsUp,
    topic: "My reaction to [trending topic or video]",
    length: "5min",
    tone: "funny"
  },
  {
    name: "Top List",
    icon: ListOrdered,
    topic: "Top 10 [category items] you need to know about",
    length: "5min",
    tone: "energetic"
  },
  {
    name: "Storytime",
    icon: MessageSquare,
    topic: "The time when [interesting personal story]",
    length: "10min",
    tone: "calm"
  }
];

interface ScriptTemplatesProps {
  onSelectTemplate: (template: { topic: string; length: string; tone: string }) => void;
}

const ScriptTemplates = ({ onSelectTemplate }: ScriptTemplatesProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Script Templates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {templates.map((template) => (
            <Button
              key={template.name}
              variant="outline"
              className="h-auto flex-col gap-2 p-4"
              onClick={() => onSelectTemplate(template)}
            >
              <template.icon className="h-6 w-6 text-primary" />
              <span className="text-xs">{template.name}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScriptTemplates;
