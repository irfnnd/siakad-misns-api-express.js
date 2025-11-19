const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Siswa = sequelize.define('Siswa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nama_lengkap: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  nis: {
    type: DataTypes.STRING(30),
    allowNull: true,
    unique: true
  },
  nisn: {
    type: DataTypes.STRING(30),
    allowNull: true,
    unique: true
  },
  jenis_kelamin: {
    type: DataTypes.ENUM('Laki-laki', 'Perempuan'),
    allowNull: false
  },
  tempat_lahir: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  tanggal_lahir: {
    type: DataTypes.DATE,
    allowNull: false
  },
  telepon_ortu: {
    type: DataTypes.STRING(20)
  },
  alamat: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('Aktif', 'Lulus', 'Pindah'),
    defaultValue: 'Aktif'
  }
}, 
{
  tableName: 'siswa',
  timestamps: true
});

module.exports = Siswa;