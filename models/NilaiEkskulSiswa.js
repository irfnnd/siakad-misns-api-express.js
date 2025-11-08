const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NilaiEkskulSiswa = sequelize.define('NilaiEkskulSiswa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  rapor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ekskul_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  nilai: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  deskripsi: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'nilai_ekskul_siswa',
  timestamps: false
});

module.exports = NilaiEkskulSiswa;