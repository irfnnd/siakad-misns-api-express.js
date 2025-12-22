const { Siswa, User, Kelas, SiswaDiKelas, Semester } = require("../models");
const bcrypt = require("bcryptjs");

const siswaController = {
  // Get all siswa dengan pagination
  getAllSiswa: async (req, res) => {
    try {
      const { page = 1, limit = 10, status, kelas_id } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (status) whereClause.status = status;

      let includeClause = [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email'],
          required: false // Left Join (User boleh null)
        }
      ];

      if (kelas_id) {
        includeClause.push({
          model: Kelas,
          as: "kelas", // Alias harus sama dengan di models/index.js
          required: true, // INNER JOIN: Hanya ambil siswa yang punya kelas ini
          through: {
            attributes: [], // Jangan tampilkan data tabel pivot
            where: { kelas_id: kelas_id }, // Filter spesifik ID kelas di tabel pivot
          },
        });
      } else {
        // Jika tidak difilter, tetap tampilkan info kelas (opsional)
        includeClause.push({
          model: Kelas,
          as: "kelas",
          required: false, // LEFT JOIN: Tampilkan siswa meski belum punya kelas
          through: { attributes: [] },
        });
      }

      const siswa = await Siswa.findAndCountAll({
        where: whereClause,
        include: includeClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["nama_lengkap", "ASC"]],
      });

      res.json({
        success: true,
        data: {
          siswa: siswa.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(siswa.count / limit),
            totalItems: siswa.count,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    } catch (error) {
      console.error("Get all siswa error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  },

  // Get siswa by ID
  getSiswaById: async (req, res) => {
    try {
      const { id } = req.params;

      const siswa = await Siswa.findByPk(id, {
        include: [
          {
            model: Kelas,
            as: "kelas",
            through: { attributes: [] },
            required: false,
          },
        ],
      });

      if (!siswa) {
        return res.status(404).json({
          success: false,
          message: "Siswa tidak ditemukan",
        });
      }

      res.json({
        success: true,
        data: siswa,
      });
    } catch (error) {
      console.error("Get siswa by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  },

createSiswa: async (req, res) => {
    try {
      const {
        nama_lengkap,
        nis,
        nisn,
        jenis_kelamin,
        tempat_lahir,
        tanggal_lahir,
        telepon_ortu,
        alamat,
        status,
        user_id,
        kelas // <--- AMBIL DATA KELAS (String, misal "1A")
      } = req.body;

      // Validasi manual
      const errors = [];
      if (!nama_lengkap) errors.push("Nama lengkap harus diisi");
      if (!nis) errors.push("NIS harus diisi");
      if (!jenis_kelamin) errors.push("Jenis kelamin harus diisi");
      if (!tanggal_lahir) errors.push("Tanggal lahir harus diisi");

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Data tidak valid",
          errors: errors,
        });
      }

      // Cek NIS Duplicate
      const existingNis = await Siswa.findOne({ where: { nis } });
      if (existingNis) return res.status(400).json({ success: false, message: "NIS sudah digunakan" });

      // Cek NISN Duplicate
      if (nisn) {
        const existingNisn = await Siswa.findOne({ where: { nisn } });
        if (existingNisn) return res.status(400).json({ success: false, message: "NISN sudah digunakan" });
      }

      // --- PERBAIKAN 1: Cari Semester Aktif ---
      // Agar tidak hardcode '1', kita cari semester yang statusnya 'Aktif'
      let activeSemesterId = 1; // Default fallback
      const activeSemester = await Semester.findOne({ where: { status: 'Aktif' } });
      
      if (activeSemester) {
        activeSemesterId = activeSemester.id;
      } else {
        // Opsional: Return error jika sistem sangat ketat
        // return res.status(400).json({ success: false, message: "Belum ada Semester Aktif. Harap atur di menu Kurikulum." });
        console.warn("⚠️ Tidak ada semester aktif ditemukan, menggunakan ID default: 1");
      }

      // Mulai Transaksi Database
      const transaction = await Siswa.sequelize.transaction();

      try {
        // 1. Buat Data Siswa
        const newSiswa = await Siswa.create(
          {
            // --- PERBAIKAN 2: Handle user_id kosong ---
            user_id: user_id || null, 
            nama_lengkap,
            nis,
            nisn,
            jenis_kelamin,
            tempat_lahir,
            tanggal_lahir,
            telepon_ortu,
            alamat,
            status: status || "Aktif",
          },
          { transaction }
        );

        // 2. LOGIKA TAMBAHAN: HUBUNGKAN KE KELAS
        if (kelas) {
          // Cari ID Kelas berdasarkan nama (karena frontend kirim "1A", "1B")
          const kelasInstance = await Kelas.findOne({ where: { nama_kelas: kelas } });
          
          if (kelasInstance) {
            // Gunakan method magic Sequelize 'setKelas'
            // --- PERBAIKAN 3: Gunakan activeSemesterId ---
            await newSiswa.setKelas([kelasInstance], { 
                through: { semester_id: activeSemesterId }, 
                transaction 
            });
          }
        }

        await transaction.commit();

        // 3. Ambil data siswa yang baru dibuat BESERTA RELASI KELASNYA
        const createdSiswa = await Siswa.findByPk(newSiswa.id, {
          include: [
            {
              model: User,
              as: "user",
              required: false,
              attributes: { exclude: ["password_hash"] },
            },
            {
              model: Kelas,
              as: "kelas",
              through: { attributes: [] } // Sertakan data kelas di response
            }
          ],
        });

        res.status(201).json({
          success: true,
          message: "Siswa berhasil dibuat",
          data: createdSiswa,
        });

      } catch (error) {
        await transaction.rollback();
        
        // Handle unique constraint errors
        if (error.name === "SequelizeUniqueConstraintError") {
          const field = error.errors[0]?.path;
          const msg = field === 'nis' ? 'NIS sudah digunakan' : (field === 'nisn' ? 'NISN sudah digunakan' : error.errors[0].message);
          return res.status(400).json({ success: false, message: msg });
        }
        
        // Handle Foreign Key Error (Misal Semester ID 1 tidak ada dan Fallback gagal)
        if (error.name === "SequelizeForeignKeyConstraintError") {
           return res.status(400).json({ success: false, message: "Terjadi kesalahan data referensi (Semester/Kelas tidak valid)." });
        }

        throw error;
      }
    } catch (error) {
      console.error("Create siswa error:", error);
      res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
  },

  // Update siswa
  updateSiswa: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Pisahkan 'kelas' dari sisa data body
      // Agar 'kelas' tidak ikut di-update ke tabel Siswa (karena tidak ada kolomnya)
      const { kelas, ...updateData } = req.body;

      const siswa = await Siswa.findByPk(id);
      if (!siswa) {
        return res.status(404).json({ success: false, message: "Siswa tidak ditemukan" });
      }

      // Cek Unik NIS jika berubah
      if (updateData.nis && updateData.nis !== siswa.nis) {
        const existingNis = await Siswa.findOne({ where: { nis: updateData.nis } });
        if (existingNis) return res.status(400).json({ success: false, message: "NIS sudah digunakan" });
      }
      
      // Cek Unik NISN jika berubah
      if (updateData.nisn && updateData.nisn !== siswa.nisn) {
        const existingNisn = await Siswa.findOne({ where: { nisn: updateData.nisn } });
        if (existingNisn) return res.status(400).json({ success: false, message: "NISN sudah digunakan" });
      }

      // 1. Update Data Biodata Siswa
      await siswa.update(updateData);

      // 2. LOGIKA TAMBAHAN: UPDATE KELAS
      if (kelas) {
        const kelasInstance = await Kelas.findOne({ where: { nama_kelas: kelas } });
        
        if (kelasInstance) {
          // 'setKelas' akan mengganti relasi lama dengan yang baru
          // Ini otomatis menghapus entry lama di SiswaDiKelas dan buat baru
          await siswa.setKelas([kelasInstance], { 
             through: { semester_id: 1 } // Default semester
          });
        }
      }

      // 3. Fetch ulang data terbaru termasuk Kelas baru
      const updatedSiswa = await Siswa.findByPk(id, {
        include: [
          {
            model: User,
            as: "user",
            attributes: { exclude: ["password_hash"] },
          },
          {
             model: Kelas,
             as: "kelas",
             through: { attributes: [] } // Include kelas agar frontend langsung update
          }
        ],
      });

      res.json({
        success: true,
        message: "Siswa berhasil diupdate",
        data: updatedSiswa,
      });

    } catch (error) {
      console.error("Update siswa error:", error);
      res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
  },

  // Update siswa status
  updateSiswaStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const siswa = await Siswa.findByPk(id);
      if (!siswa) {
        return res.status(404).json({
          success: false,
          message: "Siswa tidak ditemukan",
        });
      }

      await siswa.update({ status });

      res.json({
        success: true,
        message: `Status siswa berhasil diubah menjadi ${status}`,
        data: {
          id: siswa.id,
          nama_lengkap: siswa.nama_lengkap,
          status: siswa.status,
        },
      });
    } catch (error) {
      console.error("Update siswa status error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  },

  // Delete siswa
  deleteSiswa: async (req, res) => {
    try {
      const { id } = req.params;

      const siswa = await Siswa.findByPk(id);
      if (!siswa) {
        return res.status(404).json({
          success: false,
          message: "Siswa tidak ditemukan",
        });
      }

      // Start transaction
      const transaction = await Siswa.sequelize.transaction();

      try {
        // Delete user account if exists
        if (siswa.user_id) {
          await User.destroy({ where: { id: siswa.user_id }, transaction });
        }

        // Delete siswa
        await Siswa.destroy({ where: { id }, transaction });

        await transaction.commit();

        res.json({
          success: true,
          message: "Siswa berhasil dihapus",
        });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error("Delete siswa error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  },

  // Get siswa statistics
  getSiswaStats: async (req, res) => {
    try {
      const totalSiswa = await Siswa.count();
      const aktifSiswa = await Siswa.count({ where: { status: "Aktif" } });
      const lulusSiswa = await Siswa.count({ where: { status: "Lulus" } });
      const pindahSiswa = await Siswa.count({ where: { status: "Pindah" } });

      // Stats by gender
      const lakiLaki = await Siswa.count({
        where: { jenis_kelamin: "Laki-laki" },
      });
      const perempuan = await Siswa.count({
        where: { jenis_kelamin: "Perempuan" },
      });

      res.json({
        success: true,
        data: {
          total_siswa: totalSiswa,
          by_status: {
            aktif: aktifSiswa,
            lulus: lulusSiswa,
            pindah: pindahSiswa,
          },
          by_gender: {
            laki_laki: lakiLaki,
            perempuan: perempuan,
          },
        },
      });
    } catch (error) {
      console.error("Get siswa stats error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  },
};

module.exports = siswaController;
