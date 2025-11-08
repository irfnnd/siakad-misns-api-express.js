const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ekstrakurikuler = sequelize.define('Ekstrakurikuler', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nama_ekskul: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'ekstrakurikuler',
  timestamps: false
});

module.exports = Ekstrakurikuler;