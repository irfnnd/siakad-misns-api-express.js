const { SiswaDiKelas, Siswa, Kelas, Semester, TahunAjaran } = require('../models');

const getAllSiswaDiKelas = async (req, res) => {
  try {
    const { page = 1, limit = 10, kelas_id, semester_id, siswa_id } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (kelas_id) whereClause.kelas_id = kelas_id;
    if (semester_id) whereClause.semester_id = semester_id;
    if (siswa_id) whereClause.siswa_id = siswa_id;

    const siswaDiKelas = await SiswaDiKelas.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Siswa,
          as: 'siswa',
          attributes: ['id', 'nama_lengkap', 'nis', 'nisn', 'jenis_kelamin']
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
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['id', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        siswa_di_kelas: siswaDiKelas.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(siswaDiKelas.count / limit),
          totalItems: siswaDiKelas.count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all siswa di kelas error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const assignSiswaToKelas = async (req, res) => {
  try {
    const { siswa_id, kelas_id, semester_id } = req.body;

    // Cek apakah siswa sudah terdaftar di kelas pada semester yang sama
    const existingAssignment = await SiswaDiKelas.findOne({
      where: { siswa_id, semester_id }
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'Siswa sudah terdaftar di kelas pada semester ini'
      });
    }

    const siswaDiKelas = await SiswaDiKelas.create({
      siswa_id,
      kelas_id,
      semester_id
    });

    const newAssignment = await SiswaDiKelas.findByPk(siswaDiKelas.id, {
      include: [
        {
          model: Siswa,
          as: 'siswa',
          attributes: ['id', 'nama_lengkap', 'nis', 'nisn']
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
      message: 'Siswa berhasil ditambahkan ke kelas',
      data: newAssignment
    });
  } catch (error) {
    console.error('Assign siswa to kelas error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const removeSiswaFromKelas = async (req, res) => {
  try {
    const { id } = req.params;

    const siswaDiKelas = await SiswaDiKelas.findByPk(id);
    if (!siswaDiKelas) {
      return res.status(404).json({
        success: false,
        message: 'Data siswa di kelas tidak ditemukan'
      });
    }

    await siswaDiKelas.destroy();

    res.json({
      success: true,
      message: 'Siswa berhasil dihapus dari kelas'
    });
  } catch (error) {
    console.error('Remove siswa from kelas error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const getSiswaByKelas = async (req, res) => {
  try {
    const { kelas_id, semester_id } = req.query;

    if (!kelas_id || !semester_id) {
      return res.status(400).json({
        success: false,
        message: 'kelas_id dan semester_id diperlukan'
      });
    }

    const siswaDiKelas = await SiswaDiKelas.findAll({
      where: { kelas_id, semester_id },
      include: [
        {
          model: Siswa,
          as: 'siswa',
          attributes: ['id', 'nama_lengkap', 'nis', 'nisn', 'jenis_kelamin']
        }
      ],
      order: [['siswa', 'nama_lengkap', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        siswa_di_kelas: siswaDiKelas
      }
    });
  } catch (error) {
    console.error('Get siswa by kelas error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

module.exports = {
  getAllSiswaDiKelas,
  assignSiswaToKelas,
  removeSiswaFromKelas,
  getSiswaByKelas
};