const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Base folder for the jewelry shop
const BASE_FOLDER = 'jewllery_shop';

/**
 * Upload an image to Cloudinary
 * @param {string} filePath - Local file path or base64 data
 * @param {string} folder - Subfolder (products, logos)
 * @param {string} publicId - Optional custom public ID
 * @returns {Promise<Object>} Cloudinary response with secure_url
 */
const uploadImage = async (filePath, folder = 'products', publicId = null) => {
  try {
    const options = {
      folder: `${BASE_FOLDER}/${folder}`,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    };

    if (publicId) {
      options.public_id = publicId;
      options.overwrite = true;
    }

    const result = await cloudinary.uploader.upload(filePath, options);
    console.log(`✅ Image uploaded to Cloudinary: ${result.secure_url}`);
    return result;
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error.message);
    throw error;
  }
};

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - The public ID of the image (from URL)
 * @returns {Promise<Object>} Cloudinary response
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`🗑️ Image deleted from Cloudinary: ${publicId} - ${result.result}`);
    return result;
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error.message);
    throw error;
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Full Cloudinary URL
 * @returns {string} Public ID for deletion
 */
const extractPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }
  
  try {
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{folder}/{public_id}.{ext}
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    // Get everything after 'upload/' and before the extension
    const pathAfterUpload = parts.slice(uploadIndex + 1).join('/');
    // Remove version if present (starts with 'v' followed by numbers)
    const withoutVersion = pathAfterUpload.replace(/^v\d+\//, '');
    // Remove file extension
    const publicId = withoutVersion.replace(/\.[^/.]+$/, '');
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {string[]} urls - Array of Cloudinary URLs
 * @returns {Promise<Object[]>} Array of deletion results
 */
const deleteImages = async (urls) => {
  const results = [];
  for (const url of urls) {
    const publicId = extractPublicId(url);
    if (publicId) {
      try {
        const result = await deleteImage(publicId);
        results.push({ url, publicId, result });
      } catch (error) {
        results.push({ url, publicId, error: error.message });
      }
    }
  }
  return results;
};

/**
 * Upload from buffer (for multer uploads)
 * @param {Buffer} buffer - Image buffer
 * @param {string} folder - Subfolder (products, logos)
 * @param {string} prefix - Optional prefix for the filename
 * @returns {Promise<Object>} Cloudinary response
 */
const uploadFromBuffer = (buffer, folder = 'products', prefix = 'img') => {
  return new Promise((resolve, reject) => {
    // Generate unique public_id with timestamp and random suffix
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const uniqueId = `${prefix}_${timestamp}_${randomSuffix}`;
    
    const options = {
      folder: `${BASE_FOLDER}/${folder}`,
      public_id: uniqueId,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    };

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        console.error('❌ Cloudinary buffer upload error:', error.message);
        reject(error);
      } else {
        console.log(`✅ Image uploaded to Cloudinary: ${result.secure_url}`);
        resolve(result);
      }
    });

    uploadStream.end(buffer);
  });
};

/**
 * Get Cloudinary logo URL
 * @returns {string} URL to the Aabhar logo on Cloudinary
 */
const getLogoUrl = () => {
  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/jewllery_shop/logos/alankara-emblem.png`;
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  deleteImages,
  extractPublicId,
  uploadFromBuffer,
  getLogoUrl
};
