const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Nilai = sequelize.define('Nilai', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  penilaian_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  siswa_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  nilai: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  }
}, {
  tableName: 'nilai',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['penilaian_id', 'siswa_id']
    }
  ]
});

module.exports = Nilai;