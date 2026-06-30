const Jimp = require('jimp');
const path = require('path');

async function removeWatermark() {
  try {
    const imgPath = path.join(__dirname, '../frontend/public/Prescription.png');
    const image = await Jimp.read(imgPath);
    
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    // The Gemini watermark is typically in the bottom right corner
    // We will copy a patch of clean paper texture from slightly to the left
    // and paste it over the watermark area.
    
    // Define the watermark area (bottom right 100x100 pixels, adjust based on image size)
    const patchSize = Math.floor(width * 0.1); // 10% of width
    
    // Clone a clean patch from the bottom center-right
    const cleanPatch = image.clone().crop(
      width - patchSize * 2.5, 
      height - patchSize, 
      patchSize * 1.5, 
      patchSize
    );
    
    // Paste the clean patch over the watermark
    image.composite(cleanPatch, width - patchSize * 1.5, height - patchSize);
    
    // Save the image
    await image.writeAsync(imgPath);
    console.log('Successfully removed watermark!');
  } catch (error) {
    console.error('Error removing watermark:', error);
  }
}

removeWatermark();
