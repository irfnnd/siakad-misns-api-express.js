const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KonfigurasiBobot = sequelize.define('KonfigurasiBobot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pengajaran_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  bobot_harian: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  bobot_pts: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  bobot_pas: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  }
}, {
  tableName: 'konfigurasi_bobot',
  timestamps: false
});

module.exports = KonfigurasiBobot;