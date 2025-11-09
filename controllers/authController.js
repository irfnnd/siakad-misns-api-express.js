const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Pegawai } = require('../models');

const login = async (req, res) => {
  try {
    // Gunakan req.body, bukan query parameters
    const { username, password } = req.body;

    console.log('Login attempt for username:', username);

    // Validasi input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password harus diisi'
      });
    }

    // Cari user - PERBAIKAN: gunakan 'as' dalam include
    const user = await User.findOne({ 
      where: { username },
      include: [
        { 
          model: Pegawai, 
          as: 'pegawai', // TAMBAHKAN INI
          required: false,
          attributes: { exclude: ['user_id'] } // Optional: exclude user_id
        }
      ],
      attributes: { exclude: ['password_hash'] } // Exclude password untuk sementara
    });

    if (!user) {
      console.log('User not found:', username);
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }

    if (user.status !== 'Aktif') {
      return res.status(401).json({
        success: false,
        message: 'Akun tidak aktif'
      });
    }

    // Untuk verifikasi password, kita perlu password_hash
    // Jadi ambil user lagi dengan password_hash
    const userWithPassword = await User.findOne({ 
      where: { username },
      attributes: ['id', 'password_hash'] // Hanya ambil field yang diperlukan
    });

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, userWithPassword.password_hash);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', username);
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
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Data user untuk response
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      created_at: user.created_at
    };

    // Tambahkan data profil jika role Guru
    if (user.role === 'Guru' && user.pegawai) {
      userData.profile = user.pegawai;
    }

    console.log('Login successful for user:', username);

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
        { 
          model: Pegawai, 
          as: 'pegawai', // TAMBAHKAN INI
          required: false 
        }
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