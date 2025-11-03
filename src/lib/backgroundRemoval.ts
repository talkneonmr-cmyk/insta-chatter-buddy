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
    const result = await segmenter(imageData);
    
    console.log('Segmentation result:', result);
    
    if (!result || !Array.isArray(result) || result.length === 0) {
      throw new Error('Invalid segmentation result');
    }
    
    // Create a combined mask for all foreground segments
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const outputCtx = outputCanvas.getContext('2d');
    
    if (!outputCtx) throw new Error('Could not get output canvas context');
    
    // Draw original image
    outputCtx.drawImage(canvas, 0, 0);
    
    // Get image data to modify
    const outputImageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
    const data = outputImageData.data;
    
    // Initialize combined mask (all background initially)
    const combinedMask = new Float32Array(canvas.width * canvas.height).fill(0);
    
    // Combine masks from segments that are likely foreground
    for (const segment of result) {
      const label = segment.label.toLowerCase();
      console.log(`Found segment: ${label}`);
      
      // Check if this segment is a foreground object
      const isForeground = FOREGROUND_LABELS.some(fg => label.includes(fg));
      
      if (isForeground && segment.mask && segment.mask.data) {
        console.log(`Adding ${label} to foreground mask`);
        // Add this mask to combined mask
        for (let i = 0; i < segment.mask.data.length; i++) {
          combinedMask[i] = Math.max(combinedMask[i], segment.mask.data[i]);
        }
      }
    }
    
    // If no person detected, use the largest segment as foreground
    const hasPersonMask = combinedMask.some(v => v > 0);
    if (!hasPersonMask && result.length > 0) {
      console.log('No person detected, using largest segment');
      // Find the segment with the highest score or largest mask
      let bestSegment = result[0];
      for (const segment of result) {
        if (segment.score > bestSegment.score) {
          bestSegment = segment;
        }
      }
      
      if (bestSegment.mask && bestSegment.mask.data) {
        for (let i = 0; i < bestSegment.mask.data.length; i++) {
          combinedMask[i] = bestSegment.mask.data[i];
        }
      }
    }
    
    // Apply smoothing to the mask for better edges
    const smoothedMask = smoothMask(combinedMask, canvas.width, canvas.height);
    
    // Apply the combined and smoothed mask to alpha channel
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
        1.0
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
