const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const JadwalPelajaran = sequelize.define('JadwalPelajaran', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  kelas_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  mapel_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  guru_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  semester_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  hari: {
    type: DataTypes.ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'),
    allowNull: false
  },
  jam_mulai: {
    type: DataTypes.TIME,
    allowNull: false
  },
  jam_selesai: {
    type: DataTypes.TIME,
    allowNull: false
  }
}, {
  tableName: 'jadwal_pelajaran',
  timestamps: false
});

module.exports = JadwalPelajaran;