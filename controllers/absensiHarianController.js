const { AbsensiHarian, Siswa, Semester, Kelas, SiswaDiKelas, Pengajaran, TahunAjaran } = require('../models');
const { Op } = require('sequelize');

const absensiHarianController = {
  // Get all absensi harian dengan pagination
  getAllAbsensiHarian: async (req, res) => {
    try {
      const { page = 1, limit = 10, siswa_id, semester_id, tanggal, status, kelas_id } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (siswa_id) whereClause.siswa_id = siswa_id;
      if (semester_id) whereClause.semester_id = semester_id;
      if (tanggal) whereClause.tanggal = tanggal;
      if (status) whereClause.status = status;

      // Jika filter by kelas, perlu join dengan SiswaDiKelas
      let includeClause = [
        {
          model: Siswa,
          as: 'siswa',
          attributes: ['id', 'nama_lengkap', 'nis', 'nisn']
        },
        {
          model: Semester,
          as: 'semester',
          attributes: ['id', 'nama', 'status'],
          include: [
            {
              model: TahunAjaran,
              as: 'tahun_ajaran',
              attributes: ['id', 'tahun']
            }
          ]
        }
      ];

      if (kelas_id) {
        includeClause[0].include = [
          {
            model: Kelas,
            as: 'kelas',
            through: {
              where: { kelas_id },
              attributes: []
            },
            attributes: ['id', 'nama_kelas'],
            required: true
          }
        ];
      }

      const absensiHarian = await AbsensiHarian.findAndCountAll({
        where: whereClause,
        include: includeClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['tanggal', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          absensi_harian: absensiHarian.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(absensiHarian.count / limit),
            totalItems: absensiHarian.count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get all absensi harian error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Get absensi harian by ID
  getAbsensiHarianById: async (req, res) => {
    try {
      const { id } = req.params;

      const absensiHarian = await AbsensiHarian.findByPk(id, {
        include: [
          {
            model: Siswa,
            as: 'siswa',
            attributes: ['id', 'nama_lengkap', 'nis', 'nisn', 'jenis_kelamin']
          },
          {
            model: Semester,
            as: 'semester',
            attributes: ['id', 'nama', 'status'],
            include: [
              {
                model: TahunAjaran,
                as: 'tahun_ajaran',
                attributes: ['id', 'tahun']
              }
            ]
          }
        ]
      });

      if (!absensiHarian) {
        return res.status(404).json({
          success: false,
          message: 'Data absensi tidak ditemukan'
        });
      }

      res.json({
        success: true,
        data: absensiHarian
      });
    } catch (error) {
      console.error('Get absensi harian by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Create new absensi harian
  createAbsensiHarian: async (req, res) => {
    try {
      const { 
        siswa_id, 
        tanggal, 
        status, 
        keterangan, 
        semester_id 
      } = req.body;

      // Validasi manual
      const errors = [];
      
      if (!siswa_id) errors.push('Siswa harus dipilih');
      if (!tanggal) errors.push('Tanggal harus diisi');
      if (!status) errors.push('Status absensi harus dipilih');
      if (!semester_id) errors.push('Semester harus dipilih');

      // Validasi status
      const statusValid = ['S', 'I', 'A']; // S=Sakit, I=Izin, A=Alpha
      if (status && !statusValid.includes(status)) {
        errors.push('Status harus S (Sakit), I (Izin), atau A (Alpha)');
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Data tidak valid',
          errors: errors
        });
      }

      // Check if siswa exists
      const siswa = await Siswa.findByPk(siswa_id);
      if (!siswa) {
        return res.status(400).json({
          success: false,
          message: 'Siswa tidak ditemukan'
        });
      }

      // Check if semester exists
      const semester = await Semester.findByPk(semester_id);
      if (!semester) {
        return res.status(400).json({
          success: false,
          message: 'Semester tidak ditemukan'
        });
      }

      // Check if absensi sudah ada untuk siswa di tanggal yang sama
      const existingAbsensi = await AbsensiHarian.findOne({
        where: {
          siswa_id,
          tanggal
        }
      });

      if (existingAbsensi) {
        return res.status(400).json({
          success: false,
          message: 'Absensi untuk siswa ini di tanggal tersebut sudah ada'
        });
      }

      // Create absensi harian
      const newAbsensiHarian = await AbsensiHarian.create({
        siswa_id: parseInt(siswa_id),
        tanggal,
        status,
        keterangan: keterangan || null,
        semester_id: parseInt(semester_id)
      });

      // Get created absensi harian with relations
      const createdAbsensiHarian = await AbsensiHarian.findByPk(newAbsensiHarian.id, {
        include: [
          {
            model: Siswa,
            as: 'siswa',
            attributes: ['id', 'nama_lengkap', 'nis', 'nisn']
          },
          {
            model: Semester,
            as: 'semester',
            attributes: ['id', 'nama']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Absensi harian berhasil dicatat',
        data: createdAbsensiHarian
      });

    } catch (error) {
      console.error('Create absensi harian error:', error);
      
      // Handle unique constraint errors
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Absensi untuk siswa ini di tanggal tersebut sudah ada'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Update absensi harian
  updateAbsensiHarian: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, keterangan } = req.body;

      const absensiHarian = await AbsensiHarian.findByPk(id);
      if (!absensiHarian) {
        return res.status(404).json({
          success: false,
          message: 'Data absensi tidak ditemukan'
        });
      }

      // Validasi status
      const statusValid = ['S', 'I', 'A'];
      if (status && !statusValid.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status harus S (Sakit), I (Izin), atau A (Alpha)'
        });
      }

      await absensiHarian.update({
        status: status || absensiHarian.status,
        keterangan: keterangan !== undefined ? keterangan : absensiHarian.keterangan
      });

      // Get updated absensi harian
      const updatedAbsensiHarian = await AbsensiHarian.findByPk(id, {
        include: [
          {
            model: Siswa,
            as: 'siswa',
            attributes: ['id', 'nama_lengkap', 'nis', 'nisn']
          },
          {
            model: Semester,
            as: 'semester',
            attributes: ['id', 'nama']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Absensi harian berhasil diupdate',
        data: updatedAbsensiHarian
      });

    } catch (error) {
      console.error('Update absensi harian error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Delete absensi harian
  deleteAbsensiHarian: async (req, res) => {
    try {
      const { id } = req.params;

      const absensiHarian = await AbsensiHarian.findByPk(id);
      if (!absensiHarian) {
        return res.status(404).json({
          success: false,
          message: 'Data absensi tidak ditemukan'
        });
      }

      await AbsensiHarian.destroy({ where: { id } });

      res.json({
        success: true,
        message: 'Absensi harian berhasil dihapus'
      });

    } catch (error) {
      console.error('Delete absensi harian error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Get absensi by kelas dan tanggal
  getAbsensiByKelas: async (req, res) => {
    try {
      const { kelas_id } = req.params;
      const { tanggal, semester_id } = req.query;

      if (!tanggal || !semester_id) {
        return res.status(400).json({
          success: false,
          message: 'Tanggal dan Semester ID harus diisi'
        });
      }

      // Get semua siswa di kelas tersebut untuk semester aktif
      const siswaDiKelas = await SiswaDiKelas.findAll({
        where: {
          kelas_id: parseInt(kelas_id),
          semester_id: parseInt(semester_id)
        },
        include: [
          {
            model: Siswa,
            as: 'siswa',
            attributes: ['id', 'nama_lengkap', 'nis', 'nisn']
          }
        ]
      });

      if (siswaDiKelas.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Tidak ada siswa di kelas ini untuk semester tersebut'
        });
      }

      // Get absensi untuk semua siswa di kelas tersebut pada tanggal tertentu
      const siswaIds = siswaDiKelas.map(sdk => sdk.siswa_id);
      
      const absensiHarian = await AbsensiHarian.findAll({
        where: {
          siswa_id: { [Op.in]: siswaIds },
          tanggal,
          semester_id: parseInt(semester_id)
        },
        include: [
          {
            model: Siswa,
            as: 'siswa',
            attributes: ['id', 'nama_lengkap', 'nis', 'nisn']
          }
        ]
      });

      // Format response: gabungkan data siswa dengan absensi mereka
      const result = siswaDiKelas.map(sdk => {
        const absensi = absensiHarian.find(a => a.siswa_id === sdk.siswa_id);
        return {
          siswa: sdk.siswa,
          absensi: absensi || null,
          status: absensi ? absensi.status : null,
          keterangan: absensi ? absensi.keterangan : null
        };
      });

      res.json({
        success: true,
        data: {
          kelas_id: parseInt(kelas_id),
          tanggal,
          semester_id: parseInt(semester_id),
          absensi: result
        }
      });

    } catch (error) {
      console.error('Get absensi by kelas error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Bulk create absensi (untuk input absensi kelas sekaligus)
  bulkCreateAbsensi: async (req, res) => {
    try {
      const { kelas_id, tanggal, semester_id, absensi_data } = req.body;

      // Validasi
      if (!kelas_id || !tanggal || !semester_id || !absensi_data) {
        return res.status(400).json({
          success: false,
          message: 'Kelas ID, Tanggal, Semester ID, dan Data Absensi harus diisi'
        });
      }

      // Check if semester exists
      const semester = await Semester.findByPk(semester_id);
      if (!semester) {
        return res.status(400).json({
          success: false,
          message: 'Semester tidak ditemukan'
        });
      }

      // Start transaction
      const transaction = await AbsensiHarian.sequelize.transaction();

      try {
        const results = [];
        const errors = [];

        for (const absensi of absensi_data) {
          const { siswa_id, status, keterangan } = absensi;

          // Check if siswa exists dan berada di kelas yang benar
          const siswaDiKelas = await SiswaDiKelas.findOne({
            where: {
              siswa_id: parseInt(siswa_id),
              kelas_id: parseInt(kelas_id),
              semester_id: parseInt(semester_id)
            },
            transaction
          });

          if (!siswaDiKelas) {
            errors.push(`Siswa ID ${siswa_id} tidak ditemukan di kelas ini`);
            continue;
          }

          // Check if absensi sudah ada
          const existingAbsensi = await AbsensiHarian.findOne({
            where: {
              siswa_id: parseInt(siswa_id),
              tanggal,
              semester_id: parseInt(semester_id)
            },
            transaction
          });

          if (existingAbsensi) {
            // Update existing absensi
            await existingAbsensi.update({
              status,
              keterangan: keterangan || null
            }, { transaction });
            results.push({ siswa_id, action: 'updated', absensi: existingAbsensi });
          } else {
            // Create new absensi
            const newAbsensi = await AbsensiHarian.create({
              siswa_id: parseInt(siswa_id),
              tanggal,
              status,
              keterangan: keterangan || null,
              semester_id: parseInt(semester_id)
            }, { transaction });
            results.push({ siswa_id, action: 'created', absensi: newAbsensi });
          }
        }

        await transaction.commit();

        res.status(201).json({
          success: true,
          message: `Absensi berhasil diproses: ${results.length} berhasil, ${errors.length} error`,
          data: {
            results,
            errors: errors.length > 0 ? errors : undefined
          }
        });

      } catch (error) {
        await transaction.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Bulk create absensi error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Get absensi statistics
  getAbsensiStats: async (req, res) => {
    try {
      const { semester_id, start_date, end_date, kelas_id } = req.query;

      if (!semester_id) {
        return res.status(400).json({
          success: false,
          message: 'Semester ID harus diisi'
        });
      }

      const whereClause = {
        semester_id: parseInt(semester_id)
      };

      if (start_date && end_date) {
        whereClause.tanggal = {
          [Op.between]: [start_date, end_date]
        };
      }

      // Jika filter by kelas, perlu join dengan SiswaDiKelas
      let includeClause = [
        {
          model: Siswa,
          as: 'siswa',
          attributes: ['id'],
          required: true
        }
      ];

      if (kelas_id) {
        includeClause[0].include = [
          {
            model: Kelas,
            as: 'kelas',
            through: {
              where: { kelas_id: parseInt(kelas_id) },
              attributes: []
            },
            attributes: [],
            required: true
          }
        ];
      }

      const totalAbsensi = await AbsensiHarian.count({
        where: whereClause,
        include: includeClause
      });

      const sakitCount = await AbsensiHarian.count({
        where: { ...whereClause, status: 'S' },
        include: includeClause
      });

      const izinCount = await AbsensiHarian.count({
        where: { ...whereClause, status: 'I' },
        include: includeClause
      });

      const alphaCount = await AbsensiHarian.count({
        where: { ...whereClause, status: 'A' },
        include: includeClause
      });

      res.json({
        success: true,
        data: {
          total_absensi: totalAbsensi,
          by_status: {
            sakit: sakitCount,
            izin: izinCount,
            alpha: alphaCount
          },
          persentase: {
            sakit: totalAbsensi > 0 ? ((sakitCount / totalAbsensi) * 100).toFixed(2) : 0,
            izin: totalAbsensi > 0 ? ((izinCount / totalAbsensi) * 100).toFixed(2) : 0,
            alpha: totalAbsensi > 0 ? ((alphaCount / totalAbsensi) * 100).toFixed(2) : 0
          }
        }
      });

    } catch (error) {
      console.error('Get absensi stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  }
};

module.exports = absensiHarianController;