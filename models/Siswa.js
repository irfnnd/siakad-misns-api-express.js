const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Siswa = sequelize.define('Siswa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    unique: true
  },
  nama_lengkap: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  nis: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true
  },
  nisn: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true
  },
  jenis_kelamin: {
    type: DataTypes.ENUM('Laki-laki', 'Perempuan'),
    allowNull: false
  },
  tanggal_lahir: {
    type: DataTypes.DATE,
    allowNull: false
  },
  telepon_ortu: {
    type: DataTypes.STRING(20)
  },
  status: {
    type: DataTypes.ENUM('Aktif', 'Lulus', 'Pindah'),
    defaultValue: 'Aktif'
  }
}, 
{
  tableName: 'siswa'
});

module.exports = Siswa;