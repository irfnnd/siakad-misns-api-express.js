const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SiswaDiKelas = sequelize.define('SiswaDiKelas', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  siswa_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  kelas_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  semester_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'siswa_di_kelas',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['siswa_id', 'semester_id']
    }
  ]
});

module.exports = SiswaDiKelas;