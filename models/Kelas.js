const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Kelas = sequelize.define('Kelas', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nama_kelas: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  tingkat: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 6
    }
  },
  wali_kelas_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'kelas',
  timestamps: false
});

module.exports = Kelas;