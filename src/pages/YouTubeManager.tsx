import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Youtube, Upload, ExternalLink } from "lucide-react";
import ScheduledVideosList from "@/components/ScheduledVideosList";
import YouTubeAccountConnect from "@/components/YouTubeAccountConnect";
import UploadHistory from "@/components/UploadHistory";
import YouTubeChannelAnalytics from "@/components/YouTubeChannelAnalytics";
import YouTubeVideoManager from "@/components/YouTubeVideoManager";
import YouTubePlaylistManager from "@/components/YouTubePlaylistManager";
import YouTubeBulkOperations from "@/components/YouTubeBulkOperations";
import YouTubePerformanceMonitor from "@/components/YouTubePerformanceMonitor";

const YouTubeManager = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("scheduled");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-3 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 slide-in">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="btn-3d shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="p-2 bg-red-500/10 rounded-lg float-animation shrink-0">
                <Youtube className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-3xl font-bold gradient-text">YouTube Manager</h1>
                <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Manage your YouTube videos, analytics & playlists</p>
              </div>
            </div>
          </div>
          
          {/* Upload Studio Button */}
          <Button 
            onClick={() => navigate("/youtube-upload-studio")}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Upload className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Upload Studio</span>
            <span className="sm:hidden">Upload</span>
          </Button>
        </div>

        {/* YouTube Account Connection */}
        <YouTubeAccountConnect />

        {/* Main Content */}
        <Card className="p-3 md:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7 h-auto gap-1">
              <TabsTrigger value="scheduled" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-2 min-w-0">
                <span className="truncate hidden xs:inline">Scheduled</span>
                <span className="truncate xs:hidden">Sched</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-2 min-w-0">
                <span className="truncate">History</span>
              </TabsTrigger>
              <TabsTrigger value="bulk" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-2 min-w-0">
                <span className="truncate hidden xs:inline">Bulk Ops</span>
                <span className="truncate xs:hidden">Bulk</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-2 min-w-0">
                <span className="truncate hidden xs:inline">Performance</span>
                <span className="truncate xs:hidden">Perf</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-2 min-w-0">
                <span className="truncate hidden xs:inline">Analytics</span>
                <span className="truncate xs:hidden">Stats</span>
              </TabsTrigger>
              <TabsTrigger value="videos" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-2 min-w-0">
                <span className="truncate">Videos</span>
              </TabsTrigger>
              <TabsTrigger value="playlists" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-2 min-w-0">
                <span className="truncate hidden xs:inline">Playlists</span>
                <span className="truncate xs:hidden">Lists</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scheduled" className="mt-4 md:mt-6">
              <ScheduledVideosList />
            </TabsContent>

            <TabsContent value="history" className="mt-4 md:mt-6">
              <UploadHistory />
            </TabsContent>

            <TabsContent value="bulk" className="mt-4 md:mt-6">
              {activeTab === 'bulk' && <YouTubeBulkOperations />}
            </TabsContent>

            <TabsContent value="performance" className="mt-4 md:mt-6">
              {activeTab === 'performance' && <YouTubePerformanceMonitor />}
            </TabsContent>

            <TabsContent value="analytics" className="mt-4 md:mt-6">
              <YouTubeChannelAnalytics />
            </TabsContent>

            <TabsContent value="videos" className="mt-4 md:mt-6">
              {activeTab === 'videos' && <YouTubeVideoManager />}
            </TabsContent>

            <TabsContent value="playlists" className="mt-4 md:mt-6">
              {activeTab === 'playlists' && <YouTubePlaylistManager />}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default YouTubeManager;