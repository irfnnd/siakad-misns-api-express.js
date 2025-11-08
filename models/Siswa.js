// models/Siswa.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Siswa = sequelize.define('Siswa', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nama_lengkap: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nis: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  nisn: {
    type: DataTypes.STRING,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('aktif', 'lulus', 'pindah', 'dikeluarkan'),
    defaultValue: 'aktif'
  }
  // ... tambahkan kolom lain (tgl_lahir, alamat, nama_wali, dll)
}, {
  tableName: 'siswa'
});

module.exports = Siswa;