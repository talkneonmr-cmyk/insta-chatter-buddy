import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, Zap, History, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProTemplateSelector } from "@/components/thumbnail-editor/ProTemplateSelector";
import { BackgroundRemover } from "@/components/thumbnail-editor/BackgroundRemover";
import ThumbnailHistory from "@/components/ThumbnailHistory";

const ThumbnailGenerator = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4 md:p-8">
      <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-6xl font-bold flex items-center justify-center gap-3">
            <Crown className="h-12 w-12 text-yellow-500 animate-pulse" />
            Pro Thumbnail Studio
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl">
            Create viral YouTube thumbnails in 2 simple steps
          </p>
          <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              <span>MrBeast Quality</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span>Viral Templates</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="create">
              <Crown className="h-4 w-4 mr-2" />
              Create
            </TabsTrigger>
            <TabsTrigger value="tools">
              <Zap className="h-4 w-4 mr-2" />
              Tools
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-8">
            <ProTemplateSelector />
          </TabsContent>

          <TabsContent value="tools" className="mt-8">
            <div className="max-w-2xl mx-auto">
              <BackgroundRemover />
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-8">
            <ThumbnailHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ThumbnailGenerator;
