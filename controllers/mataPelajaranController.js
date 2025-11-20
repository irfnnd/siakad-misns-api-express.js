const {
  MataPelajaran,
  Pengajaran,
  Kelas,
  Pegawai,
  NilaiRapor,
} = require("../models");
const { Op } = require("sequelize");

const mataPelajaranController = {
  // Get all mata pelajaran dengan pagination
  getAllMataPelajaran: async (req, res) => {
    try {
      const { page = 1, limit = 10, search, kelompok } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};

      // Filter Search (Kode atau Nama)
      if (search) {
        whereClause[Op.or] = [
          { kode_mapel: { [Op.like]: `%${search}%` } }, // Gunakan Op.like untuk kompatibilitas umum (MySQL/Postgres)
          { nama_mapel: { [Op.like]: `%${search}%` } },
        ];
      }

      // Filter Kelompok (jika dikirim dari frontend)
      if (kelompok && kelompok !== "Semua") {
        whereClause.kelompok = kelompok;
      }

      const mataPelajaran = await MataPelajaran.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["kode_mapel", "ASC"]],
      });

      res.json({
        success: true,
        data: {
          mata_pelajaran: mataPelajaran.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(mataPelajaran.count / limit),
            totalItems: mataPelajaran.count,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    } catch (error) {
      console.error("Get all mata pelajaran error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  },

  // Get mata pelajaran by ID
  getMataPelajaranById: async (req, res) => {
    try {
      const { id } = req.params;

      const mataPelajaran = await MataPelajaran.findByPk(id, {
        // Include opsional: melihat di kelas mana saja mapel ini diajarkan
        include: [
          {
            model: Pengajaran,
            as: "pengajaran",
            required: false,
            include: [
              {
                model: Kelas,
                as: "kelas",
                attributes: ["nama_kelas"],
              },
              {
                model: Pegawai,
                as: "guru",
                attributes: ["nama_lengkap"],
              },
            ],
          },
        ],
      });

      if (!mataPelajaran) {
        return res.status(404).json({
          success: false,
          message: "Mata pelajaran tidak ditemukan",
        });
      }

      res.json({
        success: true,
        data: mataPelajaran,
      });
    } catch (error) {
      console.error("Get mata pelajaran by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  },

  // Create new mata pelajaran
  createMataPelajaran: async (req, res) => {
    try {
      const { kode_mapel, nama_mapel, kelompok, kkm, status } = req.body;

      // 1. Validasi Manual
      const errors = [];
      if (!kode_mapel) errors.push("Kode mapel harus diisi");
      if (!nama_mapel) errors.push("Nama mapel harus diisi");
      if (!kelompok) errors.push("Kelompok mapel harus diisi");
      if (kkm === undefined || kkm === null || kkm === "")
        errors.push("KKM harus diisi");

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Data tidak valid",
          errors: errors,
        });
      }

      // Validasi Range KKM
      if (kkm < 0 || kkm > 100) {
        return res.status(400).json({
          success: false,
          message: "KKM harus antara 0 - 100",
        });
      }

      // 2. Cek Duplikat Kode Mapel
      const existingKode = await MataPelajaran.findOne({
        where: { kode_mapel },
      });
      if (existingKode) {
        return res.status(400).json({
          success: false,
          message: "Kode mata pelajaran sudah digunakan",
        });
      }

      // 3. Create Data
      const newMataPelajaran = await MataPelajaran.create({
        kode_mapel: kode_mapel.toUpperCase(), // Standardisasi kode jadi uppercase
        nama_mapel,
        kelompok,
        kkm: parseInt(kkm),
        status: status || 'Aktif',
      });

      res.status(201).json({
        success: true,
        message: "Mata pelajaran berhasil dibuat",
        data: newMataPelajaran,
      });
    } catch (error) {
      console.error("Create mata pelajaran error:", error);

      // Handle Validasi Sequelize (misal Enum atau Unique)
      if (
        error.name === "SequelizeValidationError" ||
        error.name === "SequelizeUniqueConstraintError"
      ) {
        return res.status(400).json({
          success: false,
          message: error.errors[0].message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  },

  // Update mata pelajaran
  updateMataPelajaran: async (req, res) => {
    try {
      const { id } = req.params;
      const { kode_mapel, nama_mapel, kelompok, kkm, status } = req.body;

      const mataPelajaran = await MataPelajaran.findByPk(id);
      if (!mataPelajaran) {
        return res.status(404).json({
          success: false,
          message: "Mata pelajaran tidak ditemukan",
        });
      }

      // 1. Cek Unik Kode Mapel (jika berubah)
      if (kode_mapel && kode_mapel !== mataPelajaran.kode_mapel) {
        const existingKode = await MataPelajaran.findOne({
          where: { kode_mapel },
        });
        if (existingKode) {
          return res.status(400).json({
            success: false,
            message: "Kode mata pelajaran sudah digunakan",
          });
        }
      }

      // 2. Update Data
      await mataPelajaran.update({
        kode_mapel: kode_mapel
          ? kode_mapel.toUpperCase()
          : mataPelajaran.kode_mapel,
        nama_mapel: nama_mapel || mataPelajaran.nama_mapel,
        kelompok: kelompok || mataPelajaran.kelompok,
        kkm: kkm !== undefined ? parseInt(kkm) : mataPelajaran.kkm,
        status: status !== undefined ? status : mataPelajaran.status,
      });

      res.json({
        success: true,
        message: "Mata pelajaran berhasil diupdate",
        data: mataPelajaran,
      });
    } catch (error) {
      console.error("Update mata pelajaran error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  },

  // Delete mata pelajaran
  deleteMataPelajaran: async (req, res) => {
    try {
      const { id } = req.params;

      const mataPelajaran = await MataPelajaran.findByPk(id);
      if (!mataPelajaran) {
        return res.status(404).json({
          success: false,
          message: "Mata pelajaran tidak ditemukan",
        });
      }

      // 1. Cek Relasi Pengajaran
      const pengajaranCount = await Pengajaran.count({
        where: { mapel_id: id },
      });
      if (pengajaranCount > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Gagal hapus: Mapel ini masih aktif digunakan dalam pengajaran (jadwal/guru).",
        });
      }

      // 2. Cek Relasi Nilai Rapor (Jika ada tabel NilaiRapor)
      const nilaiRaporCount = await NilaiRapor.count({
        where: { mapel_id: id },
      });
      if (nilaiRaporCount > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Gagal hapus: Mapel ini sudah memiliki nilai rapor tersimpan.",
        });
      }

      // 3. Hapus
      await mataPelajaran.destroy();

      res.json({
        success: true,
        message: "Mata pelajaran berhasil dihapus",
      });
    } catch (error) {
      console.error("Delete mata pelajaran error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  },

  // Stats
  getMataPelajaranStats: async (req, res) => {
    try {
      const totalMapel = await MataPelajaran.count();
      // Hitung per kelompok
      const tematik = await MataPelajaran.count({
        where: { kelompok: "Tematik" },
      });
      const umum = await MataPelajaran.count({ where: { kelompok: "Umum" } });
      const muatanLokal = await MataPelajaran.count({
        where: { kelompok: "Muatan Lokal" },
      }); // Sesuaikan enum jika beda

      res.json({
        success: true,
        data: {
          total_mapel: totalMapel,
          detail: { tematik, umum, muatan_lokal: muatanLokal },
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error server" });
    }
  },
  searchMataPelajaran: async (req, res) => {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: "Query pencarian harus diisi",
        });
      }

      const mataPelajaran = await MataPelajaran.findAll({
        where: {
          [Op.or]: [
            { kode_mapel: { [Op.iLike]: `%${q}%` } },
            { nama_mapel: { [Op.iLike]: `%${q}%` } },
          ],
        },
        limit: 10,
        order: [["kode_mapel", "ASC"]],
      });
      res.json({
        success: true,
        data: mataPelajaran,
      });
    } catch (error) {
      console.error("Search mata pelajaran error:", error);

      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  },
};

module.exports = mataPelajaranController;
