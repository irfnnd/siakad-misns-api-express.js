const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Semester = sequelize.define('Semester', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tahun_ajaran_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  nama: {
    type: DataTypes.ENUM('Ganjil', 'Genap'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Aktif', 'Nonaktif'),
    defaultValue: 'Nonaktif'
  }
}, {
  tableName: 'semester',
  timestamps: false
});

module.exports = Semester;