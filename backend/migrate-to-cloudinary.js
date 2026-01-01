/**
 * Migration Script: Upload existing local images to Cloudinary
 * 
 * Run this script once to migrate all existing product images to Cloudinary.
 * Usage: node migrate-to-cloudinary.js
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const pool = require('./config/db');
const { uploadImage } = require('./services/cloudinaryService');

const migrateImages = async () => {
  console.log('🚀 Starting Cloudinary Migration...');
  console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
  
  try {
    // Get all products with local images
    const [products] = await pool.query('SELECT id, name, images FROM products WHERE images IS NOT NULL');
    
    console.log(`📦 Found ${products.length} products with images`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
      let images = [];
      
      try {
        images = typeof product.images === 'string' 
          ? JSON.parse(product.images) 
          : product.images;
        if (!Array.isArray(images)) images = [];
      } catch (e) {
        console.error(`❌ Error parsing images for product ${product.id}:`, e.message);
        continue;
      }
      
      if (images.length === 0) continue;
      
      // Check if images are local paths (not already Cloudinary)
      const localImages = images.filter(img => !img.includes('cloudinary.com'));
      
      if (localImages.length === 0) {
        console.log(`⏭️ Product ${product.id} already on Cloudinary`);
        continue;
      }
      
      console.log(`\n📤 Migrating product ${product.id}: ${product.name}`);
      console.log(`   Local images: ${localImages.length}`);
      
      const newImageUrls = [];
      const cloudinaryImages = images.filter(img => img.includes('cloudinary.com'));
      
      for (const localPath of localImages) {
        // Build full path
        let fullPath;
        if (localPath.startsWith('/uploads/')) {
          fullPath = path.join(__dirname, localPath);
        } else if (localPath.startsWith('/images/')) {
          fullPath = path.join(__dirname, '..', 'frontend', 'public', localPath);
        } else {
          fullPath = path.join(__dirname, localPath);
        }
        
        // Check if file exists
        if (!fs.existsSync(fullPath)) {
          console.log(`   ⚠️ File not found: ${fullPath}`);
          // Keep original path as fallback
          newImageUrls.push(localPath);
          continue;
        }
        
        try {
          console.log(`   📤 Uploading: ${path.basename(fullPath)}`);
          const result = await uploadImage(fullPath, 'products');
          newImageUrls.push(result.secure_url);
          console.log(`   ✅ Uploaded: ${result.secure_url}`);
          migratedCount++;
        } catch (uploadError) {
          console.error(`   ❌ Upload failed: ${uploadError.message}`);
          newImageUrls.push(localPath); // Keep original as fallback
          errorCount++;
        }
      }
      
      // Combine cloudinary images (if any existed) with newly uploaded
      const allImages = [...cloudinaryImages, ...newImageUrls];
      
      // Update database
      await pool.query(
        'UPDATE products SET images = ? WHERE id = ?',
        [JSON.stringify(allImages), product.id]
      );
      
      console.log(`   💾 Database updated with ${allImages.length} images`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${migratedCount} images`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('='.repeat(50));
    
    // Close database connection
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
migrateImages();
