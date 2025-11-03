import { pipeline, env, RawImage } from '@huggingface/transformers';

// Configure transformers.js to always download models
env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_IMAGE_DIMENSION = 1024;

// Labels that should be considered as foreground (person/subject)
const FOREGROUND_LABELS = ['person', 'human', 'face', 'head', 'torso', 'body'];

function resizeImageIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return true;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
  return false;
}

export const removeBackground = async (imageElement: HTMLImageElement): Promise<Blob> => {
  try {
    console.log('Starting background removal process...');
    
    // Use WebGPU if available for better performance (check as any to avoid TS errors)
    const device = (navigator as any).gpu ? 'webgpu' : 'wasm';
    console.log(`Using device: ${device}`);
    
    const segmenter = await pipeline(
      'image-segmentation', 
      'Xenova/segformer-b0-finetuned-ade-512-512',
      { device }
    );
    
    // Convert HTMLImageElement to canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Resize image if needed and draw it to canvas
    const wasResized = resizeImageIfNeeded(canvas, ctx, imageElement);
    console.log(`Image ${wasResized ? 'was' : 'was not'} resized. Final dimensions: ${canvas.width}x${canvas.height}`);
    
    // Convert to RawImage for better processing
    const imageData = canvas.toDataURL('image/png');
    console.log('Image converted to data URL');
    
    // Process the image with the segmentation model
    console.log('Processing with segmentation model...');
    const result: any = await segmenter(imageData);
    console.log('Segmentation result:', result);

    // Normalize to array of segments
    const segments: any[] = Array.isArray(result)
      ? result
      : result && typeof result === 'object'
        ? [result]
        : [];

    // Build combined mask from available masks (exclude obvious background labels when present)
    const combinedMask = new Float32Array(canvas.width * canvas.height).fill(0);
    let anyMaskAdded = false;

    for (const seg of segments) {
      const lbl = typeof seg?.label === 'string' ? seg.label.toLowerCase() : '';
      const isForeground = lbl
        ? FOREGROUND_LABELS.some((fg) => lbl.includes(fg)) || lbl !== 'background'
        : true; // if label missing, assume foreground candidate

      const maskData: Float32Array | number[] | undefined = seg?.mask?.data as any;
      if (!maskData) continue;

      // Some models return mask at model resolution; assume lengths match, otherwise blend up to available length
      const len = Math.min(maskData.length, combinedMask.length);
      if (isForeground) {
        for (let i = 0; i < len; i++) {
          const v = typeof maskData[i] === 'number' ? (maskData[i] as number) : 0;
          combinedMask[i] = Math.max(combinedMask[i], v);
        }
        anyMaskAdded = true;
      }
    }

    // Fallbacks: pick the strongest/first mask if none added
    if (!anyMaskAdded && segments.length > 0) {
      const candidate = segments.find((s) => s?.mask?.data) || segments[0];
      const maskData: Float32Array | number[] | undefined = candidate?.mask?.data as any;
      if (maskData) {
        const len = Math.min(maskData.length, combinedMask.length);
        for (let i = 0; i < len; i++) combinedMask[i] = Number(maskData[i] || 0);
        anyMaskAdded = true;
      }
    }

    if (!anyMaskAdded) {
      console.warn('No usable mask returned from segmentation. Returning original image alpha intact.');
      // Return original image as PNG (no background removed) to avoid hard failure
      return await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))), 'image/png', 1.0),
      );
    }

    // Create a new canvas for the masked image
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const outputCtx = outputCanvas.getContext('2d');
    if (!outputCtx) throw new Error('Could not get output canvas context');

    // Draw original image then update alpha using smoothed mask
    outputCtx.drawImage(canvas, 0, 0);
    const outputImageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
    const data = outputImageData.data;

    // Apply smoothing for cleaner edges
    const smoothedMask = smoothMask(combinedMask, canvas.width, canvas.height);

    // Apply to alpha channel (mask value represents foreground opacity)
    for (let i = 0; i < smoothedMask.length; i++) {
      const alpha = Math.round(smoothedMask[i] * 255);
      data[i * 4 + 3] = alpha;
    }

    outputCtx.putImageData(outputImageData, 0, 0);
    console.log('Mask applied successfully');

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      outputCanvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('Successfully created final blob');
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/png',
        1.0,
      );
    });
  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
};

// Smooth mask edges for cleaner cutout
function smoothMask(mask: Float32Array, width: number, height: number, radius: number = 2): Float32Array {
  const smoothed = new Float32Array(mask.length);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      let sum = 0;
      let count = 0;
      
      // Average with neighbors
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            sum += mask[ny * width + nx];
            count++;
          }
        }
      }
      
      smoothed[idx] = sum / count;
    }
  }
  
  return smoothed;
}

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};
