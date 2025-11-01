import { useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, Loader2, ImageIcon, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { enhanceImage } from "@/lib/imageEnhancement";
import { Slider } from "@/components/ui/slider";

const ImageEnhancement = () => {
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

    setIsProcessing(true);
    try {
      const result = await enhanceImage(image, scale[0]);
      setEnhancedImage(result);
      toast({
        title: "Success!",
        description: `Image enhanced ${scale[0]}x successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enhance image. Please try again.",
        variant: "destructive",
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

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Image Enhancement</h1>
          <p className="text-muted-foreground">
            Professional image upscaling & enhancement - Normally $30/month!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Image
            </h2>
            
            <div 
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {image ? (
                <img src={image} alt="Original" className="max-w-full max-h-96 mx-auto rounded-lg" />
              ) : (
                <div className="space-y-4">
                  <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground" />
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

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Upscale Factor: {scale[0]}x
                </label>
                <Slider
                  value={scale}
                  onValueChange={setScale}
                  min={2}
                  max={4}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Higher values = better quality but slower processing
                </p>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleEnhance}
                disabled={!image || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Enhance Image
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Result Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Enhanced Result
            </h2>

            <div className="border-2 rounded-lg p-12 text-center bg-muted/30">
              {enhancedImage ? (
                <div className="space-y-2">
                  <img 
                    src={enhancedImage} 
                    alt="Enhanced" 
                    className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg" 
                  />
                  <p className="text-xs text-muted-foreground">
                    Enhanced {scale[0]}x - Professional Quality
                  </p>
                </div>
              ) : (
                <div className="space-y-4 py-16">
                  <Sparkles className="w-16 h-16 mx-auto text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    {isProcessing ? "Enhancing your image..." : "Enhanced image will appear here"}
                  </p>
                </div>
              )}
            </div>

            <Button 
              className="w-full mt-4" 
              size="lg"
              onClick={handleDownload}
              disabled={!enhancedImage}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Enhanced Image
            </Button>
          </Card>
        </div>

        {/* Features */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3">Why This is Worth $30/month:</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-2xl">🎯</div>
              <h4 className="font-semibold">AI-Powered</h4>
              <p className="text-sm text-muted-foreground">
                Deep learning models for superior results
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">📈</div>
              <h4 className="font-semibold">Up to 4x Upscaling</h4>
              <p className="text-sm text-muted-foreground">
                Increase resolution without quality loss
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">✨</div>
              <h4 className="font-semibold">Detail Enhancement</h4>
              <p className="text-sm text-muted-foreground">
                Sharpen and restore fine details
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">🎬</div>
              <h4 className="font-semibold">YouTube Ready</h4>
              <p className="text-sm text-muted-foreground">
                Perfect for thumbnails and banners
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default ImageEnhancement;
