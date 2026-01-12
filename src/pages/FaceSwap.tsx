import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, Loader2, ImageIcon, Users, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const FaceSwap = () => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const compressDataUrl = (dataUrl: string, maxDim = 1500, quality = 0.85) =>
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
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
        setResultImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSwap = async () => {
    if (!sourceImage || !targetImage) {
      toast({
        title: "Missing images",
        description: "Please upload both source and target images",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Compress images before sending
      const [compressedSource, compressedTarget] = await Promise.all([
        compressDataUrl(sourceImage),
        compressDataUrl(targetImage)
      ]);

      const { data, error } = await supabase.functions.invoke('face-swap', {
        body: { 
          sourceImage: compressedSource, 
          targetImage: compressedTarget 
        }
      });

      if (error) throw error;

      if (data?.limitReached) {
        toast({
          title: "Daily limit reached",
          description: data.error,
          variant: "destructive"
        });
        return;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.image) {
        throw new Error('No result image returned');
      }

      setResultImage(data.image);

      // Increment usage
      await supabase.functions.invoke('increment-usage', {
        body: { usageType: 'ai_face_swap' }
      });

      toast({
        title: "Success!",
        description: "Face swap completed successfully"
      });
    } catch (error: any) {
      console.error('Face swap error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to swap faces. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    
    const link = document.createElement("a");
    link.href = resultImage;
    link.download = "face-swap-result.jpg";
    link.click();
  };

  const handleClear = () => {
    setSourceImage(null);
    setTargetImage(null);
    setResultImage(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">AI Face Swap</h1>
        <p className="text-muted-foreground">
          Swap faces between two photos instantly with AI technology
        </p>
      </div>

      {/* Instructions */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">1</div>
            <span className="text-sm font-medium">Upload SOURCE (face to use)</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">2</div>
            <span className="text-sm font-medium">Upload TARGET (where to put face)</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">3</div>
            <span className="text-sm font-medium">Click Swap!</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Source Image */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Source Face
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            The face you want to use
          </p>
          
          <div 
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors min-h-[250px] flex items-center justify-center"
            onClick={() => sourceInputRef.current?.click()}
          >
            {sourceImage ? (
              <img src={sourceImage} alt="Source" className="max-w-full max-h-60 mx-auto rounded-lg" />
            ) : (
              <div className="space-y-4">
                <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Click to upload</p>
                  <p className="text-xs text-muted-foreground">Source image with face</p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={sourceInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, setSourceImage)}
            className="hidden"
          />
        </Card>

        {/* Target Image */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Target Image
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Where to put the face
          </p>
          
          <div 
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors min-h-[250px] flex items-center justify-center"
            onClick={() => targetInputRef.current?.click()}
          >
            {targetImage ? (
              <img src={targetImage} alt="Target" className="max-w-full max-h-60 mx-auto rounded-lg" />
            ) : (
              <div className="space-y-4">
                <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Click to upload</p>
                  <p className="text-xs text-muted-foreground">Target image for face</p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={targetInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, setTargetImage)}
            className="hidden"
          />
        </Card>

        {/* Result */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Download className="w-5 h-5" />
            Result
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Your swapped image
          </p>

          <div className="border-2 rounded-lg p-8 text-center bg-[repeating-linear-gradient(45deg,hsl(var(--muted))_0,hsl(var(--muted))_10px,transparent_10px,transparent_20px)] min-h-[250px] flex items-center justify-center">
            {resultImage ? (
              <img 
                src={resultImage} 
                alt="Result" 
                className="max-w-full max-h-60 mx-auto rounded-lg shadow-lg" 
              />
            ) : (
              <div className="space-y-4">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {isProcessing ? "Swapping faces..." : "Result will appear here"}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button 
          size="lg"
          onClick={handleSwap}
          disabled={!sourceImage || !targetImage || isProcessing}
          className="min-w-[200px]"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Swapping Faces...
            </>
          ) : (
            <>
              <Users className="w-4 h-4 mr-2" />
              Swap Faces
            </>
          )}
        </Button>
        
        <Button 
          size="lg"
          variant="outline"
          onClick={handleDownload}
          disabled={!resultImage}
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
        
        <Button 
          size="lg"
          variant="ghost"
          onClick={handleClear}
          disabled={!sourceImage && !targetImage && !resultImage}
        >
          Clear All
        </Button>
      </div>

      {/* Features */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-3">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="text-2xl">🎭</div>
            <h4 className="font-semibold">AI-Powered</h4>
            <p className="text-sm text-muted-foreground">
              Advanced AI for realistic face swapping
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-2xl">⚡</div>
            <h4 className="font-semibold">Instant Results</h4>
            <p className="text-sm text-muted-foreground">
              Get your swapped image in seconds
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-2xl">🎨</div>
            <h4 className="font-semibold">Creative Freedom</h4>
            <p className="text-sm text-muted-foreground">
              Perfect for memes, fun, and creative projects
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FaceSwap;
