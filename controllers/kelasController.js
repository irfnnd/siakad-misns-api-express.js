const { Kelas, Pegawai, Siswa, SiswaDiKelas, Semester } = require('../models');

const kelasController = {
  // Get all kelas dengan pagination
  getAllKelas: async (req, res) => {
    try {
      const { page = 1, limit = 10, tingkat } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (tingkat) whereClause.tingkat = parseInt(tingkat);

      const kelas = await Kelas.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Pegawai,
            as: 'wali_kelas',
            attributes: ['id', 'nama_lengkap', 'nip', 'jabatan']
          },
          {
            model: Siswa,
            as: 'siswa',
            through: { attributes: [] },
            attributes: ['id', 'nama_lengkap', 'nis'],
            required: false
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['tingkat', 'ASC'], ['nama_kelas', 'ASC']]
      });

      res.json({
        success: true,
        data: {
          kelas: kelas.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(kelas.count / limit),
            totalItems: kelas.count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get all kelas error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Get kelas by ID
  getKelasById: async (req, res) => {
    try {
      const { id } = req.params;

      const kelas = await Kelas.findByPk(id, {
        include: [
          {
            model: Pegawai,
            as: 'wali_kelas',
            attributes: { exclude: ['user_id'] }
          },
          {
            model: Siswa,
            as: 'siswa',
            through: { attributes: [] },
            attributes: ['id', 'nama_lengkap', 'nis', 'nisn', 'jenis_kelamin'],
            required: false
          }
        ]
      });

      if (!kelas) {
        return res.status(404).json({
          success: false,
          message: 'Kelas tidak ditemukan'
        });
      }

      res.json({
        success: true,
        data: kelas
      });
    } catch (error) {
      console.error('Get kelas by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Create new kelas
  createKelas: async (req, res) => {
    try {
      const { nama_kelas, tingkat, wali_kelas_id } = req.body;

      // Validasi manual
      const errors = [];
      
      if (!nama_kelas) errors.push('Nama kelas harus diisi');
      if (!tingkat || tingkat < 1 || tingkat > 6) errors.push('Tingkat harus antara 1-6');
      if (!wali_kelas_id) errors.push('Wali kelas harus dipilih');

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Data tidak valid',
          errors: errors
        });
      }

      // Check if wali_kelas exists
      const waliKelas = await Pegawai.findByPk(wali_kelas_id);
      if (!waliKelas) {
        return res.status(400).json({
          success: false,
          message: 'Wali kelas tidak ditemukan'
        });
      }

      // Check if kelas dengan nama yang sama sudah ada
      const existingKelas = await Kelas.findOne({ 
        where: { 
          nama_kelas,
          tingkat 
        } 
      });
      if (existingKelas) {
        return res.status(400).json({
          success: false,
          message: `Kelas ${nama_kelas} tingkat ${tingkat} sudah ada`
        });
      }

      // Create kelas
      const newKelas = await Kelas.create({
        nama_kelas,
        tingkat: parseInt(tingkat),
        wali_kelas_id: parseInt(wali_kelas_id)
      });

      // Get created kelas with relations
      const createdKelas = await Kelas.findByPk(newKelas.id, {
        include: [
          {
            model: Pegawai,
            as: 'wali_kelas',
            attributes: ['id', 'nama_lengkap', 'nip', 'jabatan']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Kelas berhasil dibuat',
        data: createdKelas
      });

    } catch (error) {
      console.error('Create kelas error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Update kelas
  updateKelas: async (req, res) => {
    try {
      const { id } = req.params;
      const { nama_kelas, tingkat, wali_kelas_id } = req.body;

      const kelas = await Kelas.findByPk(id);
      if (!kelas) {
        return res.status(404).json({
          success: false,
          message: 'Kelas tidak ditemukan'
        });
      }

      // Check if wali_kelas exists
      if (wali_kelas_id) {
        const waliKelas = await Pegawai.findByPk(wali_kelas_id);
        if (!waliKelas) {
          return res.status(400).json({
            success: false,
            message: 'Wali kelas tidak ditemukan'
          });
        }
      }

      // Check if kelas dengan nama yang sama sudah ada (excluding current kelas)
      if (nama_kelas && tingkat) {
        const existingKelas = await Kelas.findOne({ 
          where: { 
            nama_kelas,
            tingkat: parseInt(tingkat),
            id: { [Kelas.sequelize.Op.ne]: id }
          } 
        });
        if (existingKelas) {
          return res.status(400).json({
            success: false,
            message: `Kelas ${nama_kelas} tingkat ${tingkat} sudah ada`
          });
        }
      }

      await kelas.update({
        nama_kelas: nama_kelas || kelas.nama_kelas,
        tingkat: tingkat ? parseInt(tingkat) : kelas.tingkat,
        wali_kelas_id: wali_kelas_id ? parseInt(wali_kelas_id) : kelas.wali_kelas_id
      });

      // Get updated kelas
      const updatedKelas = await Kelas.findByPk(id, {
        include: [
          {
            model: Pegawai,
            as: 'wali_kelas',
            attributes: ['id', 'nama_lengkap', 'nip', 'jabatan']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Kelas berhasil diupdate',
        data: updatedKelas
      });

    } catch (error) {
      console.error('Update kelas error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Delete kelas
  deleteKelas: async (req, res) => {
    try {
      const { id } = req.params;

      const kelas = await Kelas.findByPk(id);
      if (!kelas) {
        return res.status(404).json({
          success: false,
          message: 'Kelas tidak ditemukan'
        });
      }

      // Check if kelas memiliki siswa
      const siswaCount = await SiswaDiKelas.count({ where: { kelas_id: id } });
      if (siswaCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Tidak dapat menghapus kelas yang masih memiliki siswa'
        });
      }

      await Kelas.destroy({ where: { id } });

      res.json({
        success: true,
        message: 'Kelas berhasil dihapus'
      });

    } catch (error) {
      console.error('Delete kelas error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Get kelas statistics
  getKelasStats: async (req, res) => {
    try {
      const totalKelas = await Kelas.count();
      
      // Count by tingkat
      const tingkatCounts = {};
      for (let i = 1; i <= 6; i++) {
        tingkatCounts[`tingkat_${i}`] = await Kelas.count({ where: { tingkat: i } });
      }

      // Count siswa per kelas
      const kelasWithSiswaCount = await Kelas.findAll({
        attributes: [
          'id',
          'nama_kelas',
          'tingkat',
          [Kelas.sequelize.fn('COUNT', Kelas.sequelize.col('siswa.id')), 'jumlah_siswa']
        ],
        include: [
          {
            model: Siswa,
            as: 'siswa',
            through: { attributes: [] },
            attributes: [],
            required: false
          }
        ],
        group: ['Kelas.id', 'Kelas.nama_kelas', 'Kelas.tingkat'],
        raw: true
      });

      res.json({
        success: true,
        data: {
          total_kelas: totalKelas,
          by_tingkat: tingkatCounts,
          detail_kelas: kelasWithSiswaCount
        }
      });
    } catch (error) {
      console.error('Get kelas stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Add siswa to kelas
  addSiswaToKelas: async (req, res) => {
    try {
      const { id: kelas_id } = req.params;
      const { siswa_id, semester_id } = req.body;

      // Validasi
      if (!siswa_id || !semester_id) {
        return res.status(400).json({
          success: false,
          message: 'Siswa ID dan Semester ID harus diisi'
        });
      }

      // Check if kelas exists
      const kelas = await Kelas.findByPk(kelas_id);
      if (!kelas) {
        return res.status(404).json({
          success: false,
          message: 'Kelas tidak ditemukan'
        });
      }

      // Check if siswa exists
      const siswa = await Siswa.findByPk(siswa_id);
      if (!siswa) {
        return res.status(404).json({
          success: false,
          message: 'Siswa tidak ditemukan'
        });
      }

      // Check if semester exists
      const semester = await Semester.findByPk(semester_id);
      if (!semester) {
        return res.status(404).json({
          success: false,
          message: 'Semester tidak ditemukan'
        });
      }

      // Check if siswa sudah di kelas lain di semester yang sama
      const existingAssignment = await SiswaDiKelas.findOne({
        where: {
          siswa_id,
          semester_id
        }
      });

      if (existingAssignment) {
        return res.status(400).json({
          success: false,
          message: 'Siswa sudah terdaftar di kelas lain pada semester ini'
        });
      }

      // Add siswa to kelas
      const siswaKelas = await SiswaDiKelas.create({
        siswa_id: parseInt(siswa_id),
        kelas_id: parseInt(kelas_id),
        semester_id: parseInt(semester_id)
      });

      res.status(201).json({
        success: true,
        message: 'Siswa berhasil ditambahkan ke kelas',
        data: siswaKelas
      });

    } catch (error) {
      console.error('Add siswa to kelas error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Remove siswa from kelas
  removeSiswaFromKelas: async (req, res) => {
    try {
      const { id: kelas_id, siswa_id } = req.params;
      const { semester_id } = req.body;

      if (!semester_id) {
        return res.status(400).json({
          success: false,
          message: 'Semester ID harus diisi'
        });
      }

      const result = await SiswaDiKelas.destroy({
        where: {
          siswa_id: parseInt(siswa_id),
          kelas_id: parseInt(kelas_id),
          semester_id: parseInt(semester_id)
        }
      });

      if (result === 0) {
        return res.status(404).json({
          success: false,
          message: 'Siswa tidak ditemukan di kelas ini'
        });
      }

      res.json({
        success: true,
        message: 'Siswa berhasil dikeluarkan dari kelas'
      });

    } catch (error) {
      console.error('Remove siswa from kelas error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  }
};

module.exports = kelasController;