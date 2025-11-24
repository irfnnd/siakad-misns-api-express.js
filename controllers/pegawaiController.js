const { Pegawai, User } = require('../models');

const getAllPegawai = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, jabatan } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (jabatan) whereClause.jabatan = jabatan;

    const includeClause = [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'role', 'status']
      }
    ];

    if (search) {
      whereClause.nama_lengkap = { [Op.like]: `%${search}%` };
    }

    const pegawai = await Pegawai.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['nama_lengkap', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        pegawai: pegawai.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(pegawai.count / limit),
          totalItems: pegawai.count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all pegawai error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const getPegawaiById = async (req, res) => {
  try {
    const { id } = req.params;

    const pegawai = await Pegawai.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'role', 'status']
        }
      ]
    });

    if (!pegawai) {
      return res.status(404).json({
        success: false,
        message: 'Pegawai tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: pegawai
    });
  } catch (error) {
    console.error('Get pegawai by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const createPegawai = async (req, res) => {
  try {
    const { 
      user_id, 
      nama_lengkap, 
      nip, 
      jabatan, 
      telepon, 
      alamat 
    } = req.body;

    // Cek apakah NIP sudah ada
    const existingPegawai = await Pegawai.findOne({ where: { nip } });
    if (existingPegawai) {
      return res.status(400).json({
        success: false,
        message: 'NIP sudah terdaftar'
      });
    }

    const pegawai = await Pegawai.create({
      user_id,
      nama_lengkap,
      nip,
      jabatan,
      telepon,
      alamat
    });

    const newPegawai = await Pegawai.findByPk(pegawai.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'role', 'status']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Pegawai berhasil dibuat',
      data: newPegawai
    });
  } catch (error) {
    console.error('Create pegawai error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const updatePegawai = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nama_lengkap, 
      nip, 
      jabatan, 
      telepon, 
      alamat 
    } = req.body;

    const pegawai = await Pegawai.findByPk(id);
    if (!pegawai) {
      return res.status(404).json({
        success: false,
        message: 'Pegawai tidak ditemukan'
      });
    }

    // Cek NIP jika diubah
    if (nip && nip !== pegawai.nip) {
      const existingPegawai = await Pegawai.findOne({ where: { nip } });
      if (existingPegawai) {
        return res.status(400).json({
          success: false,
          message: 'NIP sudah terdaftar'
        });
      }
    }

    await pegawai.update({
      nama_lengkap: nama_lengkap || pegawai.nama_lengkap,
      nip: nip || pegawai.nip,
      jabatan: jabatan || pegawai.jabatan,
      telepon: telepon || pegawai.telepon,
      alamat: alamat || pegawai.alamat
    });

    const updatedPegawai = await Pegawai.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'role', 'status']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Pegawai berhasil diupdate',
      data: updatedPegawai
    });
  } catch (error) {
    console.error('Update pegawai error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const deletePegawai = async (req, res) => {
  try {
    const { id } = req.params;

    const pegawai = await Pegawai.findByPk(id);
    if (!pegawai) {
      return res.status(404).json({
        success: false,
        message: 'Pegawai tidak ditemukan'
      });
    }

    await pegawai.destroy();

    return res.json({
      success: true,
      message: 'Pegawai berhasil dihapus'
    });

  } catch (error) {
    console.error("Delete pegawai error:", error);

    // Validasi FK — code 23503
    if (error?.original?.code === "23503") {
      const constraint = error?.original?.constraint;

      // --- Deteksi berdasarkan constraint name ---
      let message = "Pegawai tidak dapat dihapus karena masih digunakan pada data lain.";

      if (constraint === "jadwal_pelajaran_guru_id_fkey") {
        message = "Pegawai tidak dapat dihapus karena masih menjadi guru pada jadwal pelajaran.";
      }

      if (constraint === "kelas_wali_kelas_id_fkey") {
        message = "Pegawai tidak dapat dihapus karena masih menjadi wali kelas pada data kelas.";
      }

      return res.status(400).json({
        success: false,
        message
      });
    }

    // Fallback — error server umum
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server."
    });
  }
};



module.exports = {
  getAllPegawai,
  getPegawaiById,
  createPegawai,
  updatePegawai,
  deletePegawai
};