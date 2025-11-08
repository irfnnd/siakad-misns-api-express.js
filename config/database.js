const { Sequelize } = require('sequelize');
require('dotenv').config();

// Inisialisasi sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Koneksi PostgreSQL berhasil di Windows');
    console.log(`📊 Database: ${process.env.DB_NAME}`);
  } catch (error) {
    console.error('❌ Gagal terkoneksi ke PostgreSQL:', error.message);
  }
})();

module.exports = sequelize; // <-- perhatikan ini
