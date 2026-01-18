import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eraser, Upload, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { removeBackground, loadImage } from "@/lib/backgroundRemoval";

export const BackgroundRemover = () => {
  const [processing, setProcessing] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show original
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setProcessedImage(null);
    };
    reader.readAsDataURL(file);

    setProcessing(true);
    toast.info("Removing background... This may take a moment");

    try {
      const imageElement = await loadImage(file);
      const resultBlob = await removeBackground(imageElement);
      
      const resultUrl = URL.createObjectURL(resultBlob);
      setProcessedImage(resultUrl);
      toast.success("Background removed successfully!");
    } catch (error) {
      console.error("Background removal error:", error);
      toast.error("Failed to remove background. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    
    const link = document.createElement("a");
    link.download = `no-background-${Date.now()}.png`;
    link.href = processedImage;
    link.click();
    toast.success("Downloaded!");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eraser className="h-5 w-5" />
          Background Removal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="bg-remove-upload"
            disabled={processing}
          />
          <label
            htmlFor="bg-remove-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <Upload className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click to upload image for background removal
            </p>
          </label>
        </div>

        {processing && (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              Processing... This may take a few seconds
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {originalImage && (
            <div>
              <p className="text-sm font-medium mb-2">Original</p>
              <img
                src={originalImage}
                alt="Original"
                className="w-full rounded-lg border border-border"
              />
            </div>
          )}
          {processedImage && (
            <div>
              <p className="text-sm font-medium mb-2">No Background</p>
              <div className="relative">
                <div className="absolute inset-0 bg-checkerboard rounded-lg" />
                <img
                  src={processedImage}
                  alt="Processed"
                  className="relative w-full rounded-lg"
                />
              </div>
              <Button onClick={downloadImage} className="w-full mt-2" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
