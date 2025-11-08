const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NilaiRapor = sequelize.define('NilaiRapor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  rapor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  mapel_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  nilai_akhir: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  predikat: {
    type: DataTypes.CHAR(1),
    allowNull: false
  },
  deskripsi_capaian: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'nilai_rapor',
  timestamps: false
});

module.exports = NilaiRapor;