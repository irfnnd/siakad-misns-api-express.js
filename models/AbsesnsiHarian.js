const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AbsensiHarian = sequelize.define('AbsensiHarian', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  siswa_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tanggal: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('S', 'I', 'A'),
    allowNull: false
  },
  keterangan: {
    type: DataTypes.TEXT
  },
  semester_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'absensi_harian',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['siswa_id', 'tanggal']
    }
  ]
});

module.exports = AbsensiHarian;