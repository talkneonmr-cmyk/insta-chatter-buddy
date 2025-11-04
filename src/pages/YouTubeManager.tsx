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
import YouTubeBoostSuggestions from "@/components/YouTubeBoostSuggestions";

const YouTubeManager = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("upload");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-3 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 slide-in">
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
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Upload, schedule, and manage your YouTube videos with AI</p>
            </div>
          </div>
        </div>

        {/* YouTube Account Connection */}
        <YouTubeAccountConnect />

        {/* Main Content */}
        <Card className="p-3 md:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 h-auto">
              <TabsTrigger value="upload" className="text-xs md:text-sm px-2 py-2">
                <span className="hidden sm:inline">Upload</span>
                <span className="sm:hidden">Upload</span>
              </TabsTrigger>
              <TabsTrigger value="scheduled" className="text-xs md:text-sm px-2 py-2">
                <span className="hidden sm:inline">Scheduled</span>
                <span className="sm:hidden">Queue</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs md:text-sm px-2 py-2">
                <span className="hidden sm:inline">Analytics</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
              <TabsTrigger value="boost" className="text-xs md:text-sm px-2 py-2">
                <span className="hidden sm:inline">Boost</span>
                <span className="sm:hidden">Boost</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs md:text-sm px-2 py-2">
                <span className="hidden sm:inline">History</span>
                <span className="sm:hidden">History</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-4 md:mt-6">
              <VideoUploadForm />
            </TabsContent>

            <TabsContent value="scheduled" className="mt-4 md:mt-6">
              <ScheduledVideosList />
            </TabsContent>

            <TabsContent value="analytics" className="mt-4 md:mt-6">
              <YouTubeChannelAnalytics />
            </TabsContent>

            <TabsContent value="boost" className="mt-4 md:mt-6">
              <YouTubeBoostSuggestions />
            </TabsContent>

            <TabsContent value="history" className="mt-4 md:mt-6">
              <UploadHistory />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default YouTubeManager;