import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, FabricImage, Textbox, Rect, Gradient, Shadow } from "fabric";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Type, Image as ImageIcon, Layers } from "lucide-react";
import { toast } from "sonner";

interface ThumbnailCanvasProps {
  onExport?: (dataUrl: string) => void;
}

export const ThumbnailCanvas = ({ onExport }: ThumbnailCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 1280,
      height: 720,
      backgroundColor: "#1a1a2e",
    });

    // Add selection event listeners
    canvas.on("selection:created", (e) => setSelectedObject(e.selected?.[0]));
    canvas.on("selection:updated", (e) => setSelectedObject(e.selected?.[0]));
    canvas.on("selection:cleared", () => setSelectedObject(null));

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  const addText = () => {
    if (!fabricCanvas) return;

    const text = new Textbox("CLICK TO EDIT", {
      left: 100,
      top: 100,
      fontSize: 80,
      fontWeight: "bold",
      fill: "#ffffff",
      fontFamily: "Arial Black, sans-serif",
      stroke: "#000000",
      strokeWidth: 3,
      shadow: new Shadow({
        color: "rgba(0,0,0,0.8)",
        blur: 10,
        offsetX: 5,
        offsetY: 5,
      }),
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    toast.success("Text added! Double-click to edit");
  };

  const addImage = async (file: File) => {
    if (!fabricCanvas) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imgElement = document.createElement("img");
      imgElement.src = e.target?.result as string;
      
      imgElement.onload = () => {
        const fabricImage = new FabricImage(imgElement, {
          left: 100,
          top: 100,
          scaleX: 0.5,
          scaleY: 0.5,
        });

        fabricCanvas.add(fabricImage);
        fabricCanvas.renderAll();
        toast.success("Image added to canvas");
      };
    };
    reader.readAsDataURL(file);
  };

  const addTemplate = (type: "gradient" | "solid" | "split") => {
    if (!fabricCanvas) return;

    fabricCanvas.clear();

    if (type === "gradient") {
      const gradient = new Gradient({
        type: "linear",
        coords: { x1: 0, y1: 0, x2: fabricCanvas.width!, y2: fabricCanvas.height! },
        colorStops: [
          { offset: 0, color: "#667eea" },
          { offset: 1, color: "#764ba2" },
        ],
      });
      fabricCanvas.backgroundColor = gradient;
    } else if (type === "solid") {
      fabricCanvas.backgroundColor = "#ff6b6b";
    } else if (type === "split") {
      const leftRect = new Rect({
        left: 0,
        top: 0,
        width: fabricCanvas.width! / 2,
        height: fabricCanvas.height!,
        fill: "#2ecc71",
        selectable: false,
      });
      const rightRect = new Rect({
        left: fabricCanvas.width! / 2,
        top: 0,
        width: fabricCanvas.width! / 2,
        height: fabricCanvas.height!,
        fill: "#3498db",
        selectable: false,
      });
      fabricCanvas.add(leftRect, rightRect);
    }

    fabricCanvas.renderAll();
    toast.success("Template applied");
  };

  const deleteSelected = () => {
    if (!fabricCanvas || !selectedObject) return;
    fabricCanvas.remove(selectedObject);
    fabricCanvas.renderAll();
    toast.success("Object deleted");
  };

  const exportThumbnail = () => {
    if (!fabricCanvas) return;

    const dataUrl = fabricCanvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 1,
    });

    // Download
    const link = document.createElement("a");
    link.download = `thumbnail-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();

    if (onExport) {
      onExport(dataUrl);
    }

    toast.success("Thumbnail exported!");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={addText} size="sm">
          <Type className="h-4 w-4 mr-2" />
          Add Text
        </Button>
        <Button onClick={() => document.getElementById("image-upload")?.click()} size="sm">
          <ImageIcon className="h-4 w-4 mr-2" />
          Add Image
        </Button>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) addImage(file);
          }}
        />
        <Button onClick={() => addTemplate("gradient")} size="sm" variant="outline">
          Gradient BG
        </Button>
        <Button onClick={() => addTemplate("solid")} size="sm" variant="outline">
          Solid BG
        </Button>
        <Button onClick={() => addTemplate("split")} size="sm" variant="outline">
          Split BG
        </Button>
        <Button onClick={deleteSelected} size="sm" variant="destructive" disabled={!selectedObject}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
        <Button onClick={exportThumbnail} size="sm" variant="default" className="ml-auto">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden shadow-lg bg-muted/20 flex items-center justify-center p-4">
        <canvas ref={canvasRef} className="max-w-full h-auto" />
      </div>

      {selectedObject && (
        <div className="p-4 border border-border rounded-lg bg-card space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Object Properties
          </h3>
          {selectedObject.type === "textbox" && (
            <div className="space-y-2">
              <label className="text-sm">Text Color</label>
              <input
                type="color"
                value={selectedObject.fill}
                onChange={(e) => {
                  selectedObject.set("fill", e.target.value);
                  fabricCanvas?.renderAll();
                }}
                className="w-full h-10 rounded"
              />
              <label className="text-sm mt-2 block">Font Size</label>
              <input
                type="range"
                min="20"
                max="200"
                value={selectedObject.fontSize}
                onChange={(e) => {
                  selectedObject.set("fontSize", parseInt(e.target.value));
                  fabricCanvas?.renderAll();
                }}
                className="w-full"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};