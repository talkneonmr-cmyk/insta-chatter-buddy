import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Sparkles, Youtube, Instagram, Settings, LogOut,
  Image as ImageIcon, FileText, TrendingUp, Search, Hash, Scissors, Mic,
  FileCheck, Wand2, Volume2, MessageSquareText, Languages, Bot, HelpCircle,
  MessageSquare, Globe, Users, Upload, Stethoscope, Dna, Target, LineChart,
  Music, Zap, Crown,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import fabulousLogo from "@/assets/fabulous-logo.png";

type Item = { title: string; url: string; icon: any };

const growth: Item[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Growth Engine", url: "/growth", icon: Zap },
  { title: "Channel DNA", url: "/growth/dna", icon: Dna },
  { title: "Trends", url: "/trend-analyzer", icon: TrendingUp },
];

const youtube: Item[] = [
  { title: "YouTube Manager", url: "/youtube-manager", icon: Youtube },
  { title: "Upload Studio", url: "/youtube-upload-studio", icon: Upload },
  { title: "Comments", url: "/comment-auto-responder", icon: MessageSquare },
];

const instagram: Item[] = [
  { title: "Instagram", url: "/youtube-manager", icon: Instagram },
];

const create: Item[] = [
  { title: "Thumbnails", url: "/thumbnail-generator", icon: ImageIcon },
  { title: "Scripts", url: "/script-writer", icon: FileText },
  { title: "Captions", url: "/caption-generator", icon: Sparkles },
  { title: "Hashtags", url: "/hashtag-generator", icon: Hash },
  { title: "SEO", url: "/seo-optimizer", icon: Search },
  { title: "Music", url: "/music-generator", icon: Music },
];

const aiTools: Item[] = [
  { title: "You Research", url: "/you-research", icon: Globe },
  { title: "Helper Bot", url: "/creator-helper-bot", icon: HelpCircle },
  { title: "Dr. Fabuos", url: "/dr-fabuos", icon: Stethoscope },
  { title: "Text → Speech", url: "/text-to-speech", icon: MessageSquareText },
  { title: "Voice Cloning", url: "/voice-cloning", icon: Volume2 },
  { title: "AI Dubbing", url: "/dubbing", icon: Languages },
  { title: "Speech → Text", url: "/speech-to-text", icon: Mic },
  { title: "Background Remove", url: "/background-removal", icon: Scissors },
  { title: "Image Enhance", url: "/image-enhancement", icon: Wand2 },
  { title: "Face Swap", url: "/face-swap", icon: Users },
  { title: "Summarizer", url: "/text-summarizer", icon: FileCheck },
  { title: "AI Agents", url: "/ai-agents", icon: Bot },
];

export function AppSidebar() {
  const { open, isMobile: sidebarMobile } = useSidebar();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const showText = open || isMobile || sidebarMobile;

  const isActive = (path: string) => location.pathname === path;

  const itemCls = (path: string) =>
    `flex items-center w-full px-3 rounded-lg transition-all duration-150 ${
      isActive(path)
        ? "bg-[hsl(258_90%_66%/0.12)] text-[hsl(258_90%_75%)]"
        : "text-[hsl(240_5%_65%)] hover:text-[hsl(0_0%_98%)] hover:bg-[hsl(240_8%_10%)]"
    }`;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out" });
    navigate("/auth");
  };

  const Section = ({ label, items }: { label: string; items: Item[] }) => (
    <SidebarGroup>
      {showText && (
        <SidebarGroupLabel className="px-3 text-[10px] uppercase tracking-[0.12em] text-[hsl(240_4%_46%)] font-semibold">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu className="space-y-0.5">
          {items.map((item) => (
            <SidebarMenuItem key={item.title + item.url}>
              <SidebarMenuButton asChild className="h-9">
                <NavLink to={item.url} end className={itemCls(item.url)}>
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {showText && <span className="ml-3 text-sm font-medium truncate">{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar className="border-r ucs-hairline ucs-surface-1">
      {/* Brand */}
      <div className="px-4 py-4 border-b ucs-hairline">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={fabulousLogo} alt="Ultimate Creator Studio" className="w-8 h-8 object-contain rounded-md" />
          </div>
          {showText && (
            <div className="min-w-0">
              <div className="text-[13px] font-bold ucs-text leading-tight truncate">Ultimate Creator</div>
              <div className="text-[11px] ucs-text-dim font-medium tracking-wide">STUDIO</div>
            </div>
          )}
        </div>
      </div>

      <SidebarContent className="px-2 py-3 ucs-surface-1">
        <Section label="Growth" items={growth} />
        <Section label="YouTube" items={youtube} />
        <Section label="Instagram" items={instagram} />
        <Section label="Create" items={create} />
        <Section label="AI Tools" items={aiTools} />
      </SidebarContent>

      <SidebarFooter className="p-2 border-t ucs-hairline ucs-surface-1">
        <SidebarMenuButton asChild className="h-9">
          <button onClick={() => navigate("/pricing")} className={itemCls("/pricing")}>
            <Crown className="h-[18px] w-[18px]" />
            {showText && <span className="ml-3 text-sm font-medium">Upgrade</span>}
          </button>
        </SidebarMenuButton>
        <SidebarMenuButton asChild className="h-9">
          <button onClick={() => navigate("/settings")} className={itemCls("/settings")}>
            <Settings className="h-[18px] w-[18px]" />
            {showText && <span className="ml-3 text-sm font-medium">Settings</span>}
          </button>
        </SidebarMenuButton>
        <SidebarMenuButton asChild className="h-9">
          <button onClick={handleSignOut} className="flex items-center w-full px-3 rounded-lg text-[hsl(240_5%_65%)] hover:text-red-400 hover:bg-red-500/10 transition-all duration-150">
            <LogOut className="h-[18px] w-[18px]" />
            {showText && <span className="ml-3 text-sm font-medium">Sign out</span>}
          </button>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
