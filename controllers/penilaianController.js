const { Penilaian, Pengajaran, MataPelajaran, Kelas, Semester, Pegawai, Nilai } = require('../models');
const { Op } = require('sequelize');

const getAllPenilaian = async (req, res) => {
  try {
    const { page = 1, limit = 10, pengajaran_id, tipe, kategori, search, kelas_id, semester_id } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (pengajaran_id) whereClause.pengajaran_id = pengajaran_id;
    if (tipe) whereClause.tipe = tipe;
    // --- PERBAIKAN: Filter Kategori ---
    if (kategori) whereClause.kategori = kategori;

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

    const penilaian = await Penilaian.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['id', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        penilaian: penilaian.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(penilaian.count / limit),
          totalItems: penilaian.count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all penilaian error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

const getPenilaianById = async (req, res) => {
  try {
    const { id } = req.params;

    const penilaian = await Penilaian.findByPk(id, {
      include: [
        {
          model: Pengajaran,
          as: 'pengajaran',
          attributes: ['id'],
          include: [
            { model: MataPelajaran, as: 'mata_pelajaran', attributes: ['id', 'kode_mapel', 'nama_mapel'] },
            { model: Kelas, as: 'kelas', attributes: ['id', 'nama_kelas', 'tingkat'] },
            { model: Semester, as: 'semester', attributes: ['id', 'nama', 'status'] },
            { model: Pegawai, as: 'guru', attributes: ['id', 'nama_lengkap', 'nip'] }
          ]
        }
      ]
    });

    if (!penilaian) {
      return res.status(404).json({ success: false, message: 'Penilaian tidak ditemukan' });
    }

    res.json({ success: true, data: penilaian });
  } catch (error) {
    console.error('Get penilaian by id error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const getPenilaianByPengajaran = async (req, res) => {
  try {
    const { pengajaran_id } = req.params;
    const { tipe, kategori } = req.query;

    const whereClause = { pengajaran_id };
    if (tipe) whereClause.tipe = tipe;
    // --- PERBAIKAN: Filter Kategori ---
    if (kategori) whereClause.kategori = kategori;

    const penilaian = await Penilaian.findAll({
      where: whereClause,
      include: [
        {
          model: Pengajaran,
          as: 'pengajaran',
          attributes: ['id'],
          include: [
            { model: MataPelajaran, as: 'mata_pelajaran', attributes: ['id', 'kode_mapel', 'nama_mapel'] },
            { model: Kelas, as: 'kelas', attributes: ['id', 'nama_kelas', 'tingkat'] }
          ]
        }
      ],
      // Urutkan berdasarkan Kategori dulu, lalu Tipe, lalu Nama
      order: [['kategori', 'DESC'], ['tipe', 'ASC'], ['nama_penilaian', 'ASC']]
    });

    // Hitung jumlah nilai untuk setiap penilaian
    const penilaianWithCount = await Promise.all(
      penilaian.map(async (item) => {
        const nilaiCount = await Nilai.count({
          where: { penilaian_id: item.id }
        });
        
        return {
          ...item.toJSON(),
          jumlah_nilai: nilaiCount
        };
      })
    );

    res.json({
      success: true,
      data: {
        penilaian: penilaianWithCount
      }
    });
  } catch (error) {
    console.error('Get penilaian by pengajaran error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const getPenilaianByGuru = async (req, res) => {
  try {
    const { guru_id } = req.params;
    const { semester_id, tipe, kategori } = req.query;

    // Filter local
    const whereClause = {};
    if (tipe) whereClause.tipe = tipe;
    if (kategori) whereClause.kategori = kategori;

    const penilaian = await Penilaian.findAll({
      include: [
        {
          model: Pengajaran,
          as: 'pengajaran',
          attributes: ['id'],
          where: { guru_id },
          include: [
            { model: MataPelajaran, as: 'mata_pelajaran', attributes: ['id', 'kode_mapel', 'nama_mapel'] },
            { model: Kelas, as: 'kelas', attributes: ['id', 'nama_kelas', 'tingkat'] },
            { 
              model: Semester, 
              as: 'semester', 
              attributes: ['id', 'nama', 'status'],
              where: semester_id ? { id: semester_id } : undefined
            }
          ]
        }
      ],
      where: whereClause,
      order: [['pengajaran', 'kelas', 'tingkat', 'ASC'], ['pengajaran', 'kelas', 'nama_kelas', 'ASC'], ['tipe', 'ASC']]
    });

    res.json({
      success: true,
      data: { penilaian }
    });
  } catch (error) {
    console.error('Get penilaian by guru error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// --- PERBAIKAN: CREATE PENILAIAN DENGAN KATEGORI ---
const createPenilaian = async (req, res) => {
  try {
    const { pengajaran_id, nama_penilaian, tipe, kategori } = req.body;

    // Validasi tipe penilaian
    const validTipe = ['Harian', 'PTS', 'PAS'];
    if (!validTipe.includes(tipe)) {
      return res.status(400).json({ success: false, message: 'Tipe penilaian harus Harian, PTS, atau PAS' });
    }

    // Validasi kategori (Default Pengetahuan jika kosong)
    const validKategori = ['Pengetahuan', 'Keterampilan'];
    const selectedKategori = kategori || 'Pengetahuan';

    if (!validKategori.includes(selectedKategori)) {
        return res.status(400).json({ success: false, message: 'Kategori harus Pengetahuan atau Keterampilan' });
    }

    // Cek apakah pengajaran_id valid
    const pengajaran = await Pengajaran.findByPk(pengajaran_id);
    if (!pengajaran) {
      return res.status(400).json({ success: false, message: 'Pengajaran tidak ditemukan' });
    }

    // Cek duplikasi nama penilaian DALAM KATEGORI YANG SAMA
    const existingPenilaian = await Penilaian.findOne({
      where: { 
        pengajaran_id, 
        nama_penilaian,
        kategori: selectedKategori 
      }
    });

    if (existingPenilaian) {
      return res.status(400).json({ success: false, message: `Penilaian '${nama_penilaian}' sudah ada di kategori ${selectedKategori}` });
    }

    const penilaian = await Penilaian.create({
      pengajaran_id,
      nama_penilaian,
      tipe,
      kategori: selectedKategori
    });

    const newPenilaian = await Penilaian.findByPk(penilaian.id, {
      include: [
        {
          model: Pengajaran,
          as: 'pengajaran',
          attributes: ['id'],
          include: [
            { model: MataPelajaran, as: 'mata_pelajaran', attributes: ['id', 'kode_mapel', 'nama_mapel'] },
            { model: Kelas, as: 'kelas', attributes: ['id', 'nama_kelas', 'tingkat'] },
            { model: Semester, as: 'semester', attributes: ['id', 'nama', 'status'] }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Penilaian berhasil dibuat',
      data: newPenilaian
    });
  } catch (error) {
    console.error('Create penilaian error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// --- PERBAIKAN: UPDATE PENILAIAN DENGAN KATEGORI ---
const updatePenilaian = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_penilaian, tipe, kategori } = req.body;

    const penilaian = await Penilaian.findByPk(id);
    if (!penilaian) {
      return res.status(404).json({ success: false, message: 'Penilaian tidak ditemukan' });
    }

    if (tipe) {
      const validTipe = ['Harian', 'PTS', 'PAS'];
      if (!validTipe.includes(tipe)) {
        return res.status(400).json({ success: false, message: 'Tipe tidak valid' });
      }
    }

    // Cek duplikasi jika nama/kategori berubah
    if (nama_penilaian || kategori) {
        const checkNama = nama_penilaian || penilaian.nama_penilaian;
        const checkKategori = kategori || penilaian.kategori;

        if (checkNama !== penilaian.nama_penilaian || checkKategori !== penilaian.kategori) {
             const existingPenilaian = await Penilaian.findOne({
                where: { 
                    pengajaran_id: penilaian.pengajaran_id, 
                    nama_penilaian: checkNama,
                    kategori: checkKategori,
                    id: { [Op.ne]: id }
                }
             });
             if (existingPenilaian) {
                 return res.status(400).json({ success: false, message: 'Penilaian dengan nama dan kategori tersebut sudah ada' });
             }
        }
    }

    await penilaian.update({
      nama_penilaian: nama_penilaian || penilaian.nama_penilaian,
      tipe: tipe || penilaian.tipe,
      kategori: kategori || penilaian.kategori
    });

    const updatedPenilaian = await Penilaian.findByPk(id, {
       // Include sama seperti getById...
       include: [{ model: Pengajaran, as: 'pengajaran' }] 
    });

    res.json({
      success: true,
      message: 'Penilaian berhasil diupdate',
      data: updatedPenilaian
    });
  } catch (error) {
    console.error('Update penilaian error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const deletePenilaian = async (req, res) => {
  try {
    const { id } = req.params;
    const penilaian = await Penilaian.findByPk(id);
    if (!penilaian) {
      return res.status(404).json({ success: false, message: 'Penilaian tidak ditemukan' });
    }

    const nilaiCount = await Nilai.count({ where: { penilaian_id: id } });

    if (nilaiCount > 0) {
      return res.status(400).json({ success: false, message: 'Tidak dapat menghapus penilaian yang sudah memiliki nilai' });
    }

    await penilaian.destroy();
    res.json({ success: true, message: 'Penilaian berhasil dihapus' });
  } catch (error) {
    console.error('Delete penilaian error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const getStatistikPenilaian = async (req, res) => {
  try {
    const { pengajaran_id, semester_id } = req.query;
    const whereClause = {};
    if (pengajaran_id) whereClause.pengajaran_id = pengajaran_id;

    const penilaian = await Penilaian.findAll({
      where: whereClause,
      include: [
        {
          model: Pengajaran,
          as: 'pengajaran',
          attributes: ['id'],
          include: [
            { model: MataPelajaran, as: 'mata_pelajaran', attributes: ['id', 'nama_mapel'] },
            { model: Kelas, as: 'kelas', attributes: ['id', 'nama_kelas', 'tingkat'] },
            { model: Semester, as: 'semester', attributes: ['id', 'nama', 'status'], where: semester_id ? { id: semester_id } : undefined }
          ]
        }
      ]
    });

    const statistik = {
      total_penilaian: penilaian.length,
      per_tipe: { Harian: 0, PTS: 0, PAS: 0 },
      // --- PERBAIKAN: Statistik per Kategori ---
      per_kategori: { Pengetahuan: 0, Keterampilan: 0 },
      per_mapel: {},
      per_kelas: {}
    };

    for (const item of penilaian) {
      statistik.per_tipe[item.tipe]++;
      // Hitung Kategori
      if (item.kategori) statistik.per_kategori[item.kategori] = (statistik.per_kategori[item.kategori] || 0) + 1;

      const mapelName = item.pengajaran.mata_pelajaran.nama_mapel;
      statistik.per_mapel[mapelName] = (statistik.per_mapel[mapelName] || 0) + 1;

      const kelasName = item.pengajaran.kelas.nama_kelas;
      statistik.per_kelas[kelasName] = (statistik.per_kelas[kelasName] || 0) + 1;
    }

    res.json({ success: true, data: { statistik } });
  } catch (error) {
    console.error('Get statistik penilaian error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

module.exports = {
  getAllPenilaian,
  getPenilaianById,
  getPenilaianByPengajaran,
  getPenilaianByGuru,
  createPenilaian,
  updatePenilaian,
  deletePenilaian,
  getStatistikPenilaian
};