/**
 * Seed initial backgrounds to database
 * Run once: node scripts/seedBackgrounds.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const pool = require('../config/db');
const { uploadFromBuffer } = require('../services/cloudinaryService');

const BACKGROUNDS = [
  { name: 'Gold Silk', file: 'gold-silk.jpg' },
  { name: 'White Minimal', file: 'white-minimal.jpg' },
  { name: 'Luxury Velvet', file: 'luxury-velvet.jpg' },
  { name: 'Pearl White', file: 'pearl-white.jpg' },
  { name: 'Silver Metallic', file: 'silver-metallic.jpg' },
  { name: 'Rose Gold', file: 'rose-gold.jpg' },
  { name: 'Midnight Blue', file: 'midnight-blue.jpg' }
];

const seedBackgrounds = async () => {
  console.log('🎨 Seeding backgrounds to Cloudinary + DB...\n');
  
  for (const bg of BACKGROUNDS) {
    const filePath = path.join(__dirname, '../public/backgrounds', bg.file);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ File not found: ${bg.file}`);
      continue;
    }
    
    try {
      // Read file
      const buffer = fs.readFileSync(filePath);
      console.log(`📤 Uploading ${bg.name}...`);
      
      // Upload to Cloudinary
      const result = await uploadFromBuffer(buffer, 'product-backgrounds', 'bg');
      console.log(`   ✅ Uploaded: ${result.secure_url.substring(0, 50)}...`);
      
      // Check if already in DB
      const [existing] = await pool.query(
        'SELECT id FROM product_backgrounds WHERE name = ?',
        [bg.name]
      );
      
      if (existing.length > 0) {
        // Update existing
        await pool.query(
          'UPDATE product_backgrounds SET image_url = ? WHERE name = ?',
          [result.secure_url, bg.name]
        );
        console.log(`   📝 Updated in DB (ID: ${existing[0].id})`);
      } else {
        // Insert new
        const [insertResult] = await pool.query(
          'INSERT INTO product_backgrounds (name, image_url) VALUES (?, ?)',
          [bg.name, result.secure_url]
        );
        console.log(`   📝 Inserted in DB (ID: ${insertResult.insertId})`);
      }
      
      console.log('');
    } catch (error) {
      console.error(`❌ Error with ${bg.name}:`, error.message);
    }
  }
  
  console.log('✅ Seeding complete!');
  process.exit(0);
};

seedBackgrounds();
