import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Palette, Wand2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThumbnailCanvas } from "@/components/thumbnail-editor/ThumbnailCanvas";
import { BackgroundRemover } from "@/components/thumbnail-editor/BackgroundRemover";
import { AITemplateGenerator } from "@/components/thumbnail-editor/AITemplateGenerator";
import ThumbnailHistory from "@/components/ThumbnailHistory";


const ThumbnailGenerator = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4 md:p-8">
      <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Palette className="h-10 w-10" />
            Professional Thumbnail Studio
          </h1>
          <p className="text-muted-foreground text-lg">
            Create stunning YouTube thumbnails with pro-level tools
          </p>
        </div>

        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="editor">
              <Palette className="h-4 w-4 mr-2" />
              Canvas Editor
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Wand2 className="h-4 w-4 mr-2" />
              AI Templates
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Thumbnail Canvas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ThumbnailCanvas />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <BackgroundRemover />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AITemplateGenerator />
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p>✨ Be specific in your prompts</p>
                    <p>🎨 Mention colors and style</p>
                    <p>📐 Include composition details</p>
                    <p>💡 Add "dramatic", "professional" for better results</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <ThumbnailHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ThumbnailGenerator;
