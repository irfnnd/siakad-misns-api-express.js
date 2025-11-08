// config/db.js
const { Sequelize } = require('sequelize');
require('dotenv').config(); // Memuat variabel .env

// Buat instance Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false, // Set 'true' untuk melihat query SQL di console
  }
);

// Ekspor instance sequelize
module.exports = sequelize;