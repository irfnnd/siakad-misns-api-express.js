// models/Pegawai.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pegawai = sequelize.define('Pegawai', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nama_lengkap: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nip: {
    type: DataTypes.STRING,
    unique: true,
  },
  jabatan: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  no_hp: {
    type: DataTypes.STRING,
  },
  alamat: {
    type: DataTypes.TEXT,
  }
}, {
  tableName: 'pegawai'
});

module.exports = Pegawai;