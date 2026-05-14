import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, Loader2, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const BackgroundRemoval = () => {
  const [image, setImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
        setProcessedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBackground = async () => {
    if (!image) return;

    // Check usage limit first
    const { data: limitCheck, error: limitError } = await supabase.functions.invoke('check-usage-limit', {
      body: { limitType: 'ai_background_removal' }
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

    // Downscale and compress before sending to reduce payload size and avoid timeouts
    const compressDataUrl = (dataUrl: string, maxDim = 2000, quality = 0.9) =>
      new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          let w = img.naturalWidth;
          let h = img.naturalHeight;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas not supported'));
          ctx.drawImage(img, 0, 0, w, h);
          const out = canvas.toDataURL('image/jpeg', quality);
          resolve(out);
        };
        img.onerror = () => reject(new Error('Failed to load image for compression'));
        img.src = dataUrl;
      });

    setIsProcessing(true);
    try {
      const payloadImage = await compressDataUrl(image);

      // Call backend function with JSON payload (base64 data URL)
      const { data, error } = await supabase.functions.invoke('remove-background', {
        body: { imageDataUrl: payloadImage },
      });

      if (error) throw error as any;

      const imgDataUrl = (data as any)?.image as string | undefined;
      if (!imgDataUrl) throw new Error('No image returned from background removal');

      setProcessedImage(imgDataUrl);
      
      // Increment usage tracking
      await supabase.functions.invoke('increment-usage', {
        body: { usageType: 'ai_background_removal' }
      });

      toast({ title: 'Success!', description: 'Background removed successfully' });
    } catch (error: any) {
      console.error('Background removal error:', error);
      const message =
        error?.message?.includes('Failed to send request')
          ? 'Upload too large or network blocked. Try a smaller image (under ~10MB).'
          : error?.message || 'Failed to remove background. Please try again.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    
    const link = document.createElement("a");
    link.href = processedImage;
    link.download = "background-removed.png";
    link.click();
  };

  return (
    
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Background Removal</h1>
          <p className="text-muted-foreground">
            Professional background removal powered by AI - Perfect for YouTube thumbnails!
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

            <Button 
              className="w-full mt-4" 
              size="lg"
              onClick={handleRemoveBackground}
              disabled={!image || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Remove Background"
              )}
            </Button>
          </Card>

          {/* Result Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Result
            </h2>

            <div className="border-2 rounded-lg p-12 text-center bg-[repeating-linear-gradient(45deg,hsl(var(--muted))_0,hsl(var(--muted))_10px,transparent_10px,transparent_20px)]">
              {processedImage ? (
                <img 
                  src={processedImage} 
                  alt="Processed" 
                  className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg" 
                />
              ) : (
                <div className="space-y-4 py-16">
                  <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    {isProcessing ? "Processing your image..." : "Processed image will appear here"}
                  </p>
                </div>
              )}
            </div>

            <Button 
              className="w-full mt-4" 
              size="lg"
              onClick={handleDownload}
              disabled={!processedImage}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </Card>
        </div>

        {/* Features */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3">Why This is Premium:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-2xl">💎</div>
              <h4 className="font-semibold">Professional Quality</h4>
              <p className="text-sm text-muted-foreground">
                Same technology used by $50/month tools
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">⚡</div>
              <h4 className="font-semibold">Instant Processing</h4>
              <p className="text-sm text-muted-foreground">
                Remove backgrounds in seconds, not minutes
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">🎨</div>
              <h4 className="font-semibold">Perfect for Thumbnails</h4>
              <p className="text-sm text-muted-foreground">
                Create stunning YouTube thumbnails easily
              </p>
            </div>
          </div>
        </Card>
      </div>
    
  );
};

export default BackgroundRemoval;
