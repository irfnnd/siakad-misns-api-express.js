const { NilaiRapor, Rapor, MataPelajaran, Siswa, Semester } = require('../models');
const { Op } = require('sequelize');

const getAllNilaiRapor = async (req, res) => {
  try {
    const { page = 1, limit = 10, rapor_id, mapel_id } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (rapor_id) whereClause.rapor_id = rapor_id;
    if (mapel_id) whereClause.mapel_id = mapel_id;

    const nilaiRapor = await NilaiRapor.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Rapor,
          as: 'rapor',
          attributes: ['id'],
          include: [
            {
              model: Siswa,
              as: 'siswa',
              attributes: ['id', 'nama_lengkap', 'nis']
            },
            {
              model: Semester,
              as: 'semester',
              attributes: ['id', 'nama', 'status']
            }
          ]
        },
        {
          model: MataPelajaran,
          as: 'mata_pelajaran',
          attributes: ['id', 'kode_mapel', 'nama_mapel']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[MataPelajaran, 'nama_mapel', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        nilai_rapor: nilaiRapor.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(nilaiRapor.count / limit),
          totalItems: nilaiRapor.count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all nilai rapor error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const getNilaiRaporById = async (req, res) => {
  try {
    const { id } = req.params;

    const nilaiRapor = await NilaiRapor.findByPk(id, {
      include: [
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
              attributes: ['id', 'nama', 'status']
            }
          ]
        },
        {
          model: MataPelajaran,
          as: 'mata_pelajaran',
          attributes: ['id', 'kode_mapel', 'nama_mapel']
        }
      ]
    });

    if (!nilaiRapor) {
      return res.status(404).json({
        success: false,
        message: 'Nilai rapor tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: nilaiRapor
    });
  } catch (error) {
    console.error('Get nilai rapor by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const getNilaiRaporByRapor = async (req, res) => {
  try {
    const { rapor_id } = req.params;

    const nilaiRapor = await NilaiRapor.findAll({
      where: { rapor_id },
      include: [
        {
          model: MataPelajaran,
          as: 'mata_pelajaran',
          attributes: ['id', 'kode_mapel', 'nama_mapel']
        }
      ],
      order: [[MataPelajaran, 'nama_mapel', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        nilai_rapor: nilaiRapor
      }
    });
  } catch (error) {
    console.error('Get nilai rapor by rapor error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const createNilaiRapor = async (req, res) => {
  try {
    const { rapor_id, mapel_id, nilai_akhir, predikat, deskripsi_capaian } = req.body;

    // Validasi nilai akhir (0-100)
    if (nilai_akhir < 0 || nilai_akhir > 100) {
      return res.status(400).json({
        success: false,
        message: 'Nilai akhir harus antara 0 - 100'
      });
    }

    // Validasi predikat (A, B, C, D)
    const validPredikat = ['A', 'B', 'C', 'D'];
    if (!validPredikat.includes(predikat)) {
      return res.status(400).json({
        success: false,
        message: 'Predikat harus A, B, C, atau D'
      });
    }

    // Validasi: Cek apakah nilai rapor untuk mapel ini sudah ada
    const existingNilaiRapor = await NilaiRapor.findOne({
      where: { rapor_id, mapel_id }
    });

    if (existingNilaiRapor) {
      return res.status(400).json({
        success: false,
        message: 'Nilai rapor untuk mata pelajaran ini sudah ada'
      });
    }

    const nilaiRapor = await NilaiRapor.create({
      rapor_id,
      mapel_id,
      nilai_akhir,
      predikat,
      deskripsi_capaian
    });

    const newNilaiRapor = await NilaiRapor.findByPk(nilaiRapor.id, {
      include: [
        {
          model: Rapor,
          as: 'rapor',
          attributes: ['id']
        },
        {
          model: MataPelajaran,
          as: 'mata_pelajaran',
          attributes: ['id', 'kode_mapel', 'nama_mapel']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Nilai rapor berhasil dibuat',
      data: newNilaiRapor
    });
  } catch (error) {
    console.error('Create nilai rapor error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const updateNilaiRapor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nilai_akhir, predikat, deskripsi_capaian } = req.body;

    const nilaiRapor = await NilaiRapor.findByPk(id);
    if (!nilaiRapor) {
      return res.status(404).json({
        success: false,
        message: 'Nilai rapor tidak ditemukan'
      });
    }

    // Validasi nilai akhir jika diubah
    if (nilai_akhir !== undefined) {
      if (nilai_akhir < 0 || nilai_akhir > 100) {
        return res.status(400).json({
          success: false,
          message: 'Nilai akhir harus antara 0 - 100'
        });
      }
    }

    // Validasi predikat jika diubah
    if (predikat) {
      const validPredikat = ['A', 'B', 'C', 'D'];
      if (!validPredikat.includes(predikat)) {
        return res.status(400).json({
          success: false,
          message: 'Predikat harus A, B, C, atau D'
        });
      }
    }

    await nilaiRapor.update({
      nilai_akhir: nilai_akhir || nilaiRapor.nilai_akhir,
      predikat: predikat || nilaiRapor.predikat,
      deskripsi_capaian: deskripsi_capaian || nilaiRapor.deskripsi_capaian
    });

    const updatedNilaiRapor = await NilaiRapor.findByPk(id, {
      include: [
        {
          model: Rapor,
          as: 'rapor',
          attributes: ['id']
        },
        {
          model: MataPelajaran,
          as: 'mata_pelajaran',
          attributes: ['id', 'kode_mapel', 'nama_mapel']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Nilai rapor berhasil diupdate',
      data: updatedNilaiRapor
    });
  } catch (error) {
    console.error('Update nilai rapor error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const deleteNilaiRapor = async (req, res) => {
  try {
    const { id } = req.params;

    const nilaiRapor = await NilaiRapor.findByPk(id);
    if (!nilaiRapor) {
      return res.status(404).json({
        success: false,
        message: 'Nilai rapor tidak ditemukan'
      });
    }

    await nilaiRapor.destroy();

    res.json({
      success: true,
      message: 'Nilai rapor berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete nilai rapor error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const bulkCreateNilaiRapor = async (req, res) => {
  try {
    const { rapor_id, data_nilai } = req.body; // data_nilai: [{mapel_id, nilai_akhir, predikat, deskripsi_capaian}]

    const results = [];
    const errors = [];

    for (const item of data_nilai) {
      try {
        const { mapel_id, nilai_akhir, predikat, deskripsi_capaian } = item;

        // Validasi
        if (nilai_akhir < 0 || nilai_akhir > 100) {
          errors.push({
            mapel_id,
            error: 'Nilai akhir harus antara 0 - 100'
          });
          continue;
        }

        const validPredikat = ['A', 'B', 'C', 'D'];
        if (!validPredikat.includes(predikat)) {
          errors.push({
            mapel_id,
            error: 'Predikat harus A, B, C, atau D'
          });
          continue;
        }

        // Cek apakah sudah ada
        const existing = await NilaiRapor.findOne({
          where: { rapor_id, mapel_id }
        });

        if (existing) {
          // Update
          await existing.update({
            nilai_akhir,
            predikat,
            deskripsi_capaian
          });
          results.push({
            mapel_id,
            action: 'updated'
          });
        } else {
          // Create
          await NilaiRapor.create({
            rapor_id,
            mapel_id,
            nilai_akhir,
            predikat,
            deskripsi_capaian
          });
          results.push({
            mapel_id,
            action: 'created'
          });
        }
      } catch (error) {
        errors.push({
          mapel_id: item.mapel_id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Nilai rapor berhasil diproses',
      data: {
        processed: results.length,
        errors: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Bulk create nilai rapor error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

module.exports = {
  getAllNilaiRapor,
  getNilaiRaporById,
  getNilaiRaporByRapor,
  createNilaiRapor,
  updateNilaiRapor,
  deleteNilaiRapor,
  bulkCreateNilaiRapor
};