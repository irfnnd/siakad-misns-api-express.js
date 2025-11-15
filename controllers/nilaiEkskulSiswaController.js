const { NilaiEkskulSiswa, Ekstrakurikuler, Rapor, Siswa, Semester, TahunAjaran } = require('../models');
const { Op } = require('sequelize');

const getAllNilaiEkskul = async (req, res) => {
  try {
    const { page = 1, limit = 10, rapor_id, ekskul_id, siswa_id, semester_id } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (rapor_id) whereClause.rapor_id = rapor_id;
    if (ekskul_id) whereClause.ekskul_id = ekskul_id;

    const includeClause = [
      {
        model: Ekstrakurikuler,
        as: 'ekstrakurikuler',
        attributes: ['id', 'nama_ekskul']
      },
      {
        model: Rapor,
        as: 'rapor',
        attributes: ['id'],
        where: siswa_id ? { siswa_id } : undefined,
        include: [
          {
            model: Siswa,
            as: 'siswa',
            attributes: ['id', 'nama_lengkap', 'nis', 'nisn']
          },
          {
            model: Semester,
            as: 'semester',
            attributes: ['id', 'nama', 'status'],
            where: semester_id ? { id: semester_id } : undefined,
            include: [
              {
                model: TahunAjaran,
                as: 'tahun_ajaran',
                attributes: ['id', 'tahun', 'status']
              }
            ]
          }
        ]
      }
    ];

    const nilaiEkskul = await NilaiEkskulSiswa.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['id', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        nilai_ekskul: nilaiEkskul.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(nilaiEkskul.count / limit),
          totalItems: nilaiEkskul.count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all nilai ekskul error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const getNilaiEkskulById = async (req, res) => {
  try {
    const { id } = req.params;

    const nilaiEkskul = await NilaiEkskulSiswa.findByPk(id, {
      include: [
        {
          model: Ekstrakurikuler,
          as: 'ekstrakurikuler',
          attributes: ['id', 'nama_ekskul']
        },
        {
          model: Rapor,
          as: 'rapor',
          attributes: ['id'],
          include: [
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
                  attributes: ['id', 'tahun', 'status']
                }
              ]
            }
          ]
        }
      ]
    });

    if (!nilaiEkskul) {
      return res.status(404).json({
        success: false,
        message: 'Nilai ekstrakurikuler tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: nilaiEkskul
    });
  } catch (error) {
    console.error('Get nilai ekskul by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const getNilaiEkskulByRapor = async (req, res) => {
  try {
    const { rapor_id } = req.params;

    const nilaiEkskul = await NilaiEkskulSiswa.findAll({
      where: { rapor_id },
      include: [
        {
          model: Ekstrakurikuler,
          as: 'ekstrakurikuler',
          attributes: ['id', 'nama_ekskul']
        }
      ],
      order: [['ekstrakurikuler', 'nama_ekskul', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        nilai_ekskul: nilaiEkskul
      }
    });
  } catch (error) {
    console.error('Get nilai ekskul by rapor error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const getNilaiEkskulBySiswa = async (req, res) => {
  try {
    const { siswa_id } = req.params;
    const { semester_id } = req.query;

    const nilaiEkskul = await NilaiEkskulSiswa.findAll({
      include: [
        {
          model: Ekstrakurikuler,
          as: 'ekstrakurikuler',
          attributes: ['id', 'nama_ekskul']
        },
        {
          model: Rapor,
          as: 'rapor',
          attributes: ['id'],
          where: { siswa_id },
          include: [
            {
              model: Semester,
              as: 'semester',
              attributes: ['id', 'nama', 'status'],
              where: semester_id ? { id: semester_id } : undefined
            }
          ]
        }
      ],
      order: [['rapor', 'semester', 'id', 'DESC'], ['ekstrakurikuler', 'nama_ekskul', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        nilai_ekskul
      }
    });
  } catch (error) {
    console.error('Get nilai ekskul by siswa error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const createNilaiEkskul = async (req, res) => {
  try {
    const { rapor_id, ekskul_id, nilai, deskripsi } = req.body;

    // Validasi: Cek apakah nilai ekskul sudah ada untuk rapor dan ekskul ini
    const existingNilaiEkskul = await NilaiEkskulSiswa.findOne({
      where: { rapor_id, ekskul_id }
    });

    if (existingNilaiEkskul) {
      return res.status(400).json({
        success: false,
        message: 'Nilai ekstrakurikuler untuk siswa ini sudah ada'
      });
    }

    // Validasi rapor_id
    const rapor = await Rapor.findByPk(rapor_id);
    if (!rapor) {
      return res.status(400).json({
        success: false,
        message: 'Rapor tidak ditemukan'
      });
    }

    // Validasi ekskul_id
    const ekskul = await Ekstrakurikuler.findByPk(ekskul_id);
    if (!ekskul) {
      return res.status(400).json({
        success: false,
        message: 'Ekstrakurikuler tidak ditemukan'
      });
    }

    const nilaiEkskul = await NilaiEkskulSiswa.create({
      rapor_id,
      ekskul_id,
      nilai,
      deskripsi
    });

    const newNilaiEkskul = await NilaiEkskulSiswa.findByPk(nilaiEkskul.id, {
      include: [
        {
          model: Ekstrakurikuler,
          as: 'ekstrakurikuler',
          attributes: ['id', 'nama_ekskul']
        },
        {
          model: Rapor,
          as: 'rapor',
          attributes: ['id'],
          include: [
            {
              model: Siswa,
              as: 'siswa',
              attributes: ['id', 'nama_lengkap', 'nis']
            }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Nilai ekstrakurikuler berhasil dibuat',
      data: newNilaiEkskul
    });
  } catch (error) {
    console.error('Create nilai ekskul error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const updateNilaiEkskul = async (req, res) => {
  try {
    const { id } = req.params;
    const { nilai, deskripsi } = req.body;

    const nilaiEkskul = await NilaiEkskulSiswa.findByPk(id);
    if (!nilaiEkskul) {
      return res.status(404).json({
        success: false,
        message: 'Nilai ekstrakurikuler tidak ditemukan'
      });
    }

    await nilaiEkskul.update({
      nilai: nilai || nilaiEkskul.nilai,
      deskripsi: deskripsi || nilaiEkskul.deskripsi
    });

    const updatedNilaiEkskul = await NilaiEkskulSiswa.findByPk(id, {
      include: [
        {
          model: Ekstrakurikuler,
          as: 'ekstrakurikuler',
          attributes: ['id', 'nama_ekskul']
        },
        {
          model: Rapor,
          as: 'rapor',
          attributes: ['id'],
          include: [
            {
              model: Siswa,
              as: 'siswa',
              attributes: ['id', 'nama_lengkap', 'nis']
            }
          ]
        }
      ]
    });

    res.json({
      success: true,
      message: 'Nilai ekstrakurikuler berhasil diupdate',
      data: updatedNilaiEkskul
    });
  } catch (error) {
    console.error('Update nilai ekskul error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const deleteNilaiEkskul = async (req, res) => {
  try {
    const { id } = req.params;

    const nilaiEkskul = await NilaiEkskulSiswa.findByPk(id);
    if (!nilaiEkskul) {
      return res.status(404).json({
        success: false,
        message: 'Nilai ekstrakurikuler tidak ditemukan'
      });
    }

    await nilaiEkskul.destroy();

    res.json({
      success: true,
      message: 'Nilai ekstrakurikuler berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete nilai ekskul error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const bulkCreateNilaiEkskul = async (req, res) => {
  try {
    const { rapor_id, data_nilai } = req.body; // data_nilai: [{ekskul_id, nilai, deskripsi}]

    const results = [];
    const errors = [];

    for (const item of data_nilai) {
      try {
        const { ekskul_id, nilai, deskripsi } = item;

        // Validasi ekskul_id
        const ekskul = await Ekstrakurikuler.findByPk(ekskul_id);
        if (!ekskul) {
          errors.push({
            ekskul_id,
            error: 'Ekstrakurikuler tidak ditemukan'
          });
          continue;
        }

        // Cek apakah sudah ada
        const existing = await NilaiEkskulSiswa.findOne({
          where: { rapor_id, ekskul_id }
        });

        if (existing) {
          // Update
          await existing.update({
            nilai,
            deskripsi
          });
          results.push({
            ekskul_id,
            action: 'updated'
          });
        } else {
          // Create
          await NilaiEkskulSiswa.create({
            rapor_id,
            ekskul_id,
            nilai,
            deskripsi
          });
          results.push({
            ekskul_id,
            action: 'created'
          });
        }
      } catch (error) {
        errors.push({
          ekskul_id: item.ekskul_id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Nilai ekstrakurikuler berhasil diproses',
      data: {
        processed: results.length,
        errors: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Bulk create nilai ekskul error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

module.exports = {
  getAllNilaiEkskul,
  getNilaiEkskulById,
  getNilaiEkskulByRapor,
  getNilaiEkskulBySiswa,
  createNilaiEkskul,
  updateNilaiEkskul,
  deleteNilaiEkskul,
  bulkCreateNilaiEkskul
};