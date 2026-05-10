import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Sparkles } from "lucide-react";
import { Layout } from "./components/Layout";
import { MaintenanceGuard } from "./components/MaintenanceGuard";
import { WebsiteClosedGuard } from "./components/WebsiteClosedGuard";

// Landing page is the entry route — keep eager for fastest first paint
import LandingPage from "./pages/LandingPage";

// Lazy-load every other route to drastically shrink the initial bundle
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const About = lazy(() => import("./pages/About"));
const Press = lazy(() => import("./pages/Press"));
const Settings = lazy(() => import("./pages/Settings"));
const CaptionGenerator = lazy(() => import("./pages/CaptionGenerator"));
const YouTubeManager = lazy(() => import("./pages/YouTubeManager"));
const YouTubeUploadStudio = lazy(() => import("./pages/YouTubeUploadStudio"));
const Pricing = lazy(() => import("./pages/Pricing"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const MusicGenerator = lazy(() => import("./pages/MusicGenerator"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ThumbnailGenerator = lazy(() => import("./pages/ThumbnailGenerator"));
const ScriptWriter = lazy(() => import("./pages/ScriptWriter"));
const TrendAnalyzer = lazy(() => import("./pages/TrendAnalyzer"));
const SEOOptimizer = lazy(() => import("./pages/SEOOptimizer"));
const HashtagGenerator = lazy(() => import("./pages/HashtagGenerator"));
const SpeechToText = lazy(() => import("./pages/SpeechToText"));
const TextSummarizer = lazy(() => import("./pages/TextSummarizer"));
const BackgroundRemoval = lazy(() => import("./pages/BackgroundRemoval"));
const ImageEnhancement = lazy(() => import("./pages/ImageEnhancement"));
const VoiceCloning = lazy(() => import("./pages/VoiceCloning"));
const TextToSpeech = lazy(() => import("./pages/TextToSpeech"));
const Dubbing = lazy(() => import("./pages/Dubbing"));
const AIAgents = lazy(() => import("./pages/AIAgents"));
const CreatorHelperBot = lazy(() => import("./pages/CreatorHelperBot"));
const CommentAutoResponder = lazy(() => import("./pages/CommentAutoResponder"));
const ShortsFactory = lazy(() => import("./pages/ShortsFactory"));
const YouResearch = lazy(() => import("./pages/YouResearch"));
const FaceSwap = lazy(() => import("./pages/FaceSwap"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
    <div className="text-center space-y-3 animate-fade-in">
      <Sparkles className="w-8 h-8 text-primary animate-pulse mx-auto" />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Public landing page */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth and admin-login routes without guards */}
            <Route path="/auth" element={<WebsiteClosedGuard><Auth /></WebsiteClosedGuard>} />
            <Route path="/admin-login" element={<AdminLogin />} />

            {/* All other routes with sidebar layout, website closed guard, and maintenance guard */}
            <Route path="/dashboard" element={<WebsiteClosedGuard><MaintenanceGuard><Layout><Index /></Layout></MaintenanceGuard></WebsiteClosedGuard>} />
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
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
