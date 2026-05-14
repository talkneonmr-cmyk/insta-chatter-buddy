import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Youtube, Upload } from "lucide-react";
import ScheduledVideosList from "@/components/ScheduledVideosList";
import YouTubeAccountConnect from "@/components/YouTubeAccountConnect";
import InstagramAccountConnect from "@/components/InstagramAccountConnect";
import UploadHistory from "@/components/UploadHistory";
import YouTubeChannelAnalytics from "@/components/YouTubeChannelAnalytics";
import YouTubeVideoManager from "@/components/YouTubeVideoManager";
import YouTubePlaylistManager from "@/components/YouTubePlaylistManager";
import YouTubeBulkOperations from "@/components/YouTubeBulkOperations";
import YouTubePerformanceMonitor from "@/components/YouTubePerformanceMonitor";
import ToolHeader from "@/components/ToolHeader";

const YouTubeManager = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("uploads");
  const [uploadsSub, setUploadsSub] = useState<"scheduled" | "history">("scheduled");
  const [libSub, setLibSub] = useState<"videos" | "playlists">("videos");
  const [analyticsSub, setAnalyticsSub] = useState<"analytics" | "performance">("analytics");

  const SubTab = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
        active
          ? "ucs-accent-soft ucs-accent"
          : "ucs-text-muted hover:ucs-text"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen ucs-surface-0 ucs-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <ToolHeader
          icon={Youtube}
          title="YouTube Manager"
          subtitle="Uploads, library, analytics — one place."
          iconAccent="text-red-500"
          action={
            <button
              onClick={() => navigate("/youtube-upload-studio")}
              className="ucs-accent-bg text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 inline-flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Studio
            </button>
          }
        />

        <div className="space-y-4 mb-6">
          <YouTubeAccountConnect />
          <InstagramAccountConnect />
        </div>

        <div className="ucs-card p-4 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 h-auto bg-transparent p-1 ucs-surface-1 rounded-lg">
              <TabsTrigger value="uploads" className="text-xs sm:text-sm">Uploads</TabsTrigger>
              <TabsTrigger value="library" className="text-xs sm:text-sm">Library</TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
              <TabsTrigger value="bulk" className="text-xs sm:text-sm">Bulk Ops</TabsTrigger>
            </TabsList>

            <TabsContent value="uploads" className="mt-6 space-y-4">
              <div className="flex gap-1">
                <SubTab active={uploadsSub === "scheduled"} onClick={() => setUploadsSub("scheduled")}>Scheduled</SubTab>
                <SubTab active={uploadsSub === "history"} onClick={() => setUploadsSub("history")}>History</SubTab>
              </div>
              {uploadsSub === "scheduled" ? <ScheduledVideosList /> : <UploadHistory />}
            </TabsContent>

            <TabsContent value="library" className="mt-6 space-y-4">
              <div className="flex gap-1">
                <SubTab active={libSub === "videos"} onClick={() => setLibSub("videos")}>Videos</SubTab>
                <SubTab active={libSub === "playlists"} onClick={() => setLibSub("playlists")}>Playlists</SubTab>
              </div>
              {libSub === "videos" ? <YouTubeVideoManager /> : <YouTubePlaylistManager />}
            </TabsContent>

            <TabsContent value="analytics" className="mt-6 space-y-4">
              <div className="flex gap-1">
                <SubTab active={analyticsSub === "analytics"} onClick={() => setAnalyticsSub("analytics")}>Channel</SubTab>
                <SubTab active={analyticsSub === "performance"} onClick={() => setAnalyticsSub("performance")}>Performance</SubTab>
              </div>
              {analyticsSub === "analytics" ? <YouTubeChannelAnalytics /> : <YouTubePerformanceMonitor />}
            </TabsContent>

            <TabsContent value="bulk" className="mt-6">
              <YouTubeBulkOperations />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default YouTubeManager;
