import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { MaintenanceGuard } from "./components/MaintenanceGuard";
import { WebsiteClosedGuard } from "./components/WebsiteClosedGuard";

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
    <div className="h-8 w-8 rounded-full border-2 border-muted border-t-primary animate-spin" />
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => (
  <WebsiteClosedGuard>
    <MaintenanceGuard>
      <Layout>{children}</Layout>
    </MaintenanceGuard>
  </WebsiteClosedGuard>
);

export default function AppRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/auth" element={<WebsiteClosedGuard><Auth /></WebsiteClosedGuard>} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
            <Route path="/press" element={<ProtectedRoute><Press /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/caption-generator" element={<ProtectedRoute><CaptionGenerator /></ProtectedRoute>} />
            <Route path="/thumbnail-generator" element={<ProtectedRoute><ThumbnailGenerator /></ProtectedRoute>} />
            <Route path="/script-writer" element={<ProtectedRoute><ScriptWriter /></ProtectedRoute>} />
            <Route path="/youtube-manager" element={<ProtectedRoute><YouTubeManager /></ProtectedRoute>} />
            <Route path="/youtube-upload-studio" element={<ProtectedRoute><YouTubeUploadStudio /></ProtectedRoute>} />
            <Route path="/music-generator" element={<ProtectedRoute><MusicGenerator /></ProtectedRoute>} />
            <Route path="/trend-analyzer" element={<ProtectedRoute><TrendAnalyzer /></ProtectedRoute>} />
            <Route path="/seo-optimizer" element={<ProtectedRoute><SEOOptimizer /></ProtectedRoute>} />
            <Route path="/hashtag-generator" element={<ProtectedRoute><HashtagGenerator /></ProtectedRoute>} />
            <Route path="/shorts-factory" element={<ProtectedRoute><ShortsFactory /></ProtectedRoute>} />
            <Route path="/comment-auto-responder" element={<ProtectedRoute><CommentAutoResponder /></ProtectedRoute>} />
            <Route path="/background-removal" element={<ProtectedRoute><BackgroundRemoval /></ProtectedRoute>} />
            <Route path="/speech-to-text" element={<ProtectedRoute><SpeechToText /></ProtectedRoute>} />
            <Route path="/text-summarizer" element={<ProtectedRoute><TextSummarizer /></ProtectedRoute>} />
            <Route path="/image-enhancement" element={<ProtectedRoute><ImageEnhancement /></ProtectedRoute>} />
            <Route path="/voice-cloning" element={<ProtectedRoute><VoiceCloning /></ProtectedRoute>} />
            <Route path="/text-to-speech" element={<ProtectedRoute><TextToSpeech /></ProtectedRoute>} />
            <Route path="/dubbing" element={<ProtectedRoute><Dubbing /></ProtectedRoute>} />
            <Route path="/ai-agents" element={<ProtectedRoute><AIAgents /></ProtectedRoute>} />
            <Route path="/creator-helper-bot" element={<ProtectedRoute><CreatorHelperBot /></ProtectedRoute>} />
            <Route path="/you-research" element={<ProtectedRoute><YouResearch /></ProtectedRoute>} />
            <Route path="/face-swap" element={<ProtectedRoute><FaceSwap /></ProtectedRoute>} />
            <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
            <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  );
}