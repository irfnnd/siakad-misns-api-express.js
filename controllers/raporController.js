const { Rapor, NilaiRapor, Siswa, Semester, TahunAjaran, MataPelajaran, Kelas, SiswaDiKelas } = require('../models');
const { Op } = require('sequelize');

const getAllRapor = async (req, res) => {
  try {
    const { page = 1, limit = 10, siswa_id, semester_id, kelas_id, tahun_ajaran_id } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (siswa_id) whereClause.siswa_id = siswa_id;
    if (semester_id) whereClause.semester_id = semester_id;

    const includeClause = [
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
            attributes: ['id', 'tahun', 'status'],
            where: tahun_ajaran_id ? { id: tahun_ajaran_id } : undefined
          }
        ]
      }
    ];

    // Filter by kelas melalui SiswaDiKelas
    if (kelas_id) {
      includeClause[0].include = [
        {
          model: SiswaDiKelas,
          as: 'siswa_di_kelas',
          where: { kelas_id },
          attributes: [],
          required: true
        }
      ];
    }

    const rapor = await Rapor.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['id', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        rapor: rapor.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(rapor.count / limit),
          totalItems: rapor.count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all rapor error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const getRaporById = async (req, res) => {
  try {
    const { id } = req.params;

    const rapor = await Rapor.findByPk(id, {
      include: [
        {
          model: Siswa,
          as: 'siswa',
          attributes: ['id', 'nama_lengkap', 'nis', 'nisn', 'jenis_kelamin', 'tanggal_lahir']
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
        },
        {
          model: NilaiRapor,
          as: 'nilai_rapor',
          attributes: ['id', 'mapel_id', 'nilai_akhir', 'predikat', 'deskripsi_capaian'],
          include: [
            {
              model: MataPelajaran,
              as: 'mata_pelajaran',
              attributes: ['id', 'kode_mapel', 'nama_mapel']
            }
          ]
        }
      ]
    });

    if (!rapor) {
      return res.status(404).json({
        success: false,
        message: 'Rapor tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: rapor
    });
  } catch (error) {
    console.error('Get rapor by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const getRaporBySiswa = async (req, res) => {
  try {
    const { siswa_id } = req.params;

    const rapor = await Rapor.findAll({
      where: { siswa_id },
      include: [
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
        },
        {
          model: NilaiRapor,
          as: 'nilai_rapor',
          attributes: ['id'],
          include: [
            {
              model: MataPelajaran,
              as: 'mata_pelajaran',
              attributes: ['id', 'nama_mapel']
            }
          ]
        }
      ],
      order: [[Semester, 'id', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        rapor
      }
    });
  } catch (error) {
    console.error('Get rapor by siswa error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const getRaporBySiswaSemester = async (req, res) => {
  try {
    const { siswa_id, semester_id } = req.params;

    const rapor = await Rapor.findOne({
      where: { siswa_id, semester_id },
      include: [
        {
          model: Siswa,
          as: 'siswa',
          attributes: ['id', 'nama_lengkap', 'nis', 'nisn', 'jenis_kelamin', 'tanggal_lahir']
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
        },
        {
          model: NilaiRapor,
          as: 'nilai_rapor',
          attributes: ['id', 'mapel_id', 'nilai_akhir', 'predikat', 'deskripsi_capaian'],
          include: [
            {
              model: MataPelajaran,
              as: 'mata_pelajaran',
              attributes: ['id', 'kode_mapel', 'nama_mapel']
            }
          ],
          order: [[MataPelajaran, 'nama_mapel', 'ASC']]
        }
      ]
    });

    if (!rapor) {
      return res.status(404).json({
        success: false,
        message: 'Rapor tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: rapor
    });
  } catch (error) {
    console.error('Get rapor by siswa semester error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const createRapor = async (req, res) => {
  try {
    const { siswa_id, semester_id, catatan_wali_kelas, sikap_spiritual, sikap_sosial } = req.body;

    // Validasi: Cek apakah rapor sudah ada untuk siswa dan semester ini
    const existingRapor = await Rapor.findOne({
      where: { siswa_id, semester_id }
    });

    if (existingRapor) {
      return res.status(400).json({
        success: false,
        message: 'Rapor untuk siswa dan semester ini sudah ada'
      });
    }

    // Validasi: Cek apakah siswa dan semester valid
    const siswa = await Siswa.findByPk(siswa_id);
    if (!siswa) {
      return res.status(400).json({
        success: false,
        message: 'Siswa tidak ditemukan'
      });
    }

    const semester = await Semester.findByPk(semester_id);
    if (!semester) {
      return res.status(400).json({
        success: false,
        message: 'Semester tidak ditemukan'
      });
    }

    const rapor = await Rapor.create({
      siswa_id,
      semester_id,
      catatan_wali_kelas,
      sikap_spiritual,
      sikap_sosial
    });

    const newRapor = await Rapor.findByPk(rapor.id, {
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
    });

    res.status(201).json({
      success: true,
      message: 'Rapor berhasil dibuat',
      data: newRapor
    });
  } catch (error) {
    console.error('Create rapor error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Rapor untuk siswa dan semester ini sudah ada'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const updateRapor = async (req, res) => {
  try {
    const { id } = req.params;
    const { catatan_wali_kelas, sikap_spiritual, sikap_sosial } = req.body;

    const rapor = await Rapor.findByPk(id);
    if (!rapor) {
      return res.status(404).json({
        success: false,
        message: 'Rapor tidak ditemukan'
      });
    }

    await rapor.update({
      catatan_wali_kelas: catatan_wali_kelas || rapor.catatan_wali_kelas,
      sikap_spiritual: sikap_spiritual || rapor.sikap_spiritual,
      sikap_sosial: sikap_sosial || rapor.sikap_sosial
    });

    const updatedRapor = await Rapor.findByPk(id, {
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
    });

    res.json({
      success: true,
      message: 'Rapor berhasil diupdate',
      data: updatedRapor
    });
  } catch (error) {
    console.error('Update rapor error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const deleteRapor = async (req, res) => {
  try {
    const { id } = req.params;

    const rapor = await Rapor.findByPk(id);
    if (!rapor) {
      return res.status(404).json({
        success: false,
        message: 'Rapor tidak ditemukan'
      });
    }

    // Hapus semua nilai rapor terkait
    await NilaiRapor.destroy({
      where: { rapor_id: id }
    });

    await rapor.destroy();

    res.json({
      success: true,
      message: 'Rapor berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete rapor error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const generateRapor = async (req, res) => {
  try {
    const { siswa_id, semester_id } = req.body;

    // Validasi: Cek apakah rapor sudah ada
    const existingRapor = await Rapor.findOne({
      where: { siswa_id, semester_id }
    });

    if (existingRapor) {
      return res.status(400).json({
        success: false,
        message: 'Rapor untuk siswa dan semester ini sudah ada'
      });
    }

    // TODO: Implementasi logika generate nilai rapor otomatis
    // dari data nilai harian, PTS, PAS
    
    // Untuk sementara, buat rapor kosong
    const rapor = await Rapor.create({
      siswa_id,
      semester_id,
      catatan_wali_kelas: 'Belum ada catatan',
      sikap_spiritual: 'Belum ada penilaian sikap spiritual',
      sikap_sosial: 'Belum ada penilaian sikap sosial'
    });

    const newRapor = await Rapor.findByPk(rapor.id, {
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
    });

    res.status(201).json({
      success: true,
      message: 'Rapor berhasil digenerate',
      data: newRapor
    });
  } catch (error) {
    console.error('Generate rapor error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

module.exports = {
  getAllRapor,
  getRaporById,
  getRaporBySiswa,
  getRaporBySiswaSemester,
  createRapor,
  updateRapor,
  deleteRapor,
  generateRapor
};