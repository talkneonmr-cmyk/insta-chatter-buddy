import { pipeline, RawImage, env } from "@huggingface/transformers";

export type ProgressCallback = (stage: string, progress: number) => void;

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

export async function enhanceImage(
  imageUrl: string, 
  scale: number = 2, 
  onProgress?: ProgressCallback
): Promise<string> {
  const TIMEOUT_MS = 60000; // 60 second timeout

  const enhanceWithTimeout = async () => {
    try {
      // Stage 1: Loading model (0-30%)
      onProgress?.("Loading AI model...", 0);
      const model = await loadModel();
      onProgress?.("Loading AI model...", 30);

      // Stage 2: Preparing image (30-40%)
      onProgress?.("Preparing image...", 30);
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
      onProgress?.("Preparing image...", 40);

      // Stage 3: Enhancement iterations (40-90%)
      const iterations = Math.max(1, Math.round(scale / 2));
      const progressPerIteration = 50 / iterations; // 50% of progress for enhancement

      for (let i = 0; i < iterations; i++) {
        const iterationProgress = 40 + (i * progressPerIteration);
        onProgress?.(`Enhancing (pass ${i + 1}/${iterations})...`, iterationProgress);
        currentImage = await model(currentImage);
      }
      onProgress?.("Enhancement complete...", 90);

      // Stage 4: Finalizing (90-100%)
      onProgress?.("Finalizing...", 90);
      const canvas = document.createElement("canvas");
      canvas.width = currentImage.width;
      canvas.height = currentImage.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(currentImage.toCanvas(), 0, 0);
      
      onProgress?.("Finalizing...", 100);
      return canvas.toDataURL("image/png");

    } catch (error) {
      console.error("Image enhancement error:", error);
      
      // Provide specific error messages
      if (error instanceof Error) {
        if (error.message.includes("fetch") || error.message.includes("network")) {
          throw new Error("Failed to download AI model. Please check your internet connection.");
        } else if (error.message.includes("WebGPU") || error.message.includes("GPU")) {
          throw new Error("GPU processing failed. Your browser may not support WebGPU.");
        } else if (error.message.includes("memory") || error.message.includes("OOM")) {
          throw new Error("Not enough memory to process this image. Try a smaller image or lower scale.");
        }
      }
      
      throw new Error("Failed to enhance image. Please try again with a different image or lower scale.");
    }
  };

  // Add timeout protection
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Enhancement timed out after 60 seconds. Try a smaller image or lower scale.")), TIMEOUT_MS);
  });

  return Promise.race([enhanceWithTimeout(), timeoutPromise]);
}
