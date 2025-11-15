const { Ekstrakurikuler, NilaiEkskulSiswa, Rapor, Siswa, Semester } = require('../models');
const { Op } = require('sequelize');

const getAllEkstrakurikuler = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause.nama_ekskul = { [Op.like]: `%${search}%` };
    }

    const ekstrakurikuler = await Ekstrakurikuler.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['nama_ekskul', 'ASC']]
    });

    // Hitung jumlah peserta untuk setiap ekskul
    const ekskulWithCount = await Promise.all(
      ekstrakurikuler.rows.map(async (ekskul) => {
        const pesertaCount = await NilaiEkskulSiswa.count({
          where: { ekskul_id: ekskul.id }
        });
        
        return {
          ...ekskul.toJSON(),
          jumlah_peserta: pesertaCount
        };
      })
    );

    res.json({
      success: true,
      data: {
        ekstrakurikuler: ekskulWithCount,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(ekstrakurikuler.count / limit),
          totalItems: ekstrakurikuler.count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all ekstrakurikuler error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const getEkstrakurikulerById = async (req, res) => {
  try {
    const { id } = req.params;

    const ekstrakurikuler = await Ekstrakurikuler.findByPk(id, {
      include: [
        {
          model: NilaiEkskulSiswa,
          as: 'nilai_ekskul_siswa',
          attributes: ['id'],
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
                }
              ]
            }
          ]
        }
      ]
    });

    if (!ekstrakurikuler) {
      return res.status(404).json({
        success: false,
        message: 'Ekstrakurikuler tidak ditemukan'
      });
    }

    // Hitung statistik
    const pesertaCount = ekstrakurikuler.nilai_ekskul_siswa.length;

    res.json({
      success: true,
      data: {
        ...ekstrakurikuler.toJSON(),
        statistik: {
          jumlah_peserta: pesertaCount
        }
      }
    });
  } catch (error) {
    console.error('Get ekstrakurikuler by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const createEkstrakurikuler = async (req, res) => {
  try {
    const { nama_ekskul } = req.body;

    // Validasi: Cek apakah nama ekskul sudah ada
    const existingEkskul = await Ekstrakurikuler.findOne({
      where: { nama_ekskul }
    });

    if (existingEkskul) {
      return res.status(400).json({
        success: false,
        message: 'Ekstrakurikuler dengan nama yang sama sudah ada'
      });
    }

    const ekstrakurikuler = await Ekstrakurikuler.create({
      nama_ekskul
    });

    res.status(201).json({
      success: true,
      message: 'Ekstrakurikuler berhasil dibuat',
      data: ekstrakurikuler
    });
  } catch (error) {
    console.error('Create ekstrakurikuler error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const updateEkstrakurikuler = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_ekskul } = req.body;

    const ekstrakurikuler = await Ekstrakurikuler.findByPk(id);
    if (!ekstrakurikuler) {
      return res.status(404).json({
        success: false,
        message: 'Ekstrakurikuler tidak ditemukan'
      });
    }

    // Cek duplikasi nama jika diubah
    if (nama_ekskul && nama_ekskul !== ekstrakurikuler.nama_ekskul) {
      const existingEkskul = await Ekstrakurikuler.findOne({
        where: { 
          nama_ekskul,
          id: { [Op.ne]: id }
        }
      });

      if (existingEkskul) {
        return res.status(400).json({
          success: false,
          message: 'Ekstrakurikuler dengan nama yang sama sudah ada'
        });
      }
    }

    await ekstrakurikuler.update({
      nama_ekskul: nama_ekskul || ekstrakurikuler.nama_ekskul
    });

    res.json({
      success: true,
      message: 'Ekstrakurikuler berhasil diupdate',
      data: ekstrakurikuler
    });
  } catch (error) {
    console.error('Update ekstrakurikuler error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const deleteEkstrakurikuler = async (req, res) => {
  try {
    const { id } = req.params;

    const ekstrakurikuler = await Ekstrakurikuler.findByPk(id);
    if (!ekstrakurikuler) {
      return res.status(404).json({
        success: false,
        message: 'Ekstrakurikuler tidak ditemukan'
      });
    }

    // Cek apakah ekskul sudah memiliki nilai
    const nilaiCount = await NilaiEkskulSiswa.count({
      where: { ekskul_id: id }
    });

    if (nilaiCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus ekstrakurikuler yang sudah memiliki nilai'
      });
    }

    await ekstrakurikuler.destroy();

    res.json({
      success: true,
      message: 'Ekstrakurikuler berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete ekstrakurikuler error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const getPesertaEkstrakurikuler = async (req, res) => {
  try {
    const { id } = req.params;
    const { semester_id } = req.query;

    const includeClause = [
      {
        model: Rapor,
        as: 'rapor',
        attributes: ['id'],
        where: semester_id ? { semester_id } : undefined,
        include: [
          {
            model: Siswa,
            as: 'siswa',
            attributes: ['id', 'nama_lengkap', 'nis', 'nisn', 'jenis_kelamin']
          },
          {
            model: Semester,
            as: 'semester',
            attributes: ['id', 'nama', 'status']
          }
        ]
      }
    ];

    const peserta = await NilaiEkskulSiswa.findAll({
      where: { ekskul_id: id },
      include: includeClause,
      order: [['rapor', 'siswa', 'nama_lengkap', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        peserta
      }
    });
  } catch (error) {
    console.error('Get peserta ekstrakurikuler error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

module.exports = {
  getAllEkstrakurikuler,
  getEkstrakurikulerById,
  createEkstrakurikuler,
  updateEkstrakurikuler,
  deleteEkstrakurikuler,
  getPesertaEkstrakurikuler
};