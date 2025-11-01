import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, Scissors, Loader2, Image, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { removeBackground, loadImage } from "@/lib/backgroundRemoval";

const BackgroundRemoval = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [removingBg, setRemovingBg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setProcessedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBackground = async () => {
    if (!uploadedImage) {
      toast({
        title: "No image uploaded",
        description: "Please upload an image first",
        variant: "destructive"
      });
      return;
    }

    setRemovingBg(true);
    try {
      // Convert data URL to blob
      const response = await fetch(uploadedImage);
      const blob = await response.blob();
      
      // Load image
      const img = await loadImage(blob);
      
      // Remove background
      toast({
        title: "Processing...",
        description: "Removing background with AI. This may take a moment."
      });
      
      const resultBlob = await removeBackground(img);
      const resultUrl = URL.createObjectURL(resultBlob);
      
      setProcessedImage(resultUrl);
      
      toast({
        title: "Background removed!",
        description: "Your image is ready to download"
      });
    } catch (error: any) {
      console.error('Background removal error:', error);
      toast({
        title: "Processing failed",
        description: error.message || "Failed to remove background. Make sure WebGPU is supported.",
        variant: "destructive"
      });
    } finally {
      setRemovingBg(false);
    }
  };

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
            <div className="p-2 bg-blue-500/10 rounded-lg float-animation">
              <Scissors className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Background Removal</h1>
              <p className="text-muted-foreground">Remove backgrounds from images with AI - 100% Free!</p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="border-blue-500/20 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h3 className="font-semibold text-blue-500">Completely Free AI Processing</h3>
                <p className="text-sm text-muted-foreground">
                  This tool runs entirely in your browser using WebGPU. No server uploads, no API keys needed, 
                  unlimited usage, and your images stay 100% private on your device.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-500" />
                Upload Image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <Button
                variant="outline"
                className="w-full h-32 border-2 border-dashed hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload an image
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, WEBP (max 1024px)
                  </p>
                </div>
              </Button>

              {uploadedImage && (
                <>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border">
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded" 
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <Button
                    onClick={handleRemoveBackground}
                    disabled={removingBg}
                    className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:opacity-90"
                    size="lg"
                  >
                    {removingBg ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Removing Background...
                      </>
                    ) : (
                      <>
                        <Scissors className="mr-2 h-4 w-4" />
                        Remove Background
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    <span>Processing happens in your browser - 100% private</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Result Section */}
          {processedImage ? (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-green-500" />
                  Background Removed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-muted via-background to-muted border">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.05)_25%,rgba(255,255,255,.05)_75%,transparent_75%,transparent),linear-gradient(45deg,transparent_25%,rgba(255,255,255,.05)_25%,rgba(255,255,255,.05)_75%,transparent_75%,transparent)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]"></div>
                  <img 
                    src={processedImage} 
                    alt="Processed" 
                    className="relative w-full h-full object-contain"
                  />
                </div>
                <div className="mt-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(processedImage, '_blank')}
                    className="flex-1"
                  >
                    <Image className="mr-2 h-4 w-4" />
                    View Full Size
                  </Button>
                  <Button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = processedImage;
                      link.download = 'no-background.png';
                      link.click();
                    }}
                    className="flex-1"
                  >
                    Download PNG
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-fit">
              <CardContent className="p-12">
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-20 animate-pulse"></div>
                    <div className="relative p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl">
                      <Scissors className="w-10 h-10 text-blue-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Ready to Process</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload an image to remove its background
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* How it Works */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">1</div>
                  <h4 className="font-semibold">Upload Image</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Choose any image from your device (JPG, PNG, or WEBP format)
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 font-bold">2</div>
                  <h4 className="font-semibold">AI Processing</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Our AI model identifies and removes the background using WebGPU
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 font-bold">3</div>
                  <h4 className="font-semibold">Download Result</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get your transparent PNG image ready to use anywhere
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BackgroundRemoval;
