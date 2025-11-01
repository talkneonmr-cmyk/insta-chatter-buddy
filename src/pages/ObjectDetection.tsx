import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, Eye, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { pipeline } from "@huggingface/transformers";

interface DetectedObject {
  label: string;
  score: number;
  box: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
}

const ObjectDetection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [detections, setDetections] = useState<DetectedObject[]>([]);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setDetections([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const drawDetections = (image: HTMLImageElement, detections: DetectedObject[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = image.width;
    canvas.height = image.height;

    ctx.drawImage(image, 0, 0);

    // Draw bounding boxes
    detections.forEach((detection) => {
      const { box, label, score } = detection;
      
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.strokeRect(box.xmin, box.ymin, box.xmax - box.xmin, box.ymax - box.ymin);

      // Draw label background
      ctx.fillStyle = '#10b981';
      const text = `${label} ${(score * 100).toFixed(0)}%`;
      const textMetrics = ctx.measureText(text);
      ctx.fillRect(box.xmin, box.ymin - 25, textMetrics.width + 10, 25);

      // Draw label text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(text, box.xmin + 5, box.ymin - 7);
    });
  };

  const handleDetect = async () => {
    if (!uploadedImage) {
      toast({
        title: "No image uploaded",
        description: "Please upload an image first",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      toast({
        title: "Loading AI model...",
        description: "First time may take a moment"
      });

      const detector = await pipeline(
        "object-detection",
        "Xenova/detr-resnet-50",
        { device: "webgpu" }
      );

      toast({
        title: "Detecting objects...",
        description: "AI is analyzing your image"
      });

      const img = new Image();
      img.src = uploadedImage;
      await new Promise((resolve) => { img.onload = resolve; });

      const output = await detector(uploadedImage);
      const detectedObjects = output as DetectedObject[];
      
      setDetections(detectedObjects);
      drawDetections(img, detectedObjects);
      
      toast({
        title: "Detection complete!",
        description: `Found ${detectedObjects.length} objects`
      });
    } catch (error: any) {
      console.error('Detection error:', error);
      toast({
        title: "Detection failed",
        description: error.message || "Make sure WebGPU is supported",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
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
            <div className="p-2 bg-cyan-500/10 rounded-lg float-animation">
              <Eye className="h-6 w-6 text-cyan-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Object Detection</h1>
              <p className="text-muted-foreground">Detect objects in images with AI - 100% Free!</p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-indigo-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-cyan-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h3 className="font-semibold text-cyan-500">DETR - Powerful Object Detection</h3>
                <p className="text-sm text-muted-foreground">
                  Identify and locate multiple objects in images with bounding boxes. Great for analyzing 
                  thumbnail content, understanding visual composition, or automated content insights.
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
                <Upload className="h-5 w-5 text-cyan-500" />
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
                className="w-full h-32 border-2 border-dashed hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center">
                  <Eye className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload an image
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, WEBP
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
                    onClick={handleDetect}
                    disabled={processing}
                    className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:opacity-90"
                    size="lg"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Detect Objects
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    <span>Processing in browser with DETR model</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          {detections.length > 0 ? (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-cyan-500" />
                  Detection Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border">
                  <canvas ref={canvasRef} className="w-full h-full object-contain" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Detected Objects:</h4>
                  <div className="flex flex-wrap gap-2">
                    {detections.map((detection, index) => (
                      <Badge key={index} variant="secondary" className="bg-cyan-500/10 text-cyan-500">
                        {detection.label} ({(detection.score * 100).toFixed(0)}%)
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-fit">
              <CardContent className="p-12">
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-2xl blur-xl opacity-20 animate-pulse"></div>
                    <div className="relative p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-indigo-500/10 backdrop-blur-xl">
                      <Eye className="w-10 h-10 text-cyan-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Ready to Detect</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload an image to detect and locate objects
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Use Cases */}
        <Card>
          <CardHeader>
            <CardTitle>Perfect For</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Content Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  Understand what's in your thumbnails and videos
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Visual Insights</h4>
                <p className="text-sm text-muted-foreground">
                  Get detailed breakdowns of image composition
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Automated Tagging</h4>
                <p className="text-sm text-muted-foreground">
                  Generate tags based on detected objects
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ObjectDetection;
