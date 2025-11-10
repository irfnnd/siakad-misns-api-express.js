const { TahunAjaran, Semester } = require('../models');
const { Op } = require('sequelize');

const tahunAjaranController = {
  // Get all tahun ajaran dengan pagination
  getAllTahunAjaran: async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (status) whereClause.status = status;

      const tahunAjaran = await TahunAjaran.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Semester,
            as: 'semesters',
            attributes: ['id', 'nama', 'status'],
            required: false
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['tahun', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          tahun_ajaran: tahunAjaran.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(tahunAjaran.count / limit),
            totalItems: tahunAjaran.count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get all tahun ajaran error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Get tahun ajaran by ID
  getTahunAjaranById: async (req, res) => {
    try {
      const { id } = req.params;

      const tahunAjaran = await TahunAjaran.findByPk(id, {
        include: [
          {
            model: Semester,
            as: 'semesters',
            required: false
          }
        ]
      });

      if (!tahunAjaran) {
        return res.status(404).json({
          success: false,
          message: 'Tahun ajaran tidak ditemukan'
        });
      }

      res.json({
        success: true,
        data: tahunAjaran
      });
    } catch (error) {
      console.error('Get tahun ajaran by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Create new tahun ajaran
  createTahunAjaran: async (req, res) => {
    try {
      const { tahun } = req.body;

      // Validasi manual
      const errors = [];
      
      if (!tahun) errors.push('Tahun ajaran harus diisi');
      
      // Validasi format tahun: 2024/2025
      if (tahun && !/^\d{4}\/\d{4}$/.test(tahun)) {
        errors.push('Format tahun ajaran harus YYYY/YYYY (contoh: 2024/2025)');
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Data tidak valid',
          errors: errors
        });
      }

      // Check if tahun ajaran already exists
      const existingTahunAjaran = await TahunAjaran.findOne({ where: { tahun } });
      if (existingTahunAjaran) {
        return res.status(400).json({
          success: false,
          message: 'Tahun ajaran sudah ada'
        });
      }

      // Create tahun ajaran
      const newTahunAjaran = await TahunAjaran.create({
        tahun,
        status: 'Nonaktif' // Default nonaktif, harus diaktifkan manual
      });

      // Buat semester otomatis (Ganjil dan Genap)
      const semesterGanjil = await Semester.create({
        tahun_ajaran_id: newTahunAjaran.id,
        nama: 'Ganjil',
        status: 'Nonaktif'
      });

      const semesterGenap = await Semester.create({
        tahun_ajaran_id: newTahunAjaran.id,
        nama: 'Genap',
        status: 'Nonaktif'
      });

      // Get created tahun ajaran with semesters
      const createdTahunAjaran = await TahunAjaran.findByPk(newTahunAjaran.id, {
        include: [
          {
            model: Semester,
            as: 'semesters',
            required: false
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Tahun ajaran berhasil dibuat dengan semester Ganjil dan Genap',
        data: createdTahunAjaran
      });

    } catch (error) {
      console.error('Create tahun ajaran error:', error);
      
      // Handle unique constraint errors
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Tahun ajaran sudah ada'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Update tahun ajaran
  updateTahunAjaran: async (req, res) => {
    try {
      const { id } = req.params;
      const { tahun, status } = req.body;

      const tahunAjaran = await TahunAjaran.findByPk(id);
      if (!tahunAjaran) {
        return res.status(404).json({
          success: false,
          message: 'Tahun ajaran tidak ditemukan'
        });
      }

      // Validasi format tahun
      if (tahun && !/^\d{4}\/\d{4}$/.test(tahun)) {
        return res.status(400).json({
          success: false,
          message: 'Format tahun ajaran harus YYYY/YYYY (contoh: 2024/2025)'
        });
      }

      // Check if tahun already exists (excluding current)
      if (tahun && tahun !== tahunAjaran.tahun) {
        const existingTahun = await TahunAjaran.findOne({ 
          where: { tahun },
          attributes: ['id']
        });
        if (existingTahun) {
          return res.status(400).json({
            success: false,
            message: 'Tahun ajaran sudah digunakan'
          });
        }
      }

      await tahunAjaran.update({
        tahun: tahun || tahunAjaran.tahun,
        status: status || tahunAjaran.status
      });

      // Get updated tahun ajaran
      const updatedTahunAjaran = await TahunAjaran.findByPk(id, {
        include: [
          {
            model: Semester,
            as: 'semesters',
            required: false
          }
        ]
      });

      res.json({
        success: true,
        message: 'Tahun ajaran berhasil diupdate',
        data: updatedTahunAjaran
      });

    } catch (error) {
      console.error('Update tahun ajaran error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Aktifkan tahun ajaran (nonaktifkan yang lain)
  activateTahunAjaran: async (req, res) => {
    try {
      const { id } = req.params;

      const tahunAjaran = await TahunAjaran.findByPk(id);
      if (!tahunAjaran) {
        return res.status(404).json({
          success: false,
          message: 'Tahun ajaran tidak ditemukan'
        });
      }

      // Start transaction
      const transaction = await TahunAjaran.sequelize.transaction();

      try {
        // Nonaktifkan semua tahun ajaran
        await TahunAjaran.update(
          { status: 'Nonaktif' },
          { where: {}, transaction }
        );

        // Aktifkan tahun ajaran yang dipilih
        await tahunAjaran.update({ status: 'Aktif' }, { transaction });

        await transaction.commit();

        res.json({
          success: true,
          message: 'Tahun ajaran berhasil diaktifkan'
        });

      } catch (error) {
        await transaction.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Activate tahun ajaran error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Delete tahun ajaran
  deleteTahunAjaran: async (req, res) => {
    try {
      const { id } = req.params;

      const tahunAjaran = await TahunAjaran.findByPk(id);
      if (!tahunAjaran) {
        return res.status(404).json({
          success: false,
          message: 'Tahun ajaran tidak ditemukan'
        });
      }

      // Check if tahun ajaran aktif
      if (tahunAjaran.status === 'Aktif') {
        return res.status(400).json({
          success: false,
          message: 'Tidak dapat menghapus tahun ajaran yang sedang aktif'
        });
      }

      // Check if ada data terkait (semester, dll)
      const semesterCount = await Semester.count({ where: { tahun_ajaran_id: id } });
      if (semesterCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Tidak dapat menghapus tahun ajaran yang masih memiliki semester'
        });
      }

      await TahunAjaran.destroy({ where: { id } });

      res.json({
        success: true,
        message: 'Tahun ajaran berhasil dihapus'
      });

    } catch (error) {
      console.error('Delete tahun ajaran error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Get tahun ajaran statistics
  getTahunAjaranStats: async (req, res) => {
    try {
      const totalTahunAjaran = await TahunAjaran.count();
      const aktifTahunAjaran = await TahunAjaran.count({ where: { status: 'Aktif' } });
      const nonaktifTahunAjaran = await TahunAjaran.count({ where: { status: 'Nonaktif' } });

      // Tahun ajaran aktif saat ini
      const tahunAjaranAktif = await TahunAjaran.findOne({ 
        where: { status: 'Aktif' },
        include: [
          {
            model: Semester,
            as: 'semesters',
            required: false
          }
        ]
      });

      res.json({
        success: true,
        data: {
          total_tahun_ajaran: totalTahunAjaran,
          by_status: {
            aktif: aktifTahunAjaran,
            nonaktif: nonaktifTahunAjaran
          },
          tahun_ajaran_aktif: tahunAjaranAktif
        }
      });
    } catch (error) {
      console.error('Get tahun ajaran stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Get tahun ajaran aktif
  getActiveTahunAjaran: async (req, res) => {
    try {
      const tahunAjaranAktif = await TahunAjaran.findOne({ 
        where: { status: 'Aktif' },
        include: [
          {
            model: Semester,
            as: 'semesters',
            required: false
          }
        ]
      });

      if (!tahunAjaranAktif) {
        return res.status(404).json({
          success: false,
          message: 'Tidak ada tahun ajaran yang aktif'
        });
      }

      res.json({
        success: true,
        data: tahunAjaranAktif
      });
    } catch (error) {
      console.error('Get active tahun ajaran error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  }
};

module.exports = tahunAjaranController;