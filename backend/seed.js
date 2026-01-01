const pool = require('./config/db');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    console.log('🌱 Seeding database...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT IGNORE INTO users (name, email, password, role) 
      VALUES ('Admin', 'admin@jewelryshop.com', ?, 'admin')
    `, [hashedPassword]);

    // Create sample products
    const products = [
      {
        name: 'Royal Diamond Solitaire Ring',
        description: 'An exquisite diamond solitaire ring featuring a brilliant-cut diamond set in 18K gold. Perfect for engagements and special occasions.',
        category: 'rings',
        collection: 'wedding',
        metal_type: 'diamond',
        purity: '18K',
        weight_grams: 4.5,
        metal_price: 125000,
        making_charges: 15000,
        stock: 10,
        images: JSON.stringify(['/images/ring-1.jpg', '/images/ring-1-side.jpg']),
        sizes: JSON.stringify(['6', '7', '8', '9', '10']),
        is_featured: true
      },
      {
        name: 'Traditional Gold Necklace Set',
        description: 'A stunning traditional gold necklace set with intricate temple jewelry design. Includes matching earrings.',
        category: 'necklaces',
        collection: 'wedding',
        metal_type: 'gold',
        purity: '22K',
        weight_grams: 45,
        metal_price: 285000,
        making_charges: 35000,
        stock: 5,
        images: JSON.stringify(['/images/necklace-1.jpg']),
        sizes: JSON.stringify(['Standard']),
        is_featured: true
      },
      {
        name: 'Diamond Stud Earrings',
        description: 'Classic diamond stud earrings with brilliant-cut diamonds in 18K white gold setting.',
        category: 'earrings',
        collection: 'daily',
        metal_type: 'diamond',
        purity: '18K',
        weight_grams: 3.2,
        metal_price: 85000,
        making_charges: 10000,
        stock: 15,
        images: JSON.stringify(['/images/earring-1.jpg']),
        sizes: JSON.stringify(['Standard']),
        is_featured: true
      },
      {
        name: 'Gold Kada Bangles Set',
        description: 'Traditional gold kada bangles with intricate meenakari work. Set of 2 bangles.',
        category: 'bangles',
        collection: 'festive',
        metal_type: 'gold',
        purity: '22K',
        weight_grams: 32,
        metal_price: 195000,
        making_charges: 25000,
        stock: 8,
        images: JSON.stringify(['/images/bangle-1.jpg']),
        sizes: JSON.stringify(['2.4', '2.6', '2.8']),
        is_featured: true
      },
      {
        name: 'Bridal Complete Set',
        description: 'Complete bridal jewelry set featuring necklace, earrings, maang tikka, and bangles in 22K gold with kundan work.',
        category: 'bridal',
        collection: 'wedding',
        metal_type: 'gold',
        purity: '22K',
        weight_grams: 120,
        metal_price: 750000,
        making_charges: 95000,
        stock: 3,
        images: JSON.stringify(['/images/bridal-1.jpg']),
        sizes: JSON.stringify(['Standard']),
        is_featured: true
      },
      {
        name: 'Silver Anklet Pair',
        description: 'Elegant silver anklets with bell charms and traditional design.',
        category: 'bangles',
        collection: 'daily',
        metal_type: 'silver',
        purity: '925',
        weight_grams: 25,
        metal_price: 3500,
        making_charges: 1500,
        stock: 20,
        images: JSON.stringify(['/images/anklet-1.jpg']),
        sizes: JSON.stringify(['9', '10', '11']),
        is_featured: false
      },
      {
        name: 'Platinum Engagement Ring',
        description: 'Modern platinum engagement ring with a stunning oval-cut diamond.',
        category: 'rings',
        collection: 'wedding',
        metal_type: 'platinum',
        purity: '950',
        weight_grams: 5.8,
        metal_price: 185000,
        making_charges: 22000,
        stock: 6,
        images: JSON.stringify(['/images/ring-2.jpg']),
        sizes: JSON.stringify(['5', '6', '7', '8']),
        is_featured: true
      },
      {
        name: 'Daily Wear Gold Chain',
        description: 'Lightweight 18K gold chain perfect for everyday wear.',
        category: 'necklaces',
        collection: 'daily',
        metal_type: 'gold',
        purity: '18K',
        weight_grams: 8,
        metal_price: 42000,
        making_charges: 5000,
        stock: 25,
        images: JSON.stringify(['/images/chain-1.jpg']),
        sizes: JSON.stringify(['18 inch', '20 inch', '22 inch']),
        is_featured: false
      }
    ];

    for (const product of products) {
      await pool.query(`
        INSERT INTO products (name, description, category, collection, metal_type, purity,
        weight_grams, metal_price, making_charges, stock, images, sizes, is_featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        product.name, product.description, product.category, product.collection,
        product.metal_type, product.purity, product.weight_grams, product.metal_price,
        product.making_charges, product.stock, product.images, product.sizes, product.is_featured
      ]);
    }

    // Create sample coupon
    await pool.query(`
      INSERT IGNORE INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount, valid_from, valid_until)
      VALUES ('WELCOME10', '10% off on first order', 'percentage', 10, 5000, 10000, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))
    `);

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();
