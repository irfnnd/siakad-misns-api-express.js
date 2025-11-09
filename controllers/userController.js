const { User, Pegawai } = require('../models'); // Hapus Siswa dari import
const bcrypt = require('bcryptjs');

const userController = {
  // Get all users
  getAllUsers: async (req, res) => {
    try {
      const { page = 1, limit = 10, role, status } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (role) whereClause.role = role;
      if (status) whereClause.status = status;

      const users = await User.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['password_hash'] },
        include: [
          {
            model: Pegawai,
            as: 'pegawai',
            attributes: ['id', 'nama_lengkap', 'nip', 'jabatan']
          }
          // Hapus include Siswa karena tidak ada role Siswa
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          users: users.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(users.count / limit),
            totalItems: users.count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Get user by ID
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;

      // Manual validation
      if (!id || isNaN(id) || parseInt(id) < 1) {
        return res.status(400).json({
          success: false,
          message: 'ID user tidak valid'
        });
      }

      const user = await User.findByPk(id, {
        attributes: { exclude: ['password_hash'] },
        include: [
          {
            model: Pegawai,
            as: 'pegawai',
            attributes: { exclude: ['user_id'] }
          }
          // Hapus include Siswa
        ]
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
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Create new user
  createUser: async (req, res) => {
    try {
      const { username, email, password, role, status, profile_data } = req.body;

      // Manual validation
      const errors = [];
      
      if (!username || username.length < 3 || username.length > 50) {
        errors.push('Username harus antara 3-50 karakter');
      }

      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        errors.push('Email tidak valid');
      }

      if (!password || password.length < 6) {
        errors.push('Password minimal 6 karakter');
      }

      if (!role || !['Admin', 'Guru'].includes(role)) {
        errors.push('Role harus Admin atau Guru');
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Data tidak valid',
          errors: errors
        });
      }

      // Check if username already exists
      const existingUsername = await User.findOne({ where: { username } });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username sudah digunakan'
        });
      }

      // Check if email already exists
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah digunakan'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Start transaction
      const transaction = await User.sequelize.transaction();

      try {
        // Create user
        const newUser = await User.create({
          username,
          email,
          password_hash: hashedPassword,
          role,
          status: status || 'Aktif',
          created_at: new Date()
        }, { transaction });

        // Create profile for Guru only (Admin tidak perlu profile Pegawai)
        if (role === 'Guru' && profile_data) {
          await Pegawai.create({
            user_id: newUser.id,
            nama_lengkap: profile_data.nama_lengkap,
            nip: profile_data.nip,
            jabatan: profile_data.jabatan,
            telepon: profile_data.telepon,
            alamat: profile_data.alamat
          }, { transaction });
        }

        // Commit transaction
        await transaction.commit();

        // Get created user with profile
        const createdUser = await User.findByPk(newUser.id, {
          attributes: { exclude: ['password_hash'] },
          include: [
            {
              model: Pegawai,
              as: 'pegawai',
              required: false
            }
          ]
        });

        res.status(201).json({
          success: true,
          message: 'User berhasil dibuat',
          data: createdUser
        });

      } catch (error) {
        // Rollback transaction if error
        await transaction.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Update user
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { username, email, role, status, profile_data } = req.body;

      // Manual validation untuk ID
      if (!id || isNaN(id) || parseInt(id) < 1) {
        return res.status(400).json({
          success: false,
          message: 'ID user tidak valid'
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      // Validation untuk role
      if (role && !['Admin', 'Guru'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Role harus Admin atau Guru'
        });
      }

      // Check if username already exists (excluding current user)
      if (username && username !== user.username) {
        const existingUsername = await User.findOne({ 
          where: { username },
          attributes: ['id']
        });
        if (existingUsername) {
          return res.status(400).json({
            success: false,
            message: 'Username sudah digunakan'
          });
        }
      }

      // Check if email already exists (excluding current user)
      if (email && email !== user.email) {
        const existingEmail = await User.findOne({ 
          where: { email },
          attributes: ['id']
        });
        if (existingEmail) {
          return res.status(400).json({
            success: false,
            message: 'Email sudah digunakan'
          });
        }
      }

      // Start transaction
      const transaction = await User.sequelize.transaction();

      try {
        // Update user
        await user.update({
          username: username || user.username,
          email: email || user.email,
          role: role || user.role,
          status: status || user.status
        }, { transaction });

        // Update profile hanya untuk Guru
        if (role === 'Guru' && profile_data) {
          let pegawai = await Pegawai.findOne({ where: { user_id: id } });
          if (pegawai) {
            await pegawai.update(profile_data, { transaction });
          } else {
            await Pegawai.create({
              user_id: id,
              ...profile_data
            }, { transaction });
          }
        }

        // Jika role berubah dari Guru ke Admin, hapus data Pegawai
        if (user.role === 'Guru' && role === 'Admin') {
          await Pegawai.destroy({ where: { user_id: id }, transaction });
        }

        // Commit transaction
        await transaction.commit();

        // Get updated user with profile
        const updatedUser = await User.findByPk(id, {
          attributes: { exclude: ['password_hash'] },
          include: [
            {
              model: Pegawai,
              as: 'pegawai',
              required: false
            }
          ]
        });

        res.json({
          success: true,
          message: 'User berhasil diupdate',
          data: updatedUser
        });

      } catch (error) {
        // Rollback transaction if error
        await transaction.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Update user status
  updateUserStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Manual validation
      if (!id || isNaN(id) || parseInt(id) < 1) {
        return res.status(400).json({
          success: false,
          message: 'ID user tidak valid'
        });
      }

      if (!status || !['Aktif', 'Nonaktif'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status harus Aktif atau Nonaktif'
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      await user.update({ status });

      res.json({
        success: true,
        message: `Status user berhasil diubah menjadi ${status}`,
        data: {
          id: user.id,
          username: user.username,
          status: user.status
        }
      });
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Change password
  changePassword: async (req, res) => {
    try {
      const { id } = req.params;
      const { current_password, new_password } = req.body;

      // Manual validation
      if (!id || isNaN(id) || parseInt(id) < 1) {
        return res.status(400).json({
          success: false,
          message: 'ID user tidak valid'
        });
      }

      if (!current_password) {
        return res.status(400).json({
          success: false,
          message: 'Password saat ini harus diisi'
        });
      }

      if (!new_password || new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password baru minimal 6 karakter'
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password_hash);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Password saat ini tidak sesuai'
        });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(new_password, 12);

      // Update password
      await user.update({ password_hash: hashedNewPassword });

      res.json({
        success: true,
        message: 'Password berhasil diubah'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Delete user
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      // Manual validation
      if (!id || isNaN(id) || parseInt(id) < 1) {
        return res.status(400).json({
          success: false,
          message: 'ID user tidak valid'
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      // Start transaction
      const transaction = await User.sequelize.transaction();

      try {
        // Delete related Pegawai data if exists
        if (user.role === 'Guru') {
          await Pegawai.destroy({ where: { user_id: id }, transaction });
        }

        // Delete user
        await User.destroy({ where: { id }, transaction });

        // Commit transaction
        await transaction.commit();

        res.json({
          success: true,
          message: 'User berhasil dihapus'
        });

      } catch (error) {
        // Rollback transaction if error
        await transaction.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Get user statistics
  getUserStats: async (req, res) => {
    try {
      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { status: 'Aktif' } });
      const adminUsers = await User.count({ where: { role: 'Admin' } });
      const guruUsers = await User.count({ where: { role: 'Guru' } });

      res.json({
        success: true,
        data: {
          total_users: totalUsers,
          active_users: activeUsers,
          by_role: {
            admin: adminUsers,
            guru: guruUsers
          }
        }
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  }
};

module.exports = userController;