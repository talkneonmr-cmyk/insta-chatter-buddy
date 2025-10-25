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

const YouTubeManager = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("upload");

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Youtube className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">YouTube Manager</h1>
              <p className="text-muted-foreground">Upload, schedule, and manage your YouTube videos with AI</p>
            </div>
          </div>
        </div>

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