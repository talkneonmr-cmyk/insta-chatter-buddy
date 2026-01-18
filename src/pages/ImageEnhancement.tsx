import { useState, useRef } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, Loader2, ImageIcon, Sparkles, Zap, Wand2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { useNavigate } from "react-router-dom";

const ImageEnhancement = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scale, setScale] = useState([2]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
        setEnhancedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnhance = async () => {
    if (!image) return;

    const { data: limitCheck, error: limitError } = await supabase.functions.invoke('check-usage-limit', {
      body: { limitType: 'ai_image_enhancement' }
    });

    if (limitError) {
      toast({
        title: "Error",
        description: "Failed to check usage limit",
        variant: "destructive"
      });
      return;
    }

    if (!limitCheck.canUse) {
      toast({
        title: "Daily limit reached",
        description: limitCheck.message,
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    toast({
      title: "Enhancing image...",
      description: `Upscaling ${scale[0]}x with AI`
    });
    
    try {
      const { data, error } = await supabase.functions.invoke('enhance-image', {
        body: { 
          imageData: image,
          scale: scale[0]
        }
      });

      if (error) throw error;
      if (!data?.enhancedImage) throw new Error('No enhanced image returned');

      setEnhancedImage(data.enhancedImage);
      
      await supabase.functions.invoke('increment-usage', {
        body: { usageType: 'ai_image_enhancement' }
      });

      toast({
        title: "Success!",
        description: `Image enhanced ${scale[0]}x successfully`
      });
    } catch (error: any) {
      console.error('Enhancement error:', error);
      let errorMessage = "Failed to enhance image";
      
      if (error.message?.includes('Rate limit')) {
        errorMessage = "Too many requests. Please wait a moment.";
      } else if (error.message?.includes('credits')) {
        errorMessage = "AI credits depleted. Please try again later.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!enhancedImage) return;
    
    const link = document.createElement("a");
    link.href = enhancedImage;
    link.download = `enhanced-${scale[0]}x.png`;
    link.click();
  };

  const getScaleLabel = (value: number) => {
    switch (value) {
      case 2: return "2x - Good";
      case 3: return "3x - Better";
      case 4: return "4x - Best";
      default: return `${value}x`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="h-8 sm:h-9 px-2 sm:px-3"
          >
            <ArrowLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </div>

        {/* Title Section */}
        <div className="text-center mb-6 sm:mb-8 px-2">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 rounded-full mb-3 sm:mb-4">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary animate-pulse" />
            <span className="text-xs sm:text-sm font-medium text-primary">AI-Powered</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            AI Image Enhancement
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Professional upscaling & enhancement in seconds
          </p>
        </div>

        {/* Main Content - Stack on mobile, side by side on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          
          {/* Left Column - Upload & Controls */}
          <div className="space-y-4 sm:space-y-6 order-1">
            {/* Upload Card */}
            <Card className="p-4 sm:p-6 border-2 border-dashed border-border hover:border-primary/50 transition-colors">
              <div 
                className="rounded-lg cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {image ? (
                  <div className="relative group">
                    <img 
                      src={image} 
                      alt="Original" 
                      className="w-full max-h-48 sm:max-h-64 lg:max-h-80 object-contain rounded-lg" 
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <p className="text-white font-medium flex items-center gap-2 text-sm sm:text-base">
                        <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                        Change image
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 sm:py-16 text-center space-y-3 sm:space-y-4">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <ImageIcon className="w-7 h-7 sm:w-10 sm:h-10 text-primary" />
                    </div>
                    <div>
                      <p className="text-base sm:text-lg font-medium">Tap to upload image</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">PNG, JPG up to 10MB</p>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </Card>

            {/* Enhancement Controls */}
            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Enhancement Settings
              </h3>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs sm:text-sm font-medium">Upscale Factor</label>
                    <span className="text-xs sm:text-sm text-primary font-semibold px-2 sm:px-3 py-1 bg-primary/10 rounded-full">
                      {getScaleLabel(scale[0])}
                    </span>
                  </div>
                  <Slider
                    value={scale}
                    onValueChange={setScale}
                    min={2}
                    max={4}
                    step={1}
                    className="w-full"
                    disabled={isProcessing}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>2x</span>
                    <span>3x</span>
                    <span>4x</span>
                  </div>
                </div>

                <Button 
                  className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold" 
                  size="lg"
                  onClick={handleEnhance}
                  disabled={!image || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Enhance Image
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Processing time: 10-15 seconds
                </p>
              </div>
            </Card>

            {/* Quick Features - Hidden on very small screens, grid on larger */}
            <div className="hidden sm:grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { icon: Sparkles, label: "AI Upscaling" },
                { icon: Zap, label: "Fast Results" },
                { icon: ImageIcon, label: "High Quality" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl bg-muted/50 text-center"
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span className="text-[10px] sm:text-xs font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Result Preview */}
          <div className="space-y-4 sm:space-y-6 order-2">
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <Download className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  <span className="truncate">Result</span>
                </h3>
                {enhancedImage && (
                  <Button
                    size="sm"
                    onClick={handleDownload}
                    className="gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm shrink-0"
                  >
                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Download</span>
                  </Button>
                )}
              </div>

              {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-16 sm:py-20 lg:py-24 text-center">
                  <div className="relative mb-4 sm:mb-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-primary/20 animate-pulse" />
                    <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-primary animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="font-medium text-sm sm:text-base lg:text-lg">Enhancing your image...</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                    This usually takes 10-15 seconds
                  </p>
                </div>
              ) : enhancedImage && image ? (
                <div className="space-y-3 sm:space-y-4">
                  <BeforeAfterSlider
                    beforeImage={image}
                    afterImage={enhancedImage}
                    beforeLabel="Original"
                    afterLabel={`${scale[0]}x`}
                  />
                  <p className="text-center text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-1 sm:gap-2">
                    <span>←</span>
                    Drag to compare
                    <span>→</span>
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 sm:py-20 lg:py-24 text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-muted flex items-center justify-center mb-3 sm:mb-4">
                    <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-muted-foreground/50" />
                  </div>
                  <p className="font-medium text-sm sm:text-base text-muted-foreground">
                    Enhanced image will appear here
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                    Upload an image and click enhance
                  </p>
                </div>
              )}
            </Card>

            {/* Features Card */}
            <Card className="p-4 sm:p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">✨ Premium Features</h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {[
                  { emoji: "🎯", title: "AI-Powered", desc: "Deep learning" },
                  { emoji: "📈", title: "4x Upscaling", desc: "No quality loss" },
                  { emoji: "✨", title: "Detail Enhance", desc: "Sharpen & restore" },
                  { emoji: "🎬", title: "YouTube Ready", desc: "Perfect thumbnails" },
                ].map(({ emoji, title, desc }) => (
                  <div key={title} className="flex items-start gap-2 sm:gap-3">
                    <span className="text-lg sm:text-xl">{emoji}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">{title}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEnhancement;
