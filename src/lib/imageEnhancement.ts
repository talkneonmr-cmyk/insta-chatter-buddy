import { pipeline, RawImage } from "@huggingface/transformers";

let upscaler: any = null;

async function loadModel() {
  if (!upscaler) {
    upscaler = await pipeline(
      "image-to-image",
      "Xenova/swin2SR-classical-sr-x2-64",
      { device: "webgpu" }
    );
  }
  return upscaler;
}

export async function enhanceImage(imageUrl: string, scale: number = 2): Promise<string> {
  const model = await loadModel();
  
  // Load image
  const image = await RawImage.fromURL(imageUrl);
  
  // Apply enhancement multiple times for higher scales
  let currentImage = image;
  const iterations = scale / 2; // Model does 2x, so for 4x we need 2 iterations
  
  for (let i = 0; i < iterations; i++) {
    const result = await model(currentImage);
    currentImage = result;
  }
  
  // Convert to canvas and return as data URL
  const canvas = document.createElement("canvas");
  canvas.width = currentImage.width;
  canvas.height = currentImage.height;
  const ctx = canvas.getContext("2d")!;
  
  ctx.drawImage(currentImage.toCanvas(), 0, 0);
  
  return canvas.toDataURL("image/png");
}
