import { NavLink, useLocation } from "react-router-dom";
import { Home, Sparkles, Youtube, Music, Crown, Settings, LogOut, Image, FileText, TrendingUp, Search, Hash, Scissors, Mic, FileCheck, Wand2, Volume2, MessageSquareText, Radio, Languages, Bot } from "lucide-react";
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
import { useIsMobile } from "@/hooks/use-mobile";

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
  { title: "Background Removal", url: "/background-removal", icon: Scissors },
  { title: "Speech-to-Text", url: "/speech-to-text", icon: Mic },
  { title: "Text Summarizer", url: "/text-summarizer", icon: FileCheck },
  { title: "Image Enhancement", url: "/image-enhancement", icon: Wand2 },
  { title: "Voice Cloning", url: "/voice-cloning", icon: Volume2 },
  { title: "Text to Speech", url: "/text-to-speech", icon: MessageSquareText },
  { title: "Voice Isolator", url: "/voice-isolator", icon: Radio },
  { title: "AI Dubbing", url: "/dubbing", icon: Languages },
  { title: "AI Agents", url: "/ai-agents", icon: Bot },
];

export function AppSidebar() {
  const { open, isMobile: sidebarMobile } = useSidebar();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { plan, isLoading: planLoading } = useSubscription();
  const currentPath = location.pathname;
  
  // Show text if sidebar is open OR if we're on mobile (drawer is full width)
  const showText = open || isMobile || sidebarMobile;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = (path: string) =>
    isActive(path)
      ? "bg-primary/10 text-primary border-l-4 border-primary font-semibold"
      : "hover:bg-accent/50 transition-all";

  const handleSignOut = async () => {
    // Sign out session
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate("/auth");
  };

  return (
    <Sidebar className="border-r bg-card backdrop-blur-lg">
      {/* Header */}
      <div className="p-4 border-b bg-card">
        <div className="flex items-center gap-3 animate-scale-in">
          {showText && (
            <div>
              <h1 className="font-bold text-xl gradient-text tracking-tight">Fabuos Creators</h1>
              <p className="text-xs text-muted-foreground font-medium">AI Content Studio</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent className="px-2 bg-card">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase text-muted-foreground font-semibold px-4">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12">
                    <NavLink to={item.url} end className={getNavCls(item.url)}>
                      <item.icon className={`h-5 w-5 ${isActive(item.url) ? 'text-primary' : ''}`} />
                      {showText && <span className="ml-3">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI Tools */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase text-muted-foreground font-semibold px-4">
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
                      {showText && <span className="ml-3">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-4 border-t bg-card">
        {/* Action Buttons */}
        <div className="space-y-1">
          <SidebarMenuButton asChild className="h-10">
            <button onClick={() => navigate("/settings")} className={getNavCls("/settings")}>
              <Settings className="h-5 w-5" />
              {showText && <span className="ml-3">Settings</span>}
            </button>
          </SidebarMenuButton>
          <SidebarMenuButton asChild className="h-10">
            <button onClick={handleSignOut} className="hover:bg-destructive/10 hover:text-destructive transition-all">
              <LogOut className="h-5 w-5" />
              {showText && <span className="ml-3">Sign Out</span>}
            </button>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
