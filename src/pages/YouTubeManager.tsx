import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Youtube } from "lucide-react";
import VideoUploadForm from "@/components/VideoUploadForm";
import ScheduledVideosList from "@/components/ScheduledVideosList";
import YouTubeAccountConnect from "@/components/YouTubeAccountConnect";
import UploadHistory from "@/components/UploadHistory";
import YouTubeChannelAnalytics from "@/components/YouTubeChannelAnalytics";
import YouTubeVideoManager from "@/components/YouTubeVideoManager";
import YouTubePlaylistManager from "@/components/YouTubePlaylistManager";

const YouTubeManager = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("upload");

  return (
    <div className="min-h-screen relative overflow-hidden p-3 md:p-8">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>
      
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3 md:gap-4 animate-fade-in">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="card-3d shrink-0 glass hover:glass-dark"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3 md:gap-4 min-w-0 glass rounded-2xl p-4 md:p-6 flex-1">
            <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl floating shrink-0 shadow-lg">
              <Youtube className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-4xl font-bold gradient-text">YouTube Manager</h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                Upload, schedule, and manage your videos with AI
              </p>
            </div>
          </div>
        </div>

        {/* YouTube Account Connection */}
        <YouTubeAccountConnect />

        {/* Main Content */}
        <Card className="glass border-0 shadow-2xl p-4 md:p-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6 h-auto gap-1">
              <TabsTrigger value="upload" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-2 min-w-0">
                <span className="truncate">Upload</span>
              </TabsTrigger>
              <TabsTrigger value="scheduled" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-2 min-w-0">
                <span className="truncate hidden xs:inline">Scheduled</span>
                <span className="truncate xs:hidden">Sched</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-2 min-w-0">
                <span className="truncate">History</span>
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

            <TabsContent value="upload" className="mt-4 md:mt-6">
              <VideoUploadForm />
            </TabsContent>

            <TabsContent value="scheduled" className="mt-4 md:mt-6">
              <ScheduledVideosList />
            </TabsContent>

            <TabsContent value="history" className="mt-4 md:mt-6">
              <UploadHistory />
            </TabsContent>

            <TabsContent value="analytics" className="mt-4 md:mt-6">
              <YouTubeChannelAnalytics />
            </TabsContent>

            <TabsContent value="videos" className="mt-4 md:mt-6">
              <YouTubeVideoManager />
            </TabsContent>

            <TabsContent value="playlists" className="mt-4 md:mt-6">
              <YouTubePlaylistManager />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default YouTubeManager;