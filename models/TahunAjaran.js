const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TahunAjaran = sequelize.define('TahunAjaran', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tahun: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('Aktif', 'Nonaktif'),
    defaultValue: 'Nonaktif'
  }
}, {
  tableName: 'tahun_ajaran'
});

module.exports = TahunAjaran;