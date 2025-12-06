const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '../public/images');
const imageFiles = ['course.png', 'seminar.png', 'workshop.png', 'competition.png'];

const optimizeImages = async () => {
  console.log('Starting image optimization...');

  for (const file of imageFiles) {
    const inputPath = path.join(imagesDir, file);
    const outputName = file.replace('.png', '_thumb.png');
    const outputPath = path.join(imagesDir, outputName);

    if (fs.existsSync(inputPath)) {
      try {
        await sharp(inputPath)
          .resize(400, 200, {
            fit: 'cover',
            position: 'center',
          })
          .toFormat('jpeg', { quality: 80 })
          .toFile(outputPath);
        console.log(`Successfully created thumbnail: ${outputName}`);
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    } else {
      console.warn(`Source file not found: ${file}`);
    }
  }

  console.log('Image optimization complete.');
};

optimizeImages();
