import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
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
    // Check for tester session first
    const testerSessionToken = localStorage.getItem('tester_session_token');
    const isTesterFlag = localStorage.getItem('is_tester');
    
    if (testerSessionToken && isTesterFlag === 'true') {
      // Verify tester session is valid
      supabase
        .from('tester_sessions')
        .select('id, expires_at')
        .eq('session_token', testerSessionToken)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error || !data || new Date(data.expires_at) < new Date()) {
            // Invalid or expired tester session
            localStorage.removeItem('tester_session_token');
            localStorage.removeItem('is_tester');
            navigate('/auth');
          } else {
            // Valid tester session - allow access
            setLoading(false);
          }
        });
    } else {
      // No tester session, check regular auth
      checkRegularAuth();
    }

    function checkRegularAuth() {
      // Set up auth state listener FIRST
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log('Auth state changed:', event);
          setSession(session);
          setUser(session?.user ?? null);
          
          // Redirect to auth if no session and no tester token
          if (!session && !localStorage.getItem('tester_session_token')) {
            navigate('/auth');
          }
        }
      );

      // THEN check for existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Redirect to auth if no session and no tester token
        if (!session && !localStorage.getItem('tester_session_token')) {
          navigate('/auth');
        }
      });

      return () => subscription.unsubscribe();
    }
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

  // Only render protected content if authenticated or has valid tester session
  const testerSessionToken = localStorage.getItem('tester_session_token');
  if (!session && !user && !testerSessionToken) {
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
              
              <div className="flex-1" />
              
              {/* Additional header content can go here */}
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto [-webkit-overflow-scrolling:touch] safe-bottom">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
