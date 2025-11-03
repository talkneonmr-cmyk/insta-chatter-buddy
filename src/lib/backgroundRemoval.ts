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

    // Prefer WebGPU if available, otherwise fall back to WASM
    const device = (navigator as any).gpu ? 'webgpu' : 'wasm';
    console.log(`Using device: ${device}`);

    const segmenter = await pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512', {
      device,
    });

    // Draw input onto a canvas (also handles resizing to a sane max dimension)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    const wasResized = resizeImageIfNeeded(canvas, ctx, imageElement);
    console.log(`Image ${wasResized ? 'was' : 'was not'} resized. Final dimensions: ${canvas.width}x${canvas.height}`);

    // Get a data URL for the model input
    const imageDataURL = canvas.toDataURL('image/png');

    console.log('Running segmentation...');
    const rawResult: any = await segmenter(imageDataURL);

    // Normalize result to an array of segments
    const segments: any[] = Array.isArray(rawResult)
      ? rawResult
      : rawResult && typeof rawResult === 'object'
        ? [rawResult]
        : [];

    // Prepare a combined mask (foreground opacity in [0,1]) at canvas resolution
    const combined = new Float32Array(canvas.width * canvas.height).fill(0);
    let anyMask = false;

    for (const seg of segments) {
      // Try to extract a Float32 mask from RawImage-like structures
      const maskInfo = toFloatMask(seg?.mask);
      if (!maskInfo) continue;

      // Optionally bias toward likely foreground labels
      const lbl = typeof seg?.label === 'string' ? seg.label.toLowerCase() : '';
      const likelyForeground = lbl
        ? (FOREGROUND_LABELS.some((fg) => lbl.includes(fg)) || lbl !== 'background')
        : true;

      // Resample mask to canvas size if needed
      const maskResampled = resampleMask(maskInfo.data, maskInfo.width, maskInfo.height, canvas.width, canvas.height);

      if (likelyForeground) {
        for (let i = 0; i < combined.length; i++) {
          combined[i] = Math.max(combined[i], maskResampled[i]);
        }
        anyMask = true;
      }
    }

    if (!anyMask) {
      console.warn('No usable mask from segmentation; returning original image.');
      return await blobFromCanvas(canvas);
    }

    // Smooth edges for less jagged cutouts
    const smoothed = smoothMask(combined, canvas.width, canvas.height, 2);

    // Apply alpha to original image
    const out = document.createElement('canvas');
    out.width = canvas.width;
    out.height = canvas.height;
    const outCtx = out.getContext('2d');
    if (!outCtx) throw new Error('Could not get output canvas context');

    outCtx.drawImage(canvas, 0, 0);
    const outImageData = outCtx.getImageData(0, 0, out.width, out.height);
    const data = outImageData.data;
    for (let i = 0; i < smoothed.length; i++) {
      data[i * 4 + 3] = Math.round(smoothed[i] * 255);
    }
    outCtx.putImageData(outImageData, 0, 0);

    return await blobFromCanvas(out);
  } catch (error) {
    console.error('Error removing background, falling back to original:', error);
    // Never hard-fail: return original image contents
    try {
      const fallbackCanvas = document.createElement('canvas');
      const fallbackCtx = fallbackCanvas.getContext('2d');
      if (!fallbackCtx) throw new Error('No canvas context');
      fallbackCanvas.width = imageElement.naturalWidth;
      fallbackCanvas.height = imageElement.naturalHeight;
      fallbackCtx.drawImage(imageElement, 0, 0);
      return await blobFromCanvas(fallbackCanvas);
    } catch (e) {
      // As a last resort, make a tiny transparent PNG to avoid crashing the UI
      const tiny = document.createElement('canvas');
      tiny.width = 1; tiny.height = 1;
      return await blobFromCanvas(tiny);
    }
  }
};

// Convert various mask formats to a Float32Array in [0,1]
function toFloatMask(mask: any): { data: Float32Array; width: number; height: number } | null {
  if (!mask) return null;
  // RawImage-like object: { data: Uint8ClampedArray | Float32Array, width, height, channels? }
  const data = mask.data as any;
  const width = Number(mask.width ?? 0);
  const height = Number(mask.height ?? 0);
  if (!data || !width || !height) return null;

  // If 4 channels (RGBA), use alpha channel
  const channels = Number(mask.channels ?? (data.length === width * height * 4 ? 4 : 1));
  const out = new Float32Array(width * height);

  if (channels === 4) {
    for (let i = 0; i < width * height; i++) {
      const a = data[i * 4 + 3];
      out[i] = (typeof a === 'number' ? a : 0) / 255;
    }
  } else {
    // Single channel; normalize by max(1,255)
    let divisor = 1;
    // Heuristic: If values exceed 1, assume 0..255
    // Peek a few values
    for (let i = 0; i < Math.min(10, data.length); i++) {
      if (typeof data[i] === 'number' && data[i] > 1.0) { divisor = 255; break; }
    }
    const len = Math.min(out.length, data.length);
    for (let i = 0; i < len; i++) out[i] = Number(data[i] || 0) / divisor;
  }

  return { data: out, width, height };
}

// Nearest-neighbor resampling of a mask array to desired size
function resampleMask(src: Float32Array, sw: number, sh: number, dw: number, dh: number): Float32Array {
  if (sw === dw && sh === dh) return src;
  const dst = new Float32Array(dw * dh);
  for (let y = 0; y < dh; y++) {
    const sy = Math.min(sh - 1, Math.round((y / dh) * sh));
    for (let x = 0; x < dw; x++) {
      const sx = Math.min(sw - 1, Math.round((x / dw) * sw));
      dst[y * dw + x] = src[sy * sw + sx];
    }
  }
  return dst;
}

// Smooth mask edges for cleaner cutout (simple box blur)
function smoothMask(mask: Float32Array, width: number, height: number, radius: number = 2): Float32Array {
  const smoothed = new Float32Array(mask.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      let sum = 0;
      let count = 0;
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
      smoothed[idx] = sum / Math.max(1, count);
    }
  }
  return smoothed;
}

async function blobFromCanvas(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))), 'image/png', 1.0),
  );
}

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};
