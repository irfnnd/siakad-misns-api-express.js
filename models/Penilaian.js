const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Penilaian = sequelize.define('Penilaian', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pengajaran_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  nama_penilaian: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  tipe: {
    type: DataTypes.ENUM('Harian', 'PTS', 'PAS'),
    allowNull: false
  },
    // --- KOLOM BARU ---
  kategori: {
    type: DataTypes.ENUM('Pengetahuan', 'Keterampilan'),
    allowNull: false,
    defaultValue: 'Pengetahuan' 
  }
}, {
  tableName: 'penilaian',
  timestamps: false
});

module.exports = Penilaian;