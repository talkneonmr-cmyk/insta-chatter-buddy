import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import CaptionGenerator from "./pages/CaptionGenerator";
import YouTubeManager from "./pages/YouTubeManager";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import MusicGenerator from "./pages/MusicGenerator";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import ThumbnailGenerator from "./pages/ThumbnailGenerator";
import ScriptWriter from "./pages/ScriptWriter";
import TrendAnalyzer from "./pages/TrendAnalyzer";
import SEOOptimizer from "./pages/SEOOptimizer";
import HashtagGenerator from "./pages/HashtagGenerator";
import ContentRepurposer from "./pages/ContentRepurposer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth route without layout */}
          <Route path="/auth" element={<Auth />} />
          
          {/* All other routes with sidebar layout */}
          <Route path="/" element={<Layout><Index /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          <Route path="/caption-generator" element={<Layout><CaptionGenerator /></Layout>} />
          <Route path="/thumbnail-generator" element={<Layout><ThumbnailGenerator /></Layout>} />
          <Route path="/script-writer" element={<Layout><ScriptWriter /></Layout>} />
          <Route path="/youtube-manager" element={<Layout><YouTubeManager /></Layout>} />
          <Route path="/music-generator" element={<Layout><MusicGenerator /></Layout>} />
          <Route path="/trend-analyzer" element={<Layout><TrendAnalyzer /></Layout>} />
          <Route path="/seo-optimizer" element={<Layout><SEOOptimizer /></Layout>} />
          <Route path="/hashtag-generator" element={<Layout><HashtagGenerator /></Layout>} />
          <Route path="/content-repurposer" element={<Layout><ContentRepurposer /></Layout>} />
          <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
          <Route path="/payment-success" element={<Layout><PaymentSuccess /></Layout>} />
          <Route path="/admin" element={<Layout><Admin /></Layout>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
