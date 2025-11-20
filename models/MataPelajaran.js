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
  },
  kelompok: {
    type: DataTypes.ENUM('Tematik', 'Umum', 'Peminatan', 'Muatan Lokal', 'Lainnya'),
    allowNull: false
  }, 
  kkm: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 100
    }
  },
  status: {
    type: DataTypes.ENUM('Aktif', 'Non-Aktif'),
    defaultValue: 'Aktif'
  }
}, {
  tableName: 'mata_pelajaran',
  timestamps: false
});

module.exports = MataPelajaran;