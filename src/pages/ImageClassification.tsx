import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, Tag, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { pipeline } from "@huggingface/transformers";

const ImageClassification = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [tags, setTags] = useState<Array<{ label: string; score: number }>>([]);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setTags([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClassify = async () => {
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

      const classifier = await pipeline(
        "image-classification",
        "onnx-community/mobilenetv4_conv_small.e2400_r224_in1k",
        { device: "webgpu" }
      );

      toast({
        title: "Analyzing image...",
        description: "AI is detecting content"
      });

      const output = await classifier(uploadedImage);
      setTags(output as Array<{ label: string; score: number }>);
      
      toast({
        title: "Classification complete!",
        description: `Found ${output.length} tags`
      });
    } catch (error: any) {
      console.error('Classification error:', error);
      toast({
        title: "Classification failed",
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
            <div className="p-2 bg-orange-500/10 rounded-lg float-animation">
              <Tag className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Image Classification</h1>
              <p className="text-muted-foreground">Auto-tag images with AI - 100% Free!</p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="border-orange-500/20 bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-yellow-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h3 className="font-semibold text-orange-500">MobileNetV4 - Fast & Accurate</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically detect and tag content in your images. Perfect for organizing thumbnails, 
                  categorizing content, or adding relevant tags to your media library.
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
                <Upload className="h-5 w-5 text-orange-500" />
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
                className="w-full h-32 border-2 border-dashed hover:border-orange-500/50 hover:bg-orange-500/5 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center">
                  <Tag className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
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
                    onClick={handleClassify}
                    disabled={processing}
                    className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:opacity-90"
                    size="lg"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Tag className="mr-2 h-4 w-4" />
                        Classify Image
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    <span>Processing in browser - instant results</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          {tags.length > 0 ? (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-orange-500" />
                  Detected Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tags.map((tag, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                          #{index + 1}
                        </Badge>
                        <span className="font-medium">{tag.label}</span>
                      </div>
                      <Badge variant="secondary">
                        {(tag.score * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-fit">
              <CardContent className="p-12">
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-2xl blur-xl opacity-20 animate-pulse"></div>
                    <div className="relative p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-yellow-500/10 backdrop-blur-xl">
                      <Tag className="w-10 h-10 text-orange-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Ready to Classify</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload an image to detect content and get tags
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
                <h4 className="font-semibold">Thumbnail Organization</h4>
                <p className="text-sm text-muted-foreground">
                  Automatically categorize your thumbnails by content type
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Content Discovery</h4>
                <p className="text-sm text-muted-foreground">
                  Help viewers find your content with accurate tags
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">SEO Optimization</h4>
                <p className="text-sm text-muted-foreground">
                  Generate relevant keywords for better search visibility
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImageClassification;
