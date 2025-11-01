import { AutoModel, AutoProcessor, RawImage } from "@huggingface/transformers";

let model: any = null;
let processor: any = null;

async function loadModel() {
  if (!model || !processor) {
    model = await AutoModel.from_pretrained("briaai/RMBG-1.4", {
      device: "webgpu",
    });
    processor = await AutoProcessor.from_pretrained("briaai/RMBG-1.4");
  }
  return { model, processor };
}

export async function removeBackground(imageUrl: string): Promise<string> {
  const { model, processor } = await loadModel();

  // Load image
  const image = await RawImage.fromURL(imageUrl);
  
  // Preprocess image
  const inputs = await processor(image);
  
  // Run model
  const { output } = await model(inputs);
  
  // Post-process to get mask
  const mask = await RawImage.fromTensor(output[0].mul(255).to("uint8")).resize(image.width, image.height);
  
  // Create canvas and apply mask
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d")!;
  
  // Draw original image
  ctx.drawImage(image.toCanvas(), 0, 0);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const maskData = mask.data;
  
  // Apply alpha channel from mask
  for (let i = 0; i < imageData.data.length; i += 4) {
    const maskIndex = Math.floor(i / 4);
    imageData.data[i + 3] = maskData[maskIndex]; // Set alpha
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  return canvas.toDataURL("image/png");
}
