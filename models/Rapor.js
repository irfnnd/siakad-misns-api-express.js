const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Rapor = sequelize.define('Rapor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  siswa_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  semester_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  catatan_wali_kelas: {
    type: DataTypes.TEXT
  },
  sikap_spiritual: {
    type: DataTypes.TEXT
  },
  sikap_sosial: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'rapor',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['siswa_id', 'semester_id']
    }
  ]
});

module.exports = Rapor;