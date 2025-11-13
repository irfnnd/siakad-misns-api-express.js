const { JadwalPelajaran, Kelas, MataPelajaran, Pegawai, Semester, TahunAjaran } = require('../models');
const { Op } = require('sequelize');

const jadwalPelajaranController = {
  // Get all jadwal pelajaran dengan pagination
  getAllJadwalPelajaran: async (req, res) => {
    try {
      const { page = 1, limit = 10, kelas_id, semester_id, hari, guru_id } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (kelas_id) whereClause.kelas_id = kelas_id;
      if (semester_id) whereClause.semester_id = semester_id;
      if (hari) whereClause.hari = hari;
      if (guru_id) whereClause.guru_id = guru_id;

      const jadwalPelajaran = await JadwalPelajaran.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Kelas,
            as: 'kelas',
            attributes: ['id', 'nama_kelas', 'tingkat']
          },
          {
            model: MataPelajaran,
            as: 'mata_pelajaran_jadwal',
            attributes: ['id', 'kode_mapel', 'nama_mapel']
          },
          {
            model: Pegawai,
            as: 'guru',
            attributes: ['id', 'nama_lengkap', 'nip']
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
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [
          ['hari', 'ASC'],
          ['jam_mulai', 'ASC']
        ]
      });

      res.json({
        success: true,
        data: {
          jadwal_pelajaran: jadwalPelajaran.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(jadwalPelajaran.count / limit),
            totalItems: jadwalPelajaran.count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get all jadwal pelajaran error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Get jadwal pelajaran by ID
  getJadwalPelajaranById: async (req, res) => {
    try {
      const { id } = req.params;

      const jadwalPelajaran = await JadwalPelajaran.findByPk(id, {
        include: [
          {
            model: Kelas,
            as: 'kelas',
            attributes: { exclude: ['wali_kelas_id'] }
          },
          {
            model: MataPelajaran,
            as: 'mata_pelajaran_jadwal',
            attributes: ['id', 'kode_mapel', 'nama_mapel']
          },
          {
            model: Pegawai,
            as: 'guru',
            attributes: ['id', 'nama_lengkap', 'nip', 'jabatan']
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

      if (!jadwalPelajaran) {
        return res.status(404).json({
          success: false,
          message: 'Jadwal pelajaran tidak ditemukan'
        });
      }

      res.json({
        success: true,
        data: jadwalPelajaran
      });
    } catch (error) {
      console.error('Get jadwal pelajaran by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Create new jadwal pelajaran
  createJadwalPelajaran: async (req, res) => {
    try {
      const { 
        kelas_id, 
        mapel_id, 
        guru_id, 
        semester_id, 
        hari, 
        jam_mulai, 
        jam_selesai 
      } = req.body;

      // Validasi manual
      const errors = [];
      
      if (!kelas_id) errors.push('Kelas harus dipilih');
      if (!mapel_id) errors.push('Mata pelajaran harus dipilih');
      if (!guru_id) errors.push('Guru harus dipilih');
      if (!semester_id) errors.push('Semester harus dipilih');
      if (!hari) errors.push('Hari harus dipilih');
      if (!jam_mulai) errors.push('Jam mulai harus diisi');
      if (!jam_selesai) errors.push('Jam selesai harus diisi');

      // Validasi hari
      const hariValid = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      if (hari && !hariValid.includes(hari)) {
        errors.push('Hari harus Senin, Selasa, Rabu, Kamis, Jumat, atau Sabtu');
      }

      // Validasi waktu
      if (jam_mulai && jam_selesai && jam_mulai >= jam_selesai) {
        errors.push('Jam mulai harus sebelum jam selesai');
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Data tidak valid',
          errors: errors
        });
      }

      // Check if kelas exists
      const kelas = await Kelas.findByPk(kelas_id);
      if (!kelas) {
        return res.status(400).json({
          success: false,
          message: 'Kelas tidak ditemukan'
        });
      }

      // Check if mata pelajaran exists
      const mataPelajaran = await MataPelajaran.findByPk(mapel_id);
      if (!mataPelajaran) {
        return res.status(400).json({
          success: false,
          message: 'Mata pelajaran tidak ditemukan'
        });
      }

      // Check if guru exists
      const guru = await Pegawai.findByPk(guru_id);
      if (!guru) {
        return res.status(400).json({
          success: false,
          message: 'Guru tidak ditemukan'
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

      // Check for schedule conflict (guru di waktu yang sama)
      const guruConflict = await JadwalPelajaran.findOne({
        where: {
          guru_id,
          hari,
          semester_id,
          [Op.or]: [
            {
              jam_mulai: { [Op.between]: [jam_mulai, jam_selesai] }
            },
            {
              jam_selesai: { [Op.between]: [jam_mulai, jam_selesai] }
            },
            {
              [Op.and]: [
                { jam_mulai: { [Op.lte]: jam_mulai } },
                { jam_selesai: { [Op.gte]: jam_selesai } }
              ]
            }
          ]
        }
      });

      if (guruConflict) {
        return res.status(400).json({
          success: false,
          message: 'Guru sudah memiliki jadwal di waktu yang sama'
        });
      }

      // Check for schedule conflict (kelas di waktu yang sama)
      const kelasConflict = await JadwalPelajaran.findOne({
        where: {
          kelas_id,
          hari,
          semester_id,
          [Op.or]: [
            {
              jam_mulai: { [Op.between]: [jam_mulai, jam_selesai] }
            },
            {
              jam_selesai: { [Op.between]: [jam_mulai, jam_selesai] }
            },
            {
              [Op.and]: [
                { jam_mulai: { [Op.lte]: jam_mulai } },
                { jam_selesai: { [Op.gte]: jam_selesai } }
              ]
            }
          ]
        }
      });

      if (kelasConflict) {
        return res.status(400).json({
          success: false,
          message: 'Kelas sudah memiliki jadwal di waktu yang sama'
        });
      }

      // Create jadwal pelajaran
      const newJadwalPelajaran = await JadwalPelajaran.create({
        kelas_id: parseInt(kelas_id),
        mapel_id: parseInt(mapel_id),
        guru_id: parseInt(guru_id),
        semester_id: parseInt(semester_id),
        hari,
        jam_mulai,
        jam_selesai
      });

      // Get created jadwal pelajaran with relations
      const createdJadwalPelajaran = await JadwalPelajaran.findByPk(newJadwalPelajaran.id, {
        include: [
          {
            model: Kelas,
            as: 'kelas',
            attributes: ['id', 'nama_kelas', 'tingkat']
          },
          {
            model: MataPelajaran,
            as: 'mata_pelajaran_jadwal',
            attributes: ['id', 'kode_mapel', 'nama_mapel']
          },
          {
            model: Pegawai,
            as: 'guru',
            attributes: ['id', 'nama_lengkap', 'nip']
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
        message: 'Jadwal pelajaran berhasil dibuat',
        data: createdJadwalPelajaran
      });

    } catch (error) {
      console.error('Create jadwal pelajaran error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

// Update jadwal pelajaran dengan validasi lengkap
  updateJadwalPelajaran: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        kelas_id, 
        mapel_id, 
        guru_id, 
        semester_id, 
        hari, 
        jam_mulai, 
        jam_selesai 
      } = req.body;

      const jadwalPelajaran = await JadwalPelajaran.findByPk(id);
      if (!jadwalPelajaran) {
        return res.status(404).json({
          success: false,
          message: 'Jadwal pelajaran tidak ditemukan'
        });
      }

      // Validasi hari
      const hariValid = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      if (hari && !hariValid.includes(hari)) {
        return res.status(400).json({
          success: false,
          message: 'Hari harus Senin, Selasa, Rabu, Kamis, Jumat, atau Sabtu'
        });
      }

      // Validasi waktu
      if (jam_mulai && jam_selesai && jam_mulai >= jam_selesai) {
        return res.status(400).json({
          success: false,
          message: 'Jam mulai harus sebelum jam selesai'
        });
      }

      // ✅ TAMBAHKAN VALIDASI: Check if guru exists jika guru_id diupdate
      if (guru_id) {
        const guru = await Pegawai.findByPk(guru_id);
        if (!guru) {
          return res.status(400).json({
            success: false,
            message: 'Guru tidak ditemukan'
          });
        }
      }

      // ✅ TAMBAHKAN VALIDASI: Check if mata pelajaran exists jika mapel_id diupdate
      if (mapel_id) {
        const mataPelajaran = await MataPelajaran.findByPk(mapel_id);
        if (!mataPelajaran) {
          return res.status(400).json({
            success: false,
            message: 'Mata pelajaran tidak ditemukan'
          });
        }
      }

      // ✅ TAMBAHKAN VALIDASI: Check if kelas exists jika kelas_id diupdate
      if (kelas_id) {
        const kelas = await Kelas.findByPk(kelas_id);
        if (!kelas) {
          return res.status(400).json({
            success: false,
            message: 'Kelas tidak ditemukan'
          });
        }
      }

      // ✅ TAMBAHKAN VALIDASI: Check if semester exists jika semester_id diupdate
      if (semester_id) {
        const semester = await Semester.findByPk(semester_id);
        if (!semester) {
          return res.status(400).json({
            success: false,
            message: 'Semester tidak ditemukan'
          });
        }
      }

      // Check for schedule conflict (excluding current jadwal)
      if ((guru_id || jadwalPelajaran.guru_id) && (hari || jadwalPelajaran.hari) && 
          (jam_mulai || jadwalPelajaran.jam_mulai) && (jam_selesai || jadwalPelajaran.jam_selesai)) {
        
        const finalGuruId = guru_id || jadwalPelajaran.guru_id;
        const finalHari = hari || jadwalPelajaran.hari;
        const finalJamMulai = jam_mulai || jadwalPelajaran.jam_mulai;
        const finalJamSelesai = jam_selesai || jadwalPelajaran.jam_selesai;
        const finalSemesterId = semester_id || jadwalPelajaran.semester_id;

        const guruConflict = await JadwalPelajaran.findOne({
          where: {
            guru_id: finalGuruId,
            hari: finalHari,
            semester_id: finalSemesterId,
            id: { [Op.ne]: id },
            [Op.or]: [
              {
                jam_mulai: { [Op.between]: [finalJamMulai, finalJamSelesai] }
              },
              {
                jam_selesai: { [Op.between]: [finalJamMulai, finalJamSelesai] }
              },
              {
                [Op.and]: [
                  { jam_mulai: { [Op.lte]: finalJamMulai } },
                  { jam_selesai: { [Op.gte]: finalJamSelesai } }
                ]
              }
            ]
          }
        });

        if (guruConflict) {
          return res.status(400).json({
            success: false,
            message: 'Guru sudah memiliki jadwal di waktu yang sama'
          });
        }
      }

      await jadwalPelajaran.update({
        kelas_id: kelas_id ? parseInt(kelas_id) : jadwalPelajaran.kelas_id,
        mapel_id: mapel_id ? parseInt(mapel_id) : jadwalPelajaran.mapel_id,
        guru_id: guru_id ? parseInt(guru_id) : jadwalPelajaran.guru_id,
        semester_id: semester_id ? parseInt(semester_id) : jadwalPelajaran.semester_id,
        hari: hari || jadwalPelajaran.hari,
        jam_mulai: jam_mulai || jadwalPelajaran.jam_mulai,
        jam_selesai: jam_selesai || jadwalPelajaran.jam_selesai
      });

      // Get updated jadwal pelajaran
      const updatedJadwalPelajaran = await JadwalPelajaran.findByPk(id, {
        include: [
          {
            model: Kelas,
            as: 'kelas',
            attributes: ['id', 'nama_kelas', 'tingkat']
          },
          {
            model: MataPelajaran,
            as: 'mata_pelajaran_jadwal',
            attributes: ['id', 'kode_mapel', 'nama_mapel']
          },
          {
            model: Pegawai,
            as: 'guru',
            attributes: ['id', 'nama_lengkap', 'nip']
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
        message: 'Jadwal pelajaran berhasil diupdate',
        data: updatedJadwalPelajaran
      });

    } catch (error) {
      console.error('Update jadwal pelajaran error:', error);
      
      // ✅ TAMBAHKAN ERROR HANDLING untuk foreign key constraint
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        const constraint = error.index;
        if (constraint === 'jadwal_pelajaran_guru_id_fkey') {
          return res.status(400).json({
            success: false,
            message: 'Guru tidak ditemukan'
          });
        } else if (constraint === 'jadwal_pelajaran_kelas_id_fkey') {
          return res.status(400).json({
            success: false,
            message: 'Kelas tidak ditemukan'
          });
        } else if (constraint === 'jadwal_pelajaran_mapel_id_fkey') {
          return res.status(400).json({
            success: false,
            message: 'Mata pelajaran tidak ditemukan'
          });
        } else if (constraint === 'jadwal_pelajaran_semester_id_fkey') {
          return res.status(400).json({
            success: false,
            message: 'Semester tidak ditemukan'
          });
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Delete jadwal pelajaran
  deleteJadwalPelajaran: async (req, res) => {
    try {
      const { id } = req.params;

      const jadwalPelajaran = await JadwalPelajaran.findByPk(id);
      if (!jadwalPelajaran) {
        return res.status(404).json({
          success: false,
          message: 'Jadwal pelajaran tidak ditemukan'
        });
      }

      await JadwalPelajaran.destroy({ where: { id } });

      res.json({
        success: true,
        message: 'Jadwal pelajaran berhasil dihapus'
      });

    } catch (error) {
      console.error('Delete jadwal pelajaran error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Get jadwal pelajaran by kelas
  getJadwalByKelas: async (req, res) => {
    try {
      const { kelas_id } = req.params;
      const { semester_id } = req.query;

      if (!semester_id) {
        return res.status(400).json({
          success: false,
          message: 'Semester ID harus diisi'
        });
      }

      const jadwalPelajaran = await JadwalPelajaran.findAll({
        where: {
          kelas_id: parseInt(kelas_id),
          semester_id: parseInt(semester_id)
        },
        include: [
          {
            model: MataPelajaran,
            as: 'mata_pelajaran_jadwal',
            attributes: ['id', 'kode_mapel', 'nama_mapel']
          },
          {
            model: Pegawai,
            as: 'guru',
            attributes: ['id', 'nama_lengkap', 'nip']
          }
        ],
        order: [
          ['hari', 'ASC'],
          ['jam_mulai', 'ASC']
        ]
      });

      res.json({
        success: true,
        data: jadwalPelajaran
      });
    } catch (error) {
      console.error('Get jadwal by kelas error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Get jadwal pelajaran by guru
  getJadwalByGuru: async (req, res) => {
    try {
      const { guru_id } = req.params;
      const { semester_id } = req.query;

      if (!semester_id) {
        return res.status(400).json({
          success: false,
          message: 'Semester ID harus diisi'
        });
      }

      const jadwalPelajaran = await JadwalPelajaran.findAll({
        where: {
          guru_id: parseInt(guru_id),
          semester_id: parseInt(semester_id)
        },
        include: [
          {
            model: Kelas,
            as: 'kelas',
            attributes: ['id', 'nama_kelas', 'tingkat']
          },
          {
            model: MataPelajaran,
            as: 'mata_pelajaran_jadwal',
            attributes: ['id', 'kode_mapel', 'nama_mapel']
          },
          {
            model: Semester,
            as: 'semester',
            attributes: ['id', 'nama']
          }
        ],
        order: [
          ['hari', 'ASC'],
          ['jam_mulai', 'ASC']
        ]
      });

      res.json({
        success: true,
        data: jadwalPelajaran
      });
    } catch (error) {
      console.error('Get jadwal by guru error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Get jadwal pelajaran statistics
  getJadwalPelajaranStats: async (req, res) => {
    try {
      const totalJadwal = await JadwalPelajaran.count();

      // Count by hari
      const hariCounts = {};
      const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      
      for (const hari of hariList) {
        hariCounts[hari.toLowerCase()] = await JadwalPelajaran.count({ 
          where: { hari } 
        });
      }

      res.json({
        success: true,
        data: {
          total_jadwal: totalJadwal,
          by_hari: hariCounts
        }
      });
    } catch (error) {
      console.error('Get jadwal pelajaran stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  }
};

module.exports = jadwalPelajaranController;