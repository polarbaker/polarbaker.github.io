import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const TEXTURE_SIZE = 2048; // Power of 2 for optimal performance

async function optimizeTexture(inputPath, outputPath) {
    await sharp(inputPath)
        .resize(TEXTURE_SIZE, TEXTURE_SIZE/2)
        .jpeg({ quality: 85 })
        .toFile(outputPath);
}

// Add this to package.json dependencies: 
// "sharp": "^0.32.0" 