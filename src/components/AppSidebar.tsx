import { NavLink, useLocation } from "react-router-dom";
import { Home, Sparkles, Youtube, Music, Crown, Settings, LogOut, Image, FileText, TrendingUp, Search, Hash } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";

const mainItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "YouTube Manager", url: "/youtube-manager", icon: Youtube },
];

const aiTools = [
  { title: "Caption Generator", url: "/caption-generator", icon: Sparkles },
  { title: "Thumbnail Generator", url: "/thumbnail-generator", icon: Image },
  { title: "Script Writer", url: "/script-writer", icon: FileText },
  { title: "Music Generator", url: "/music-generator", icon: Music },
  { title: "Trend Analyzer", url: "/trend-analyzer", icon: TrendingUp },
  { title: "SEO Optimizer", url: "/seo-optimizer", icon: Search },
  { title: "Hashtag Generator", url: "/hashtag-generator", icon: Hash },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { plan } = useSubscription();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = (path: string) =>
    isActive(path)
      ? "bg-primary/10 text-primary border-l-4 border-primary font-semibold"
      : "hover:bg-accent/50 transition-all";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate("/auth");
  };

  return (
    <Sidebar className="border-r bg-card/50 backdrop-blur-lg">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3 animate-scale-in">
          <div className="p-2 rounded-xl bg-gradient-to-r from-primary via-secondary to-accent shadow-lg animate-glow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          {open && (
            <div>
              <h1 className="font-bold text-lg gradient-text">Lovable Me</h1>
              <p className="text-xs text-muted-foreground">Content Studio</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent className="px-2">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase text-muted-foreground px-4">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12">
                    <NavLink to={item.url} end className={getNavCls(item.url)}>
                      <item.icon className={`h-5 w-5 ${isActive(item.url) ? 'text-primary' : ''}`} />
                      {open && <span className="ml-3">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI Tools */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase text-muted-foreground px-4">
            <Sparkles className="h-3 w-3 inline mr-1" />
            AI Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {aiTools.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12">
                    <NavLink to={item.url} className={getNavCls(item.url)}>
                      <item.icon className={`h-5 w-5 ${isActive(item.url) ? 'text-primary' : ''}`} />
                      {open && <span className="ml-3">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-4 border-t">
        {/* Plan Badge */}
        {open && (
          <div className="mb-3">
            {plan === "pro" ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                <Crown className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-semibold text-yellow-500">Pro Plan</span>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/pricing")}
                className="w-full justify-start gap-2"
              >
                <Crown className="h-4 w-4" />
                Upgrade to Pro
              </Button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-1">
          <SidebarMenuButton asChild className="h-10">
            <button onClick={() => navigate("/settings")} className={getNavCls("/settings")}>
              <Settings className="h-5 w-5" />
              {open && <span className="ml-3">Settings</span>}
            </button>
          </SidebarMenuButton>
          <SidebarMenuButton asChild className="h-10">
            <button onClick={handleSignOut} className="hover:bg-destructive/10 hover:text-destructive transition-all">
              <LogOut className="h-5 w-5" />
              {open && <span className="ml-3">Sign Out</span>}
            </button>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
