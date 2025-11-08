const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MataPelajaran = sequelize.define('MataPelajaran', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  kode_mapel: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true
  },
  nama_mapel: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'mata_pelajaran',
  timestamps: false
});

module.exports = MataPelajaran;