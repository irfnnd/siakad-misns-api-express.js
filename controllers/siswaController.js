const { Siswa, User, Kelas, SiswaDiKelas, Semester } = require('../models');
const bcrypt = require('bcryptjs');

const siswaController = {
  // Get all siswa dengan pagination
  getAllSiswa: async (req, res) => {
    try {
      const { page = 1, limit = 10, status, kelas_id } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (status) whereClause.status = status;

      // Jika filter by kelas, join dengan SiswaDiKelas
      let includeClause = [
        {
          model: User,
          as: 'user',
          attributes: ['username', 'email', 'status'],
          required: false
        }
      ];

      if (kelas_id) {
        includeClause.push({
          model: Kelas,
          as: 'kelas',
          through: { 
            where: { kelas_id },
            attributes: [] 
          },
          required: true
        });
      }

      const siswa = await Siswa.findAndCountAll({
        where: whereClause,
        include: includeClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['nama_lengkap', 'ASC']]
      });

      res.json({
        success: true,
        data: {
          siswa: siswa.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(siswa.count / limit),
            totalItems: siswa.count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get all siswa error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Get siswa by ID
  getSiswaById: async (req, res) => {
    try {
      const { id } = req.params;

      const siswa = await Siswa.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: { exclude: ['password_hash'] },
            required: false
          },
          {
            model: Kelas,
            as: 'kelas',
            through: { attributes: [] },
            required: false
          }
        ]
      });

      if (!siswa) {
        return res.status(404).json({
          success: false,
          message: 'Siswa tidak ditemukan'
        });
      }

      res.json({
        success: true,
        data: siswa
      });
    } catch (error) {
      console.error('Get siswa by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Create new siswa
  createSiswa: async (req, res) => {
    try {
      const { 
        nama_lengkap, 
        nis, 
        nisn, 
        jenis_kelamin, 
        tanggal_lahir, 
        telepon_ortu, 
        status,
        username,
        email,
        password 
      } = req.body;

      // Validasi manual
      const errors = [];
      
      if (!nama_lengkap) errors.push('Nama lengkap harus diisi');
      if (!nis) errors.push('NIS harus diisi');
      if (!nisn) errors.push('NISN harus diisi');
      if (!jenis_kelamin) errors.push('Jenis kelamin harus diisi');
      if (!tanggal_lahir) errors.push('Tanggal lahir harus diisi');

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Data tidak valid',
          errors: errors
        });
      }

      // Check if NIS already exists
      const existingNis = await Siswa.findOne({ where: { nis } });
      if (existingNis) {
        return res.status(400).json({
          success: false,
          message: 'NIS sudah digunakan'
        });
      }

      // Check if NISN already exists
      const existingNisn = await Siswa.findOne({ where: { nisn } });
      if (existingNisn) {
        return res.status(400).json({
          success: false,
          message: 'NISN sudah digunakan'
        });
      }

      // Jika ada data user (username, email, password)
      let user_id = null;
      if (username && email && password) {
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

        // Create user
        const newUser = await User.create({
          username,
          email,
          password_hash: hashedPassword,
          role: 'Siswa',
          status: 'Aktif',
          created_at: new Date()
        });

        user_id = newUser.id;
      }

      // Start transaction
      const transaction = await Siswa.sequelize.transaction();

      try {
        // Create siswa
        const newSiswa = await Siswa.create({
          user_id,
          nama_lengkap,
          nis,
          nisn,
          jenis_kelamin,
          tanggal_lahir,
          telepon_ortu,
          status: status || 'Aktif'
        }, { transaction });

        await transaction.commit();

        // Get created siswa with relations
        const createdSiswa = await Siswa.findByPk(newSiswa.id, {
          include: [
            {
              model: User,
              as: 'user',
              required: false,
              attributes: { exclude: ['password_hash'] }
            }
          ]
        });

        res.status(201).json({
          success: true,
          message: 'Siswa berhasil dibuat',
          data: createdSiswa
        });

      } catch (error) {
        await transaction.rollback();
        
        // Handle unique constraint errors
        if (error.name === 'SequelizeUniqueConstraintError') {
          const field = error.errors[0]?.path;
          if (field === 'nis') {
            return res.status(400).json({
              success: false,
              message: 'NIS sudah digunakan'
            });
          } else if (field === 'nisn') {
            return res.status(400).json({
              success: false,
              message: 'NISN sudah digunakan'
            });
          }
        }
        
        throw error;
      }

    } catch (error) {
      console.error('Create siswa error:', error);
      
      // Handle database errors
      if (error.original && error.original.code === '23505') {
        if (error.fields && error.fields.nis) {
          return res.status(400).json({
            success: false,
            message: 'NIS sudah digunakan'
          });
        } else if (error.fields && error.fields.nisn) {
          return res.status(400).json({
            success: false,
            message: 'NISN sudah digunakan'
          });
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Update siswa
  updateSiswa: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        nama_lengkap, 
        nis, 
        nisn, 
        jenis_kelamin, 
        tanggal_lahir, 
        telepon_ortu, 
        status 
      } = req.body;

      const siswa = await Siswa.findByPk(id);
      if (!siswa) {
        return res.status(404).json({
          success: false,
          message: 'Siswa tidak ditemukan'
        });
      }

      // Check if NIS already exists (excluding current siswa)
      if (nis && nis !== siswa.nis) {
        const existingNis = await Siswa.findOne({ 
          where: { nis },
          attributes: ['id']
        });
        if (existingNis) {
          return res.status(400).json({
            success: false,
            message: 'NIS sudah digunakan'
          });
        }
      }

      // Check if NISN already exists (excluding current siswa)
      if (nisn && nisn !== siswa.nisn) {
        const existingNisn = await Siswa.findOne({ 
          where: { nisn },
          attributes: ['id']
        });
        if (existingNisn) {
          return res.status(400).json({
            success: false,
            message: 'NISN sudah digunakan'
          });
        }
      }

      await siswa.update({
        nama_lengkap: nama_lengkap || siswa.nama_lengkap,
        nis: nis || siswa.nis,
        nisn: nisn || siswa.nisn,
        jenis_kelamin: jenis_kelamin || siswa.jenis_kelamin,
        tanggal_lahir: tanggal_lahir || siswa.tanggal_lahir,
        telepon_ortu: telepon_ortu || siswa.telepon_ortu,
        status: status || siswa.status
      });

      // Get updated siswa
      const updatedSiswa = await Siswa.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            required: false,
            attributes: { exclude: ['password_hash'] }
          }
        ]
      });

      res.json({
        success: true,
        message: 'Siswa berhasil diupdate',
        data: updatedSiswa
      });

    } catch (error) {
      console.error('Update siswa error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Update siswa status
  updateSiswaStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const siswa = await Siswa.findByPk(id);
      if (!siswa) {
        return res.status(404).json({
          success: false,
          message: 'Siswa tidak ditemukan'
        });
      }

      await siswa.update({ status });

      res.json({
        success: true,
        message: `Status siswa berhasil diubah menjadi ${status}`,
        data: {
          id: siswa.id,
          nama_lengkap: siswa.nama_lengkap,
          status: siswa.status
        }
      });
    } catch (error) {
      console.error('Update siswa status error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Delete siswa
  deleteSiswa: async (req, res) => {
    try {
      const { id } = req.params;

      const siswa = await Siswa.findByPk(id);
      if (!siswa) {
        return res.status(404).json({
          success: false,
          message: 'Siswa tidak ditemukan'
        });
      }

      // Start transaction
      const transaction = await Siswa.sequelize.transaction();

      try {
        // Delete user account if exists
        if (siswa.user_id) {
          await User.destroy({ where: { id: siswa.user_id }, transaction });
        }

        // Delete siswa
        await Siswa.destroy({ where: { id }, transaction });

        await transaction.commit();

        res.json({
          success: true,
          message: 'Siswa berhasil dihapus'
        });

      } catch (error) {
        await transaction.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Delete siswa error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Get siswa statistics
  getSiswaStats: async (req, res) => {
    try {
      const totalSiswa = await Siswa.count();
      const aktifSiswa = await Siswa.count({ where: { status: 'Aktif' } });
      const lulusSiswa = await Siswa.count({ where: { status: 'Lulus' } });
      const pindahSiswa = await Siswa.count({ where: { status: 'Pindah' } });

      // Stats by gender
      const lakiLaki = await Siswa.count({ where: { jenis_kelamin: 'Laki-laki' } });
      const perempuan = await Siswa.count({ where: { jenis_kelamin: 'Perempuan' } });

      res.json({
        success: true,
        data: {
          total_siswa: totalSiswa,
          by_status: {
            aktif: aktifSiswa,
            lulus: lulusSiswa,
            pindah: pindahSiswa
          },
          by_gender: {
            laki_laki: lakiLaki,
            perempuan: perempuan
          }
        }
      });
    } catch (error) {
      console.error('Get siswa stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  }
};

module.exports = siswaController;