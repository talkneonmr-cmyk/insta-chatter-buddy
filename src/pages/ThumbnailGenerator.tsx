import { useNavigate } from "react-router-dom";
import { Crown, Zap, History, Sparkles } from "lucide-react";
import ToolHeader from "@/components/ToolHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProTemplateSelector } from "@/components/thumbnail-editor/ProTemplateSelector";
import { BackgroundRemover } from "@/components/thumbnail-editor/BackgroundRemover";
import ThumbnailHistory from "@/components/ThumbnailHistory";
import SubscriptionGuard from "@/components/SubscriptionGuard";

const ThumbnailGenerator = () => {
  const navigate = useNavigate();

  return (
    <SubscriptionGuard featureName="AI Thumbnail Generator">
      <div className="min-h-screen ucs-surface-0 ucs-text">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        <ToolHeader
          icon={Crown}
          title="Pro Thumbnail Studio"
          subtitle="Create viral YouTube thumbnails in 2 simple steps."
          badge="CREATE"
          iconAccent="text-yellow-500"
        />

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
    </SubscriptionGuard>
  );
};

export default ThumbnailGenerator;
