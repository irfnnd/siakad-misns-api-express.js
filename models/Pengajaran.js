const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pengajaran = sequelize.define('Pengajaran', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  guru_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  mapel_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  kelas_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  semester_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'pengajaran',
  timestamps: false
});

module.exports = Pengajaran;