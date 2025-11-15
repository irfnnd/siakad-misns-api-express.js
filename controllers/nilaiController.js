const { Nilai, Penilaian, Siswa, Pengajaran, MataPelajaran, Kelas, Semester, SiswaDiKelas } = require('../models');
const { Op } = require('sequelize');

const getAllNilai = async (req, res) => {
  try {
    const { page = 1, limit = 10, penilaian_id, siswa_id, pengajaran_id, tipe, kelas_id, semester_id } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (penilaian_id) whereClause.penilaian_id = penilaian_id;
    if (siswa_id) whereClause.siswa_id = siswa_id;

    const includeClause = [
      {
        model: Penilaian,
        as: 'penilaian',
        attributes: ['id', 'nama_penilaian', 'tipe'],
        where: tipe ? { tipe } : undefined,
        include: [
          {
            model: Pengajaran,
            as: 'pengajaran',
            attributes: ['id'],
            where: pengajaran_id ? { id: pengajaran_id } : undefined,
            include: [
              {
                model: MataPelajaran,
                as: 'mata_pelajaran',
                attributes: ['id', 'kode_mapel', 'nama_mapel']
              },
              {
                model: Kelas,
                as: 'kelas',
                attributes: ['id', 'nama_kelas', 'tingkat'],
                where: kelas_id ? { id: kelas_id } : undefined
              },
              {
                model: Semester,
                as: 'semester',
                attributes: ['id', 'nama', 'status'],
                where: semester_id ? { id: semester_id } : undefined
              }
            ]
          }
        ]
      },
      {
        model: Siswa,
        as: 'siswa',
        attributes: ['id', 'nama_lengkap', 'nis', 'nisn', 'jenis_kelamin']
      }
    ];

    const nilai = await Nilai.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['siswa', 'nama_lengkap', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        nilai: nilai.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(nilai.count / limit),
          totalItems: nilai.count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all nilai error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const getNilaiById = async (req, res) => {
  try {
    const { id } = req.params;

    const nilai = await Nilai.findByPk(id, {
      include: [
        {
          model: Penilaian,
          as: 'penilaian',
          attributes: ['id', 'nama_penilaian', 'tipe'],
          include: [
            {
              model: Pengajaran,
              as: 'pengajaran',
              attributes: ['id'],
              include: [
                {
                  model: MataPelajaran,
                  as: 'mata_pelajaran',
                  attributes: ['id', 'kode_mapel', 'nama_mapel']
                },
                {
                  model: Kelas,
                  as: 'kelas',
                  attributes: ['id', 'nama_kelas', 'tingkat']
                },
                {
                  model: Semester,
                  as: 'semester',
                  attributes: ['id', 'nama', 'status']
                }
              ]
            }
          ]
        },
        {
          model: Siswa,
          as: 'siswa',
          attributes: ['id', 'nama_lengkap', 'nis', 'nisn', 'jenis_kelamin']
        }
      ]
    });

    if (!nilai) {
      return res.status(404).json({
        success: false,
        message: 'Nilai tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: nilai
    });
  } catch (error) {
    console.error('Get nilai by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const getNilaiByPenilaian = async (req, res) => {
  try {
    const { penilaian_id } = req.params;

    const nilai = await Nilai.findAll({
      where: { penilaian_id },
      include: [
        {
          model: Siswa,
          as: 'siswa',
          attributes: ['id', 'nama_lengkap', 'nis', 'nisn', 'jenis_kelamin']
        },
        {
          model: Penilaian,
          as: 'penilaian',
          attributes: ['id', 'nama_penilaian', 'tipe']
        }
      ],
      order: [['siswa', 'nama_lengkap', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        nilai
      }
    });
  } catch (error) {
    console.error('Get nilai by penilaian error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const getNilaiBySiswa = async (req, res) => {
  try {
    const { siswa_id } = req.params;
    const { semester_id, mapel_id } = req.query;

    const includeClause = [
      {
        model: Penilaian,
        as: 'penilaian',
        attributes: ['id', 'nama_penilaian', 'tipe'],
        include: [
          {
            model: Pengajaran,
            as: 'pengajaran',
            attributes: ['id'],
            where: {
              ...(mapel_id && { mapel_id }),
              ...(semester_id && { semester_id })
            },
            include: [
              {
                model: MataPelajaran,
                as: 'mata_pelajaran',
                attributes: ['id', 'kode_mapel', 'nama_mapel']
              },
              {
                model: Kelas,
                as: 'kelas',
                attributes: ['id', 'nama_kelas', 'tingkat']
              },
              {
                model: Semester,
                as: 'semester',
                attributes: ['id', 'nama', 'status']
              }
            ]
          }
        ]
      }
    ];

    const nilai = await Nilai.findAll({
      where: { siswa_id },
      include: includeClause,
      order: [['penilaian','pengajaran', 'mata_pelajaran', 'nama_mapel', 'ASC'], ['penilaian', 'tipe', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        nilai
      }
    });
  } catch (error) {
    console.error('Get nilai by siswa error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const createOrUpdateNilai = async (req, res) => {
  try {
    const { penilaian_id, siswa_id, nilai } = req.body;

    // Validasi nilai (0-100)
    if (nilai < 0 || nilai > 100) {
      return res.status(400).json({
        success: false,
        message: 'Nilai harus antara 0 - 100'
      });
    }

    // Validasi penilaian_id
    const penilaian = await Penilaian.findByPk(penilaian_id, {
      include: [
        {
          model: Pengajaran,
          as: 'pengajaran',
          include: [
            {
              model: Kelas,
              as: 'kelas',
              attributes: ['id']
            }
          ]
        }
      ]
    });

    if (!penilaian) {
      return res.status(400).json({
        success: false,
        message: 'Penilaian tidak ditemukan'
      });
    }

    // Validasi siswa_id dan cek apakah siswa berada di kelas yang sama
    const siswaDiKelas = await SiswaDiKelas.findOne({
      where: { 
        siswa_id,
        kelas_id: penilaian.pengajaran.kelas.id 
      },
      include: [
        {
          model: Semester,
          as: 'semester',
          attributes: ['id']
        }
      ]
    });

    if (!siswaDiKelas) {
      return res.status(400).json({
        success: false,
        message: 'Siswa tidak terdaftar di kelas ini'
      });
    }

    // Cek apakah nilai sudah ada
    const existingNilai = await Nilai.findOne({
      where: { penilaian_id, siswa_id }
    });

    if (existingNilai) {
      // Update nilai yang sudah ada
      await existingNilai.update({ nilai });
      
      const updatedNilai = await Nilai.findByPk(existingNilai.id, {
        include: [
          {
            model: Penilaian,
            as: 'penilaian',
            attributes: ['id', 'nama_penilaian', 'tipe']
          },
          {
            model: Siswa,
            as: 'siswa',
            attributes: ['id', 'nama_lengkap', 'nis']
          }
        ]
      });

      return res.json({
        success: true,
        message: 'Nilai berhasil diupdate',
        data: updatedNilai
      });
    } else {
      // Buat nilai baru
      const newNilai = await Nilai.create({
        penilaian_id,
        siswa_id,
        nilai
      });

      const createdNilai = await Nilai.findByPk(newNilai.id, {
        include: [
          {
            model: Penilaian,
            as: 'penilaian',
            attributes: ['id', 'nama_penilaian', 'tipe']
          },
          {
            model: Siswa,
            as: 'siswa',
            attributes: ['id', 'nama_lengkap', 'nis']
          }
        ]
      });

      return res.status(201).json({
        success: true,
        message: 'Nilai berhasil dibuat',
        data: createdNilai
      });
    }
  } catch (error) {
    console.error('Create or update nilai error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Nilai untuk siswa ini sudah ada'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const bulkCreateOrUpdateNilai = async (req, res) => {
  try {
    const { penilaian_id, data_nilai } = req.body; // data_nilai: [{siswa_id, nilai}]

    // Validasi penilaian_id
    const penilaian = await Penilaian.findByPk(penilaian_id, {
      include: [
        {
          model: Pengajaran,
          as: 'pengajaran',
          include: [
            {
              model: Kelas,
              as: 'kelas',
              attributes: ['id']
            }
          ]
        }
      ]
    });

    if (!penilaian) {
      return res.status(400).json({
        success: false,
        message: 'Penilaian tidak ditemukan'
      });
    }

    const results = [];
    const errors = [];
    
    for (const item of data_nilai) {
      try {
        const { siswa_id, nilai } = item;
        
        // Validasi nilai
        if (nilai < 0 || nilai > 100) {
          errors.push({
            siswa_id,
            error: 'Nilai harus antara 0 - 100'
          });
          continue;
        }

        // Validasi siswa berada di kelas yang sama
        const siswaDiKelas = await SiswaDiKelas.findOne({
          where: { 
            siswa_id,
            kelas_id: penilaian.pengajaran.kelas.id 
          }
        });

        if (!siswaDiKelas) {
          errors.push({
            siswa_id,
            error: 'Siswa tidak terdaftar di kelas ini'
          });
          continue;
        }

        // Cek apakah nilai sudah ada
        const existingNilai = await Nilai.findOne({
          where: { penilaian_id, siswa_id }
        });

        if (existingNilai) {
          // Update
          await existingNilai.update({ nilai });
          results.push({
            siswa_id,
            action: 'updated',
            nilai
          });
        } else {
          // Create
          await Nilai.create({
            penilaian_id,
            siswa_id,
            nilai
          });
          results.push({
            siswa_id,
            action: 'created',
            nilai
          });
        }
      } catch (error) {
        errors.push({
          siswa_id: item.siswa_id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Nilai berhasil diproses',
      data: {
        processed: results.length,
        errors: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Bulk create or update nilai error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const deleteNilai = async (req, res) => {
  try {
    const { id } = req.params;

    const nilai = await Nilai.findByPk(id);
    if (!nilai) {
      return res.status(404).json({
        success: false,
        message: 'Nilai tidak ditemukan'
      });
    }

    await nilai.destroy();

    res.json({
      success: true,
      message: 'Nilai berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete nilai error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const getRekapNilaiByPenilaian = async (req, res) => {
  try {
    const { penilaian_id } = req.params;

    const nilai = await Nilai.findAll({
      where: { penilaian_id },
      include: [
        {
          model: Siswa,
          as: 'siswa',
          attributes: ['id', 'nama_lengkap', 'nis', 'nisn']
        }
      ],
      order: [['siswa', 'nama_lengkap', 'ASC']]
    });

    // Hitung statistik
    const statistik = {
      total_siswa: nilai.length,
      nilai_tertinggi: 0,
      nilai_terendah: 100,
      rata_rata: 0,
      jumlah_lulus: 0,
      jumlah_tidak_lulus: 0
    };

    let totalNilai = 0;

    for (const item of nilai) {
      const nilaiSiswa = parseFloat(item.nilai);
      totalNilai += nilaiSiswa;

      if (nilaiSiswa > statistik.nilai_tertinggi) {
        statistik.nilai_tertinggi = nilaiSiswa;
      }
      if (nilaiSiswa < statistik.nilai_terendah) {
        statistik.nilai_terendah = nilaiSiswa;
      }
      if (nilaiSiswa >= 75) {
        statistik.jumlah_lulus++;
      } else {
        statistik.jumlah_tidak_lulus++;
      }
    }

    if (nilai.length > 0) {
      statistik.rata_rata = totalNilai / nilai.length;
    }

    res.json({
      success: true,
      data: {
        nilai,
        statistik
      }
    });
  } catch (error) {
    console.error('Get rekap nilai by penilaian error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

module.exports = {
  getAllNilai,
  getNilaiById,
  getNilaiByPenilaian,
  getNilaiBySiswa,
  createOrUpdateNilai,
  bulkCreateOrUpdateNilai,
  deleteNilai,
  getRekapNilaiByPenilaian
};