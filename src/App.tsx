import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { MaintenanceGuard } from "./components/MaintenanceGuard";
import { WebsiteClosedGuard } from "./components/WebsiteClosedGuard";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminLogin from "./pages/AdminLogin";
import About from "./pages/About";
import Press from "./pages/Press";
import Settings from "./pages/Settings";
import CaptionGenerator from "./pages/CaptionGenerator";
import YouTubeManager from "./pages/YouTubeManager";
import YouTubeUploadStudio from "./pages/YouTubeUploadStudio";
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
import FaceSwap from "./pages/FaceSwap";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth and admin-login routes without guards */}
          <Route path="/auth" element={<WebsiteClosedGuard><Auth /></WebsiteClosedGuard>} />
          <Route path="/admin-login" element={<AdminLogin />} />
          
          {/* All other routes with sidebar layout, website closed guard, and maintenance guard */}
          <Route path="/" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><Index /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/about" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><About /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/press" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><Press /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/settings" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><Settings /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/caption-generator" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><CaptionGenerator /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/thumbnail-generator" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><ThumbnailGenerator /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/script-writer" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><ScriptWriter /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/youtube-manager" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><YouTubeManager /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/youtube-upload-studio" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><YouTubeUploadStudio /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/music-generator" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><MusicGenerator /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/trend-analyzer" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><TrendAnalyzer /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/seo-optimizer" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><SEOOptimizer /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/hashtag-generator" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><HashtagGenerator /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/shorts-factory" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><ShortsFactory /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/comment-auto-responder" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><CommentAutoResponder /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/background-removal" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><BackgroundRemoval /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/speech-to-text" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><SpeechToText /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/text-summarizer" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><TextSummarizer /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/image-enhancement" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><ImageEnhancement /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/voice-cloning" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><VoiceCloning /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/text-to-speech" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><TextToSpeech /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/dubbing" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><Dubbing /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/ai-agents" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><AIAgents /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/creator-helper-bot" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><CreatorHelperBot /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/you-research" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><YouResearch /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/face-swap" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><FaceSwap /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/pricing" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><Pricing /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/payment-success" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><PaymentSuccess /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          <Route path="/admin" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><Admin /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><NotFound /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
