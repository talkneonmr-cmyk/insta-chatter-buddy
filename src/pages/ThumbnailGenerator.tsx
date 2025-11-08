import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThumbnailCanvas } from "@/components/thumbnail-editor/ThumbnailCanvas";
import { BackgroundRemover } from "@/components/thumbnail-editor/BackgroundRemover";
import { AITemplateGenerator } from "@/components/thumbnail-editor/AITemplateGenerator";
import { ProTemplates } from "@/components/thumbnail-editor/ProTemplates";
import { AITextGenerator } from "@/components/thumbnail-editor/AITextGenerator";
import ThumbnailHistory from "@/components/ThumbnailHistory";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ThumbnailGenerator = () => {
  const navigate = useNavigate();
  const [generatingTemplate, setGeneratingTemplate] = useState(false);
  const [activeTab, setActiveTab] = useState("templates");
  const aiGeneratorRef = useRef<{ generateFromPrompt: (prompt: string) => void }>(null);

  const handleTemplateSelect = async (prompt: string, templateName: string) => {
    setGeneratingTemplate(true);
    toast.info(`Generating ${templateName}...`);
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-thumbnail", {
        body: {
          prompt: prompt,
          style: "professional",
          title: templateName,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Pro thumbnail generated!");
      
      // Switch to AI tab to show result
      setActiveTab("ai");
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate");
    } finally {
      setGeneratingTemplate(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4 md:p-8">
      <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold flex items-center justify-center gap-3">
            <Crown className="h-10 w-10 text-yellow-500" />
            Pro Thumbnail Studio
          </h1>
          <p className="text-muted-foreground text-lg">
            Create viral thumbnails like top YouTubers • MrBeast-level quality
          </p>
          <div className="flex items-center justify-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-muted-foreground">
              AI-Powered • Professional Templates • Background Removal
            </span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="templates">
              <Crown className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Pro Templates</span>
              <span className="sm:hidden">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Zap className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">AI Generator</span>
              <span className="sm:hidden">AI</span>
            </TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ProTemplates 
                  onSelectTemplate={handleTemplateSelect}
                  isGenerating={generatingTemplate}
                />
              </div>
              <div className="space-y-6">
                <AITextGenerator />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AITemplateGenerator />
              </div>
              <div className="space-y-6">
                <AITextGenerator />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="editor">
            <ThumbnailCanvas />
          </TabsContent>

          <TabsContent value="tools">
            <div className="grid md:grid-cols-2 gap-6">
              <BackgroundRemover />
              <AITextGenerator />
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
