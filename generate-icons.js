import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.resolve('public/icon.svg');
const out192 = path.resolve('public/icon-192.png');
const out512 = path.resolve('public/icon-512.png');

console.log('Generating PNG icons from SVG...');

async function run() {
  try {
    if (!fs.existsSync(svgPath)) {
      console.error('Error: Source public/icon.svg does NOT exist.');
      process.exit(1);
    }

    // Generate 192x192 PNG
    await sharp(svgPath)
      .resize(192, 192)
      .png()
      .toFile(out192);
    console.log('Created: public/icon-192.png');

    // Generate 512x512 PNG
    await sharp(svgPath)
      .resize(512, 512)
      .png()
      .toFile(out512);
    console.log('Created: public/icon-512.png');
    
    console.log('Icon generation completely successful!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

run();
