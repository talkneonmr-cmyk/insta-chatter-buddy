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

    // Check usage limit first
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

      if (error) {
        throw error;
      }

      if (!data?.enhancedImage) {
        throw new Error('No enhanced image returned');
      }

      setEnhancedImage(data.enhancedImage);
      
      // Increment usage tracking
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
      case 2: return "2x - Good Quality";
      case 3: return "3x - Better Quality";
      case 4: return "4x - Best Quality";
      default: return `${value}x`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-sm font-medium text-primary">AI-Powered Enhancement</span>
        </div>
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          AI Image Enhancement
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Professional upscaling & enhancement in seconds. Perfect for thumbnails, profile pictures, and more.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <Card className="p-6 border-2 border-dashed border-border hover:border-primary/50 transition-colors">
            <div 
              className="rounded-lg cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {image ? (
                <div className="relative group">
                  <img src={image} alt="Original" className="w-full max-h-80 object-contain rounded-lg" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <p className="text-white font-medium flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Click to change image
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">Click to upload image</p>
                    <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB</p>
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
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Enhancement Settings
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Upscale Factor</label>
                  <span className="text-sm text-primary font-semibold px-3 py-1 bg-primary/10 rounded-full">
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
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>2x</span>
                  <span>3x</span>
                  <span>4x</span>
                </div>
              </div>

              <Button 
                className="w-full h-12 text-base font-semibold" 
                size="lg"
                onClick={handleEnhance}
                disabled={!image || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Enhance Image
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Processing time: 10-15 seconds
              </p>
            </div>
          </Card>

          {/* Quick Features */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Sparkles, label: "AI Upscaling" },
              { icon: Zap, label: "Fast Results" },
              { icon: ImageIcon, label: "High Quality" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 text-center"
              >
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Result Section */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                Result Preview
              </h3>
              {enhancedImage && (
                <Button
                  size="sm"
                  onClick={handleDownload}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              )}
            </div>

            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full bg-primary/20 animate-pulse" />
                  <Loader2 className="w-12 h-12 text-primary animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="font-medium text-lg">Enhancing your image...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  This usually takes 10-15 seconds
                </p>
              </div>
            ) : enhancedImage && image ? (
              <div className="space-y-4">
                <BeforeAfterSlider
                  beforeImage={image}
                  afterImage={enhancedImage}
                  beforeLabel="Original"
                  afterLabel={`Enhanced ${scale[0]}x`}
                />
                <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <span>←</span>
                  Drag slider to compare
                  <span>→</span>
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Sparkles className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <p className="font-medium text-muted-foreground">
                  Enhanced image will appear here
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Upload an image and click enhance
                </p>
              </div>
            )}
          </Card>

          {/* Features Card */}
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <h3 className="text-lg font-semibold mb-4">✨ Premium Features</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { emoji: "🎯", title: "AI-Powered", desc: "Deep learning models" },
                { emoji: "📈", title: "4x Upscaling", desc: "No quality loss" },
                { emoji: "✨", title: "Detail Enhance", desc: "Sharpen & restore" },
                { emoji: "🎬", title: "YouTube Ready", desc: "Perfect thumbnails" },
              ].map(({ emoji, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <span className="text-xl">{emoji}</span>
                  <div>
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ImageEnhancement;
