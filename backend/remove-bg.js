const Jimp = require('jimp');

async function removeWhiteBackground() {
  const imagePath = 'c:\\Users\\Agastya Bhardwaj\\OneDrive\\Desktop\\Clinic-Software\\frontend\\public\\logo.png';
  const image = await Jimp.read(imagePath);
  
  // Iterate through all pixels
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    const a = this.bitmap.data[idx + 3];
    
    // If pixel is near-white, make it transparent
    // Tweak tolerance if needed. > 230 means very light grey/white
    if (r > 240 && g > 240 && b > 240) {
      this.bitmap.data[idx + 3] = 0; // alpha = 0
    }
  });

  await image.writeAsync(imagePath);
  console.log('Background removed successfully.');
}

removeWhiteBackground().catch(console.error);
