import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Footer } from "./Footer";
import { NotificationBell } from "./NotificationBell";
import { Menu, Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        if (!session) {
          navigate('/auth');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl blur-xl opacity-60 animate-glow"></div>
            <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 backdrop-blur-xl">
              <Sparkles className="w-10 h-10 text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  // Only render protected content if authenticated
  if (!session && !user) {
    return null;
  }
  
  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-muted/20 to-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col w-full">
          {/* Top Bar */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-top">
            <div className="flex h-14 items-center gap-4 px-3 md:px-4">
              <SidebarTrigger className="hover:bg-accent p-1.5 md:p-2 rounded-lg transition-all active:scale-95">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              
              <NotificationBell />
              
              <div className="flex-1" />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto [-webkit-overflow-scrolling:touch] safe-bottom">
            <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
              <div className="flex-1">{children}</div>
              <Footer />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
