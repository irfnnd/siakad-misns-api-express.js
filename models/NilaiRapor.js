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
    allowNull: false,
    references: {
      model: 'rapor',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  mapel_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'mata_pelajaran',
      key: 'id'
    }
  },
  
  // --- ASPEK PENGETAHUAN (KI-3) ---
  nilai_pengetahuan: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  predikat_pengetahuan: {
    type: DataTypes.CHAR(1), // A, B, C, D
    allowNull: true
  },
  deskripsi_pengetahuan: {
    type: DataTypes.TEXT, // "Ananda sangat baik dalam memahami..."
    allowNull: true
  },

  // --- ASPEK KETERAMPILAN (KI-4) ---
  nilai_keterampilan: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  predikat_keterampilan: {
    type: DataTypes.CHAR(1),
    allowNull: true
  },
  deskripsi_keterampilan: {
    type: DataTypes.TEXT, // "Ananda sangat terampil dalam..."
    allowNull: true
  }

}, {
  tableName: 'nilai_rapor',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['rapor_id', 'mapel_id'] // 1 Mapel hanya muncul 1x di 1 Rapor
    }
  ]
});

module.exports = NilaiRapor;