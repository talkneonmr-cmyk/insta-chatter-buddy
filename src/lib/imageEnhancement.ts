import { pipeline, RawImage, env } from "@huggingface/transformers";

let upscaler: any = null;

function configureEnv() {
  try {
    // Ensure models are fetched remotely and cached in the browser
    env.allowLocalModels = false;
    env.useBrowserCache = true;
  } catch {
    // no-op for older versions
  }
}

async function loadModel() {
  if (!upscaler) {
    configureEnv();
    try {
      upscaler = await pipeline(
        "image-to-image",
        "Xenova/swin2SR-classical-sr-x2-64",
        { device: "webgpu", dtype: "fp32" }
      );
    } catch (error) {
      console.warn("WebGPU not available, falling back to WASM:", error);
      upscaler = await pipeline(
        "image-to-image",
        "Xenova/swin2SR-classical-sr-x2-64",
        { dtype: "fp32" }
      );
    }
  }
  return upscaler;
}

export async function enhanceImage(imageUrl: string, scale: number = 2): Promise<string> {
  const model = await loadModel();

  // Load image
  const image = await RawImage.fromURL(imageUrl);

  // Downscale very large images to prevent long/blocked processing
  const MAX_DIM = 1024;
  let currentImage: any = image;
  if (image.width > MAX_DIM || image.height > MAX_DIM) {
    const factor = Math.min(MAX_DIM / image.width, MAX_DIM / image.height);
    const width = Math.round(image.width * factor);
    const height = Math.round(image.height * factor);
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = width;
    tmpCanvas.height = height;
    const tmpCtx = tmpCanvas.getContext("2d")!;
    tmpCtx.drawImage(image.toCanvas(), 0, 0, width, height);
    currentImage = await RawImage.fromCanvas(tmpCanvas);
  }

  // Model performs 2x per pass
  const iterations = Math.max(1, Math.round(scale / 2));

  for (let i = 0; i < iterations; i++) {
    currentImage = await model(currentImage);
  }

  // Convert to canvas and return as data URL
  const canvas = document.createElement("canvas");
  canvas.width = currentImage.width;
  canvas.height = currentImage.height;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(currentImage.toCanvas(), 0, 0);

  return canvas.toDataURL("image/png");
}
