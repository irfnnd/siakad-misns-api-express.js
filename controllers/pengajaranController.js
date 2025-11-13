const { Pengajaran, Pegawai, MataPelajaran, Kelas, Semester, TahunAjaran } = require('../models');
const { Op } = require('sequelize');

const getAllPengajaran = async (req, res) => {
  try {
    const { page = 1, limit = 10, guru_id, mapel_id, kelas_id, semester_id, tingkat } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (guru_id) whereClause.guru_id = guru_id;
    if (mapel_id) whereClause.mapel_id = mapel_id;
    if (kelas_id) whereClause.kelas_id = kelas_id;
    if (semester_id) whereClause.semester_id = semester_id;

    const includeClause = [
      {
        model: Pegawai,
        as: 'guru',
        attributes: ['id', 'nama_lengkap', 'nip', 'jabatan']
      },
      {
        model: MataPelajaran,
        as: 'mata_pelajaran',
        attributes: ['id', 'kode_mapel', 'nama_mapel']
      },
      {
        model: Kelas,
        as: 'kelas',
        attributes: ['id', 'nama_kelas', 'tingkat'],
        where: tingkat ? { tingkat } : undefined
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
    ];

    const pengajaran = await Pengajaran.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['kelas', 'tingkat', 'ASC'], ['kelas', 'nama_kelas', 'ASC'], ['mata_pelajaran', 'nama_mapel', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        pengajaran: pengajaran.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(pengajaran.count / limit),
          totalItems: pengajaran.count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all pengajaran error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const getPengajaranById = async (req, res) => {
  try {
    const { id } = req.params;

    const pengajaran = await Pengajaran.findByPk(id, {
      include: [
        {
          model: Pegawai,
          as: 'guru',
          attributes: ['id', 'nama_lengkap', 'nip', 'jabatan', 'telepon']
        },
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
    });

    if (!pengajaran) {
      return res.status(404).json({
        success: false,
        message: 'Pengajaran tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: pengajaran
    });
  } catch (error) {
    console.error('Get pengajaran by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const getPengajaranByGuru = async (req, res) => {
  try {
    const { guru_id } = req.params;
    const { semester_id, tingkat } = req.query;

    const whereClause = { guru_id };
    if (semester_id) whereClause.semester_id = semester_id;

    const includeClause = [
      {
        model: MataPelajaran,
        as: 'mata_pelajaran',
        attributes: ['id', 'kode_mapel', 'nama_mapel']
      },
      {
        model: Kelas,
        as: 'kelas',
        attributes: ['id', 'nama_kelas', 'tingkat'],
        where: tingkat ? { tingkat } : undefined
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
    ];

    const pengajaran = await Pengajaran.findAll({
      where: whereClause,
      include: includeClause,
      order: [['kelas', 'tingkat', 'ASC'], ['kelas', 'nama_kelas', 'ASC'], ['mata_pelajaran', 'nama_mapel', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        pengajaran
      }
    });
  } catch (error) {
    console.error('Get pengajaran by guru error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const getPengajaranByKelas = async (req, res) => {
  try {
    const { kelas_id } = req.params;
    const { semester_id } = req.query;

    const whereClause = { kelas_id };
    if (semester_id) whereClause.semester_id = semester_id;

    const pengajaran = await Pengajaran.findAll({
      where: whereClause,
      include: [
        {
          model: Pegawai,
          as: 'guru',
          attributes: ['id', 'nama_lengkap', 'nip']
        },
        {
          model: MataPelajaran,
          as: 'mata_pelajaran',
          attributes: ['id', 'kode_mapel', 'nama_mapel']
        },
        {
          model: Semester,
          as: 'semester',
          attributes: ['id', 'nama', 'status']
        }
      ],
      order: [['mata_pelajaran', 'nama_mapel', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        pengajaran
      }
    });
  } catch (error) {
    console.error('Get pengajaran by kelas error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const createPengajaran = async (req, res) => {
  try {
    const { guru_id, mapel_id, kelas_id, semester_id } = req.body;

    // Validasi: Cek apakah kelas ada dan tingkatnya valid untuk SD (1-6)
    const kelas = await Kelas.findByPk(kelas_id);
    if (!kelas) {
      return res.status(400).json({
        success: false,
        message: 'Kelas tidak ditemukan'
      });
    }

    if (kelas.tingkat < 1 || kelas.tingkat > 6) {
      return res.status(400).json({
        success: false,
        message: 'Tingkat kelas harus antara 1-6 untuk SD'
      });
    }

    // Cek apakah pengajaran sudah ada
    const existingPengajaran = await Pengajaran.findOne({
      where: { 
        guru_id, 
        mapel_id, 
        kelas_id, 
        semester_id 
      }
    });

    if (existingPengajaran) {
      return res.status(400).json({
        success: false,
        message: 'Pengajaran sudah terdaftar untuk guru, mata pelajaran, kelas, dan semester ini'
      });
    }

    const pengajaran = await Pengajaran.create({
      guru_id,
      mapel_id,
      kelas_id,
      semester_id
    });

    const newPengajaran = await Pengajaran.findByPk(pengajaran.id, {
      include: [
        {
          model: Pegawai,
          as: 'guru',
          attributes: ['id', 'nama_lengkap', 'nip', 'jabatan']
        },
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
    });

    res.status(201).json({
      success: true,
      message: 'Pengajaran berhasil dibuat',
      data: newPengajaran
    });
  } catch (error) {
    console.error('Create pengajaran error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const updatePengajaran = async (req, res) => {
  try {
    const { id } = req.params;
    const { guru_id, mapel_id, kelas_id, semester_id } = req.body;

    const pengajaran = await Pengajaran.findByPk(id);
    if (!pengajaran) {
      return res.status(404).json({
        success: false,
        message: 'Pengajaran tidak ditemukan'
      });
    }

    // Validasi kelas jika diubah
    if (kelas_id && kelas_id !== pengajaran.kelas_id) {
      const kelas = await Kelas.findByPk(kelas_id);
      if (!kelas) {
        return res.status(400).json({
          success: false,
          message: 'Kelas tidak ditemukan'
        });
      }

      if (kelas.tingkat < 1 || kelas.tingkat > 6) {
        return res.status(400).json({
          success: false,
          message: 'Tingkat kelas harus antara 1-6 untuk SD'
        });
      }
    }

    // Cek duplikasi jika data diubah
    if (guru_id || mapel_id || kelas_id || semester_id) {
      const existingPengajaran = await Pengajaran.findOne({
        where: {
          guru_id: guru_id || pengajaran.guru_id,
          mapel_id: mapel_id || pengajaran.mapel_id,
          kelas_id: kelas_id || pengajaran.kelas_id,
          semester_id: semester_id || pengajaran.semester_id,
          id: { [Op.ne]: id }
        }
      });

      if (existingPengajaran) {
        return res.status(400).json({
          success: false,
          message: 'Pengajaran sudah terdaftar'
        });
      }
    }

    await pengajaran.update({
      guru_id: guru_id || pengajaran.guru_id,
      mapel_id: mapel_id || pengajaran.mapel_id,
      kelas_id: kelas_id || pengajaran.kelas_id,
      semester_id: semester_id || pengajaran.semester_id
    });

    const updatedPengajaran = await Pengajaran.findByPk(id, {
      include: [
        {
          model: Pegawai,
          as: 'guru',
          attributes: ['id', 'nama_lengkap', 'nip', 'jabatan']
        },
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
    });

    res.json({
      success: true,
      message: 'Pengajaran berhasil diupdate',
      data: updatedPengajaran
    });
  } catch (error) {
    console.error('Update pengajaran error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const deletePengajaran = async (req, res) => {
  try {
    const { id } = req.params;

    const pengajaran = await Pengajaran.findByPk(id);
    if (!pengajaran) {
      return res.status(404).json({
        success: false,
        message: 'Pengajaran tidak ditemukan'
      });
    }

    await pengajaran.destroy();

    res.json({
      success: true,
      message: 'Pengajaran berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete pengajaran error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

module.exports = {
  getAllPengajaran,
  getPengajaranById,
  getPengajaranByGuru,
  getPengajaranByKelas,
  createPengajaran,
  updatePengajaran,
  deletePengajaran
};