const { MataPelajaran, Pengajaran, Kelas, Pegawai, NilaiRapor } = require('../models');
const { Op } = require('sequelize');

const mataPelajaranController = {
  // Get all mata pelajaran dengan pagination
  getAllMataPelajaran: async (req, res) => {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (search) {
        whereClause[Op.or] = [
          { kode_mapel: { [Op.iLike]: `%${search}%` } },
          { nama_mapel: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const mataPelajaran = await MataPelajaran.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['kode_mapel', 'ASC']]
      });

      res.json({
        success: true,
        data: {
          mata_pelajaran: mataPelajaran.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(mataPelajaran.count / limit),
            totalItems: mataPelajaran.count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get all mata pelajaran error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Get mata pelajaran by ID
  getMataPelajaranById: async (req, res) => {
    try {
      const { id } = req.params;

      const mataPelajaran = await MataPelajaran.findByPk(id, {
        include: [
          {
            model: Pengajaran,
            as: 'pengajaran',
            include: [
              {
                model: Kelas,
                as: 'kelas',
                attributes: ['id', 'nama_kelas', 'tingkat']
              },
              {
                model: Pegawai,
                as: 'guru',
                attributes: ['id', 'nama_lengkap', 'nip']
              }
            ],
            required: false
          }
        ]
      });

      if (!mataPelajaran) {
        return res.status(404).json({
          success: false,
          message: 'Mata pelajaran tidak ditemukan'
        });
      }

      res.json({
        success: true,
        data: mataPelajaran
      });
    } catch (error) {
      console.error('Get mata pelajaran by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Create new mata pelajaran
  createMataPelajaran: async (req, res) => {
    try {
      const { kode_mapel, nama_mapel } = req.body;

      // Validasi manual
      const errors = [];
      
      if (!kode_mapel) errors.push('Kode mapel harus diisi');
      if (!nama_mapel) errors.push('Nama mapel harus diisi');

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Data tidak valid',
          errors: errors
        });
      }

      // Check if kode_mapel already exists
      const existingKode = await MataPelajaran.findOne({ where: { kode_mapel } });
      if (existingKode) {
        return res.status(400).json({
          success: false,
          message: 'Kode mapel sudah digunakan'
        });
      }

      // Check if nama_mapel already exists
      const existingNama = await MataPelajaran.findOne({ where: { nama_mapel } });
      if (existingNama) {
        return res.status(400).json({
          success: false,
          message: 'Nama mapel sudah digunakan'
        });
      }

      // Create mata pelajaran
      const newMataPelajaran = await MataPelajaran.create({
        kode_mapel: kode_mapel.toUpperCase(),
        nama_mapel
      });

      res.status(201).json({
        success: true,
        message: 'Mata pelajaran berhasil dibuat',
        data: newMataPelajaran
      });

    } catch (error) {
      console.error('Create mata pelajaran error:', error);
      
      // Handle unique constraint errors
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0]?.path;
        if (field === 'kode_mapel') {
          return res.status(400).json({
            success: false,
            message: 'Kode mapel sudah digunakan'
          });
        } else if (field === 'nama_mapel') {
          return res.status(400).json({
            success: false,
            message: 'Nama mapel sudah digunakan'
          });
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Update mata pelajaran
  updateMataPelajaran: async (req, res) => {
    try {
      const { id } = req.params;
      const { kode_mapel, nama_mapel } = req.body;

      const mataPelajaran = await MataPelajaran.findByPk(id);
      if (!mataPelajaran) {
        return res.status(404).json({
          success: false,
          message: 'Mata pelajaran tidak ditemukan'
        });
      }

      // Check if kode_mapel already exists (excluding current)
      if (kode_mapel && kode_mapel !== mataPelajaran.kode_mapel) {
        const existingKode = await MataPelajaran.findOne({ 
          where: { kode_mapel },
          attributes: ['id']
        });
        if (existingKode) {
          return res.status(400).json({
            success: false,
            message: 'Kode mapel sudah digunakan'
          });
        }
      }

      // Check if nama_mapel already exists (excluding current)
      if (nama_mapel && nama_mapel !== mataPelajaran.nama_mapel) {
        const existingNama = await MataPelajaran.findOne({ 
          where: { nama_mapel },
          attributes: ['id']
        });
        if (existingNama) {
          return res.status(400).json({
            success: false,
            message: 'Nama mapel sudah digunakan'
          });
        }
      }

      await mataPelajaran.update({
        kode_mapel: kode_mapel ? kode_mapel.toUpperCase() : mataPelajaran.kode_mapel,
        nama_mapel: nama_mapel || mataPelajaran.nama_mapel
      });

      res.json({
        success: true,
        message: 'Mata pelajaran berhasil diupdate',
        data: mataPelajaran
      });

    } catch (error) {
      console.error('Update mata pelajaran error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Delete mata pelajaran
  deleteMataPelajaran: async (req, res) => {
    try {
      const { id } = req.params;

      const mataPelajaran = await MataPelajaran.findByPk(id);
      if (!mataPelajaran) {
        return res.status(404).json({
          success: false,
          message: 'Mata pelajaran tidak ditemukan'
        });
      }

      // Check if mata pelajaran digunakan di pengajaran
      const pengajaranCount = await Pengajaran.count({ where: { mapel_id: id } });
      if (pengajaranCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Tidak dapat menghapus mata pelajaran yang masih digunakan dalam pengajaran'
        });
      }

      // Check if mata pelajaran digunakan di nilai rapor
      const nilaiRaporCount = await NilaiRapor.count({ where: { mapel_id: id } });
      if (nilaiRaporCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Tidak dapat menghapus mata pelajaran yang masih digunakan dalam nilai rapor'
        });
      }

      await MataPelajaran.destroy({ where: { id } });

      res.json({
        success: true,
        message: 'Mata pelajaran berhasil dihapus'
      });

    } catch (error) {
      console.error('Delete mata pelajaran error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Get mata pelajaran statistics
  getMataPelajaranStats: async (req, res) => {
    try {
      const totalMapel = await MataPelajaran.count();

      // Count pengajaran per mata pelajaran
      const mapelWithPengajaranCount = await MataPelajaran.findAll({
        attributes: [
          'id',
          'kode_mapel',
          'nama_mapel',
          [MataPelajaran.sequelize.fn('COUNT', MataPelajaran.sequelize.col('pengajaran.id')), 'jumlah_pengajaran']
        ],
        include: [
          {
            model: Pengajaran,
            as: 'pengajaran',
            attributes: [],
            required: false
          }
        ],
        group: ['MataPelajaran.id', 'MataPelajaran.kode_mapel', 'MataPelajaran.nama_mapel'],
        raw: true
      });

      res.json({
        success: true,
        data: {
          total_mapel: totalMapel,
          detail_mapel: mapelWithPengajaranCount
        }
      });
    } catch (error) {
      console.error('Get mata pelajaran stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Search mata pelajaran
  searchMataPelajaran: async (req, res) => {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Query pencarian harus diisi'
        });
      }

      const mataPelajaran = await MataPelajaran.findAll({
        where: {
          [Op.or]: [
            { kode_mapel: { [Op.iLike]: `%${q}%` } },
            { nama_mapel: { [Op.iLike]: `%${q}%` } }
          ]
        },
        limit: 10,
        order: [['kode_mapel', 'ASC']]
      });

      res.json({
        success: true,
        data: mataPelajaran
      });
    } catch (error) {
      console.error('Search mata pelajaran error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  }
};

module.exports = mataPelajaranController;