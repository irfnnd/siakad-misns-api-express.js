const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Pegawai, Siswa } = require('../models');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validasi input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password harus diisi'
      });
    }

    // Cari user
    const user = await User.findOne({ 
      where: { username },
      include: [
        { model: Pegawai, required: false },
        { model: Siswa, required: false }
      ]
    });

    if (!user || user.status !== 'Aktif') {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }

    // Generate token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Data user untuk response
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status
    };

    // Tambahkan data profil berdasarkan role
    if (user.role === 'Guru' && user.Pegawai) {
      userData.profile = user.Pegawai;
    } else if (user.role === 'Siswa' && user.Siswa) {
      userData.profile = user.Siswa;
    }

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        user: userData,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findByPk(userId, {
      include: [
        { model: Pegawai, required: false },
        { model: Siswa, required: false }
      ],
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

module.exports = { login, getProfile };