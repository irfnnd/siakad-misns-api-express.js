// models/Kelas.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Kelas = sequelize.define('Kelas', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nama_kelas: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  // ... (misal: 'tingkat', 'jurusan' jika ada)
}, {
  tableName: 'kelas'
});

module.exports = Kelas;