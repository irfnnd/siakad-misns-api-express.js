// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      msg: 'Username sudah terdaftar'
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'guru'),
    allowNull: false,
    defaultValue: 'guru',
  }
  // Foreign keys 'pegawai_id' dan 'siswa_id' akan ditambahkan oleh asosiasi
}, {
  tableName: 'users',
  hooks: {
    // Hook (otomatis) untuk hash password sebelum user dibuat
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    // Hook untuk hash password sebelum user di-update
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Method tambahan untuk memvalidasi password saat login
User.prototype.isValidPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
}

module.exports = User;