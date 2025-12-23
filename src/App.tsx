import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { MaintenanceGuard } from "./components/MaintenanceGuard";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import About from "./pages/About";
import Press from "./pages/Press";
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
import SpeechToText from "./pages/SpeechToText";
import TextSummarizer from "./pages/TextSummarizer";
import BackgroundRemoval from "./pages/BackgroundRemoval";
import ImageEnhancement from "./pages/ImageEnhancement";
import VoiceCloning from "./pages/VoiceCloning";
import TextToSpeech from "./pages/TextToSpeech";
import Dubbing from "./pages/Dubbing";
import AIAgents from "./pages/AIAgents";
import CreatorHelperBot from "./pages/CreatorHelperBot";
import CommentAutoResponder from "./pages/CommentAutoResponder";
import ShortsFactory from "./pages/ShortsFactory";
import YouResearch from "./pages/YouResearch";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth route without layout or maintenance guard */}
          <Route path="/auth" element={<Auth />} />
          
          {/* All other routes with sidebar layout and maintenance guard */}
          <Route path="/" element={<MaintenanceGuard><Layout><Index /></Layout></MaintenanceGuard>} />
          <Route path="/about" element={<MaintenanceGuard><Layout><About /></Layout></MaintenanceGuard>} />
          <Route path="/press" element={<MaintenanceGuard><Layout><Press /></Layout></MaintenanceGuard>} />
          <Route path="/settings" element={<MaintenanceGuard><Layout><Settings /></Layout></MaintenanceGuard>} />
          <Route path="/caption-generator" element={<MaintenanceGuard><Layout><CaptionGenerator /></Layout></MaintenanceGuard>} />
          <Route path="/thumbnail-generator" element={<MaintenanceGuard><Layout><ThumbnailGenerator /></Layout></MaintenanceGuard>} />
          <Route path="/script-writer" element={<MaintenanceGuard><Layout><ScriptWriter /></Layout></MaintenanceGuard>} />
          <Route path="/youtube-manager" element={<MaintenanceGuard><Layout><YouTubeManager /></Layout></MaintenanceGuard>} />
          <Route path="/music-generator" element={<MaintenanceGuard><Layout><MusicGenerator /></Layout></MaintenanceGuard>} />
          <Route path="/trend-analyzer" element={<MaintenanceGuard><Layout><TrendAnalyzer /></Layout></MaintenanceGuard>} />
          <Route path="/seo-optimizer" element={<MaintenanceGuard><Layout><SEOOptimizer /></Layout></MaintenanceGuard>} />
          <Route path="/hashtag-generator" element={<MaintenanceGuard><Layout><HashtagGenerator /></Layout></MaintenanceGuard>} />
          <Route path="/shorts-factory" element={<MaintenanceGuard><Layout><ShortsFactory /></Layout></MaintenanceGuard>} />
          <Route path="/comment-auto-responder" element={<MaintenanceGuard><Layout><CommentAutoResponder /></Layout></MaintenanceGuard>} />
          <Route path="/background-removal" element={<MaintenanceGuard><Layout><BackgroundRemoval /></Layout></MaintenanceGuard>} />
          <Route path="/speech-to-text" element={<MaintenanceGuard><Layout><SpeechToText /></Layout></MaintenanceGuard>} />
          <Route path="/text-summarizer" element={<MaintenanceGuard><Layout><TextSummarizer /></Layout></MaintenanceGuard>} />
          <Route path="/image-enhancement" element={<MaintenanceGuard><Layout><ImageEnhancement /></Layout></MaintenanceGuard>} />
          <Route path="/voice-cloning" element={<MaintenanceGuard><Layout><VoiceCloning /></Layout></MaintenanceGuard>} />
          <Route path="/text-to-speech" element={<MaintenanceGuard><Layout><TextToSpeech /></Layout></MaintenanceGuard>} />
          <Route path="/dubbing" element={<MaintenanceGuard><Layout><Dubbing /></Layout></MaintenanceGuard>} />
          <Route path="/ai-agents" element={<MaintenanceGuard><Layout><AIAgents /></Layout></MaintenanceGuard>} />
          <Route path="/creator-helper-bot" element={<MaintenanceGuard><Layout><CreatorHelperBot /></Layout></MaintenanceGuard>} />
          <Route path="/you-research" element={<MaintenanceGuard><Layout><YouResearch /></Layout></MaintenanceGuard>} />
          <Route path="/pricing" element={<MaintenanceGuard><Layout><Pricing /></Layout></MaintenanceGuard>} />
          <Route path="/payment-success" element={<MaintenanceGuard><Layout><PaymentSuccess /></Layout></MaintenanceGuard>} />
          <Route path="/admin" element={<MaintenanceGuard><Layout><Admin /></Layout></MaintenanceGuard>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<MaintenanceGuard><Layout><NotFound /></Layout></MaintenanceGuard>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
