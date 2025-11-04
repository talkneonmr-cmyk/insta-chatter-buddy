import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Hash, FileText, Image, Search } from "lucide-react";

const YouTubeQuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: FileText,
      label: "Script Writer",
      description: "Generate video scripts",
      path: "/script-writer",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Image,
      label: "Thumbnails",
      description: "Create eye-catching designs",
      path: "/thumbnail-generator",
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      icon: Search,
      label: "SEO Optimizer",
      description: "Boost discoverability",
      path: "/seo-optimizer",
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      icon: Hash,
      label: "Hashtags",
      description: "Generate trending tags",
      path: "/hashtag-generator",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: TrendingUp,
      label: "Trends",
      description: "Analyze what's hot",
      path: "/trend-analyzer",
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
  ];

  return (
    <Card className="p-3 md:p-6 slide-in">
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-primary" />
        <h3 className="text-base md:text-lg font-semibold gradient-text">AI Creator Tools</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
        {actions.map((action) => (
          <Button
            key={action.path}
            variant="outline"
            onClick={() => navigate(action.path)}
            className="h-auto flex-col items-start p-3 md:p-4 gap-2 hover:scale-105 transition-transform"
          >
            <div className={`p-2 rounded-lg ${action.bg}`}>
              <action.icon className={`h-4 w-4 md:h-5 md:w-5 ${action.color}`} />
            </div>
            <div className="text-left">
              <div className="font-semibold text-xs md:text-sm">{action.label}</div>
              <div className="text-[10px] md:text-xs text-muted-foreground">{action.description}</div>
            </div>
          </Button>
        ))}
      </div>
    </Card>
  );
};

export default YouTubeQuickActions;
