import { supabase } from "@/integrations/supabase/client";

/**
 * Remove background from an image using the backend API
 */
export const removeBackground = async (imageElement: HTMLImageElement): Promise<Blob> => {
  try {
    console.log('Starting background removal via backend API...');

    // Convert image to data URL
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    ctx.drawImage(imageElement, 0, 0);
    
    const imageDataUrl = canvas.toDataURL('image/png');

    // Call backend function
    const { data, error } = await supabase.functions.invoke('remove-background', {
      body: { imageDataUrl }
    });

    if (error) {
      throw new Error(error.message || 'Background removal failed');
    }

    if (!data?.resultImage) {
      throw new Error('No result image returned');
    }

    // Convert base64 result to Blob
    const base64Data = data.resultImage.replace(/^data:image\/\w+;base64,/, '');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return new Blob([bytes], { type: 'image/png' });
  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
};

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};
