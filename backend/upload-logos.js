/**
 * Upload brand assets (logo, emblem) to Cloudinary
 * Usage: node upload-logos.js
 */

require('dotenv').config();
const path = require('path');
const { uploadImage } = require('./services/cloudinaryService');

const uploadLogos = async () => {
  console.log('🚀 Uploading brand assets to Cloudinary...');
  
  const assets = [
    {
      name: 'Aabhar-emblem',
      path: path.join(__dirname, '..', 'frontend', 'public', 'images', 'Aabhar-emblem.png')
    },
    {
      name: 'Aabhar-logo-dark',
      path: path.join(__dirname, '..', 'frontend', 'public', 'images', 'Aabhar-logo-dark.png')
    },
    {
      name: 'Aabhar-logo-light', 
      path: path.join(__dirname, '..', 'frontend', 'public', 'images', 'Aabhar-logo-light.png')
    }
  ];
  
  for (const asset of assets) {
    try {
      console.log(`📤 Uploading: ${asset.name}`);
      const result = await uploadImage(asset.path, 'logos', asset.name);
      console.log(`✅ Uploaded: ${result.secure_url}`);
    } catch (error) {
      console.error(`❌ Failed to upload ${asset.name}:`, error.message);
    }
  }
  
  console.log('\n✅ Logo upload complete!');
  console.log('\nYou can now use these URLs in email templates:');
  console.log(`https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/jewllery_shop/logos/Aabhar-emblem`);
  console.log(`https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/jewllery_shop/logos/Aabhar-logo-dark`);
  
  process.exit(0);
};

uploadLogos();
