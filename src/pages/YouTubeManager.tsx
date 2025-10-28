import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Youtube, Sparkles } from "lucide-react";
import VideoUploadForm from "@/components/VideoUploadForm";
import ScheduledVideosList from "@/components/ScheduledVideosList";
import YouTubeAccountConnect from "@/components/YouTubeAccountConnect";
import UploadHistory from "@/components/UploadHistory";

const YouTubeManager = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("upload");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 slide-in">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="btn-3d"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg float-animation">
              <Youtube className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">YouTube Manager</h1>
              <p className="text-muted-foreground">Upload, schedule, and manage your YouTube videos with AI</p>
            </div>
          </div>
        </div>

        {/* AI Channel Creator Button */}
        <Card className="p-4 bg-gradient-to-r from-red-500/10 to-purple-500/10 border-red-500/20 glow-effect">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-red-500" />
                Create New Viral Channel
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Generate AI-optimized channel setup for maximum growth
              </p>
            </div>
            <Button onClick={() => navigate("/channel-creator")} size="lg" variant="gradient">
              <Sparkles className="h-4 w-4 mr-2" />
              Start Channel Creator
            </Button>
          </div>
        </Card>

        {/* YouTube Account Connection */}
        <YouTubeAccountConnect />

        {/* Main Content */}
        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Upload & Schedule</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled Videos</TabsTrigger>
              <TabsTrigger value="history">Upload History</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-6">
              <VideoUploadForm />
            </TabsContent>

            <TabsContent value="scheduled" className="mt-6">
              <ScheduledVideosList />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <UploadHistory />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default YouTubeManager;