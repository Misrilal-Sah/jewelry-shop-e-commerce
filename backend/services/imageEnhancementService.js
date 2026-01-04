/**
 * Image Enhancement Service
 * Removes background from product images and composites onto backgrounds from DB
 * Primary: remove.bg API (50 free/month)
 * Fallback: rembg Python (one-time install: pip install rembg[cli])
 */

const axios = require('axios');
const FormData = require('form-data');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

const REMOVEBG_API_KEY = process.env.REMOVEBG_API_KEY;

/**
 * Remove background using remove.bg API
 * @param {Buffer} imageBuffer - Input image buffer
 * @returns {Promise<Buffer>} - Transparent PNG buffer
 */
const removeBackgroundAPI = async (imageBuffer) => {
  if (!REMOVEBG_API_KEY) {
    throw new Error('REMOVEBG_API_KEY not configured');
  }

  const formData = new FormData();
  formData.append('image_file', imageBuffer, { filename: 'image.jpg' });
  formData.append('size', 'auto');
  formData.append('format', 'png');

  try {
    const response = await axios({
      method: 'post',
      url: 'https://api.remove.bg/v1.0/removebg',
      data: formData,
      headers: {
        ...formData.getHeaders(),
        'X-Api-Key': REMOVEBG_API_KEY
      },
      responseType: 'arraybuffer'
    });

    console.log('✅ remove.bg API: Background removed successfully');
    return Buffer.from(response.data);
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 402) {
        console.log('⚠️ remove.bg API: Quota exceeded, falling back to rembg');
        throw new Error('QUOTA_EXCEEDED');
      }
      console.error('❌ remove.bg API error:', status);
    } else {
      console.error('❌ remove.bg API error:', error.message);
    }
    throw error;
  }
};

/**
 * Remove background using local rembg Python
 * NOTE: Requires one-time install: pip install rembg[cli]
 */
const removeBackgroundLocal = async (imageBuffer) => {
  const tempDir = path.join(__dirname, '../temp');
  const tempInput = path.join(tempDir, 'input_' + Date.now() + '.jpg');
  const tempOutput = path.join(tempDir, 'output_' + Date.now() + '.png');
  
  await fs.mkdir(tempDir, { recursive: true });
  await fs.writeFile(tempInput, imageBuffer);
  
  return new Promise((resolve, reject) => {
    // Use python -m rembg.cli for Windows compatibility
    const rembg = spawn('python', ['-m', 'rembg.cli', 'i', tempInput, tempOutput]);
    
    let stderr = '';
    rembg.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    rembg.on('close', async (code) => {
      try {
        if (code !== 0) {
          console.error('❌ rembg error:', stderr);
          fs.unlink(tempInput).catch(() => {});
          reject(new Error('rembg failed: ' + stderr));
          return;
        }
        
        const outputBuffer = await fs.readFile(tempOutput);
        console.log('✅ rembg: Background removed successfully');
        
        fs.unlink(tempInput).catch(() => {});
        fs.unlink(tempOutput).catch(() => {});
        
        resolve(outputBuffer);
      } catch (err) {
        reject(err);
      }
    });
    
    rembg.on('error', (err) => {
      fs.unlink(tempInput).catch(() => {});
      if (err.code === 'ENOENT') {
        reject(new Error('rembg not installed. Run once: pip install rembg[cli]'));
      } else {
        reject(err);
      }
    });
  });
};

/**
 * Composite transparent image onto background from URL
 * @param {Buffer} transparentImage - PNG with transparent background
 * @param {string} backgroundUrl - URL of background image from Cloudinary
 * @returns {Promise<Buffer>} - Final composited image
 */
const compositeWithBackground = async (transparentImage, backgroundUrl) => {
  try {
    console.log('📥 Downloading background from:', backgroundUrl.substring(0, 50) + '...');
    
    // Download background image
    const bgResponse = await axios.get(backgroundUrl, { responseType: 'arraybuffer' });
    const backgroundBuffer = Buffer.from(bgResponse.data);
    
    // Get dimensions of transparent image
    const inputMeta = await sharp(transparentImage).metadata();
    
    // Resize background to match input dimensions
    const resizedBackground = await sharp(backgroundBuffer)
      .resize(inputMeta.width, inputMeta.height, { fit: 'cover' })
      .toBuffer();
    
    // Composite foreground onto background
    const result = await sharp(resizedBackground)
      .composite([{
        input: transparentImage,
        gravity: 'center'
      }])
      .jpeg({ quality: 90 })
      .toBuffer();
    
    console.log('✅ Image composited with background');
    return result;
  } catch (error) {
    console.error('❌ Compositing error:', error.message);
    throw error;
  }
};

/**
 * Main function: Enhance product image
 * @param {Buffer|string} image - Image buffer or URL
 * @param {string} backgroundUrl - URL of background image from DB
 * @returns {Promise<Buffer>} - Enhanced image buffer
 */
const enhanceProductImage = async (image, backgroundUrl) => {
  let imageBuffer;
  
  // If URL, download image
  if (typeof image === 'string') {
    console.log('📥 Downloading source image...');
    const response = await axios.get(image, { responseType: 'arraybuffer' });
    imageBuffer = Buffer.from(response.data);
  } else {
    imageBuffer = image;
  }
  
  console.log('🔄 Starting image enhancement...');
  
  let transparentImage;
  
  // Try remove.bg API first
  try {
    transparentImage = await removeBackgroundAPI(imageBuffer);
  } catch (apiError) {
    console.log('⚠️ API failed, trying local rembg...');
    
    try {
      transparentImage = await removeBackgroundLocal(imageBuffer);
    } catch (localError) {
      console.error('❌ Both methods failed');
      throw new Error('Background removal failed: ' + localError.message);
    }
  }
  
  // Composite with background from URL
  const enhancedImage = await compositeWithBackground(transparentImage, backgroundUrl);
  
  console.log('✅ Image enhancement complete!');
  return enhancedImage;
};

module.exports = {
  enhanceProductImage,
  removeBackgroundAPI,
  removeBackgroundLocal,
  compositeWithBackground
};
