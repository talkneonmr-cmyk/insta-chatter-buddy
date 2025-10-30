import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();
  
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
