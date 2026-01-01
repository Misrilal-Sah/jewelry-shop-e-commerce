
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createAdmin() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'jewelry_shop'
    });
    console.log('Connected!');

    const adminUser = {
      name: 'Demo Admin',
      email: 'demo@admin.com',
      password: '$2a$10$stFD0/58QP9CZHBwnH2pzuiH9U7g1BzHQlv5W08.hh1.0a1Cl52BC', // Admin@123
      role: 'admin'
    };

    console.log('Inserting/Updating admin user...');
    await connection.execute(
      `INSERT INTO users (name, email, password, role) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE password = ?, role = ?`,
      [adminUser.name, adminUser.email, adminUser.password, adminUser.role, adminUser.password, adminUser.role]
    );

    console.log('✅ Demo Admin user ready!');
    console.log('Email: demo@admin.com');
    console.log('Password: Admin@123');

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
}

createAdmin();
