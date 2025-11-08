const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pegawai = sequelize.define('Pegawai', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  nama_lengkap: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  nip: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  jabatan: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  telepon: {
    type: DataTypes.STRING(20)
  },
  alamat: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'pegawai',
  timestamps: false
});

module.exports = Pegawai;