const { KonfigurasiBobot, Pengajaran, MataPelajaran, Kelas, Semester, Pegawai } = require('../models');
const { Op } = require('sequelize');

const getAllKonfigurasiBobot = async (req, res) => {
  try {
    const { page = 1, limit = 10, pengajaran_id, search, kelas_id, semester_id } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (pengajaran_id) whereClause.pengajaran_id = pengajaran_id;

    const includeClause = [
      {
        model: Pengajaran,
        as: 'pengajaran',
        attributes: ['id'],
        include: [
          {
            model: MataPelajaran,
            as: 'mata_pelajaran',
            attributes: ['id', 'kode_mapel', 'nama_mapel'],
            where: search ? { nama_mapel: { [Op.like]: `%${search}%` } } : undefined
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
          },
          {
            model: Pegawai,
            as: 'guru',
            attributes: ['id', 'nama_lengkap', 'nip']
          }
        ]
      }
    ];

    const konfigurasi = await KonfigurasiBobot.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['id', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        konfigurasi_bobot: konfigurasi.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(konfigurasi.count / limit),
          totalItems: konfigurasi.count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all konfigurasi bobot error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const getKonfigurasiById = async (req, res) => {
  try {
    const { id } = req.params;

    const konfigurasi = await KonfigurasiBobot.findByPk(id, {
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
            },
            {
              model: Pegawai,
              as: 'guru',
              attributes: ['id', 'nama_lengkap', 'nip']
            }
          ]
        }
      ]
    });

    if (!konfigurasi) {
      return res.status(404).json({
        success: false,
        message: 'Konfigurasi bobot tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: konfigurasi
    });
  } catch (error) {
    console.error('Get konfigurasi by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const getKonfigurasiByPengajaran = async (req, res) => {
  try {
    const { pengajaran_id } = req.params;

    const konfigurasi = await KonfigurasiBobot.findOne({
      where: { pengajaran_id },
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
    });

    if (!konfigurasi) {
      return res.status(404).json({
        success: false,
        message: 'Konfigurasi bobot tidak ditemukan untuk pengajaran ini'
      });
    }

    res.json({
      success: true,
      data: konfigurasi
    });
  } catch (error) {
    console.error('Get konfigurasi by pengajaran error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const createKonfigurasiBobot = async (req, res) => {
  try {
    const { pengajaran_id, bobot_harian, bobot_pts, bobot_pas } = req.body;

    // Validasi: Cek apakah pengajaran_id sudah ada konfigurasi
    const existingKonfigurasi = await KonfigurasiBobot.findOne({
      where: { pengajaran_id }
    });

    if (existingKonfigurasi) {
      return res.status(400).json({
        success: false,
        message: 'Konfigurasi bobot untuk pengajaran ini sudah ada'
      });
    }

    // Validasi: Cek apakah pengajaran_id valid
    const pengajaran = await Pengajaran.findByPk(pengajaran_id);
    if (!pengajaran) {
      return res.status(400).json({
        success: false,
        message: 'Pengajaran tidak ditemukan'
      });
    }

    // Validasi: Total bobot harus 100
    const totalBobot = parseFloat(bobot_harian) + parseFloat(bobot_pts) + parseFloat(bobot_pas);
    if (totalBobot !== 100) {
      return res.status(400).json({
        success: false,
        message: 'Total bobot harus 100%'
      });
    }

    const konfigurasi = await KonfigurasiBobot.create({
      pengajaran_id,
      bobot_harian,
      bobot_pts,
      bobot_pas
    });

    const newKonfigurasi = await KonfigurasiBobot.findByPk(konfigurasi.id, {
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
    });

    res.status(201).json({
      success: true,
      message: 'Konfigurasi bobot berhasil dibuat',
      data: newKonfigurasi
    });
  } catch (error) {
    console.error('Create konfigurasi bobot error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const updateKonfigurasiBobot = async (req, res) => {
  try {
    const { id } = req.params;
    const { bobot_harian, bobot_pts, bobot_pas } = req.body;

    const konfigurasi = await KonfigurasiBobot.findByPk(id);
    if (!konfigurasi) {
      return res.status(404).json({
        success: false,
        message: 'Konfigurasi bobot tidak ditemukan'
      });
    }

    // Validasi: Total bobot harus 100
    const totalBobot = parseFloat(bobot_harian) + parseFloat(bobot_pts) + parseFloat(bobot_pas);
    if (totalBobot !== 100) {
      return res.status(400).json({
        success: false,
        message: 'Total bobot harus 100%'
      });
    }

    await konfigurasi.update({
      bobot_harian,
      bobot_pts,
      bobot_pas
    });

    const updatedKonfigurasi = await KonfigurasiBobot.findByPk(id, {
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
    });

    res.json({
      success: true,
      message: 'Konfigurasi bobot berhasil diupdate',
      data: updatedKonfigurasi
    });
  } catch (error) {
    console.error('Update konfigurasi bobot error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const deleteKonfigurasiBobot = async (req, res) => {
  try {
    const { id } = req.params;

    const konfigurasi = await KonfigurasiBobot.findByPk(id);
    if (!konfigurasi) {
      return res.status(404).json({
        success: false,
        message: 'Konfigurasi bobot tidak ditemukan'
      });
    }

    await konfigurasi.destroy();

    res.json({
      success: true,
      message: 'Konfigurasi bobot berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete konfigurasi bobot error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Bulk create konfigurasi untuk multiple pengajaran
const bulkCreateKonfigurasi = async (req, res) => {
  try {
    const { konfigurasi_list } = req.body; // Array of {pengajaran_id, bobot_harian, bobot_pts, bobot_pas}

    const results = [];
    const errors = [];

    for (const config of konfigurasi_list) {
      try {
        // Validasi total bobot
        const totalBobot = parseFloat(config.bobot_harian) + parseFloat(config.bobot_pts) + parseFloat(config.bobot_pas);
        if (totalBobot !== 100) {
          errors.push({
            pengajaran_id: config.pengajaran_id,
            error: 'Total bobot harus 100%'
          });
          continue;
        }

        // Cek apakah sudah ada
        const existing = await KonfigurasiBobot.findOne({
          where: { pengajaran_id: config.pengajaran_id }
        });

        if (existing) {
          // Update yang sudah ada
          await existing.update({
            bobot_harian: config.bobot_harian,
            bobot_pts: config.bobot_pts,
            bobot_pas: config.bobot_pas
          });
          results.push({
            pengajaran_id: config.pengajaran_id,
            action: 'updated'
          });
        } else {
          // Buat baru
          await KonfigurasiBobot.create(config);
          results.push({
            pengajaran_id: config.pengajaran_id,
            action: 'created'
          });
        }
      } catch (error) {
        errors.push({
          pengajaran_id: config.pengajaran_id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Konfigurasi bobot berhasil diproses',
      data: {
        processed: results.length,
        errors: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Bulk create konfigurasi error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

module.exports = {
  getAllKonfigurasiBobot,
  getKonfigurasiById,
  getKonfigurasiByPengajaran,
  createKonfigurasiBobot,
  updateKonfigurasiBobot,
  deleteKonfigurasiBobot,
  bulkCreateKonfigurasi
};