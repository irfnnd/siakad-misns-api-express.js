const { NilaiRapor, Rapor, MataPelajaran, Siswa, Semester } = require('../models');
const { Op } = require('sequelize');

const nilaiRaporController = {
  // Get all nilai rapor dengan pagination
  getAllNilaiRapor: async (req, res) => {
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
            as: 'mapel', // Sesuaikan alias dengan models/index.js
            attributes: ['id', 'kode_mapel', 'nama_mapel']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['id', 'ASC']]
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
      res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
  },

  // Get nilai rapor by ID
  getNilaiRaporById: async (req, res) => {
    try {
      const { id } = req.params;

      const nilaiRapor = await NilaiRapor.findByPk(id, {
        include: [
          {
            model: Rapor,
            as: 'rapor',
            include: [{ model: Siswa, as: 'siswa' }]
          },
          {
            model: MataPelajaran,
            as: 'mapel'
          }
        ]
      });

      if (!nilaiRapor) {
        return res.status(404).json({ success: false, message: 'Nilai rapor tidak ditemukan' });
      }

      res.json({ success: true, data: nilaiRapor });
    } catch (error) {
      console.error('Get nilai rapor by id error:', error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
  },

  // Get nilai rapor by Rapor ID (Semua mapel dalam 1 rapor)
  getNilaiRaporByRapor: async (req, res) => {
    try {
      const { rapor_id } = req.params;

      const nilaiRapor = await NilaiRapor.findAll({
        where: { rapor_id },
        include: [
          {
            model: MataPelajaran,
            as: 'mapel',
            attributes: ['id', 'kode_mapel', 'nama_mapel']
          }
        ],
        order: [['mapel', 'nama_mapel', 'ASC']]
      });

      res.json({ success: true, data: { nilai_rapor: nilaiRapor } });
    } catch (error) {
      console.error('Get nilai rapor by rapor error:', error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
  },

  // Create new nilai rapor
  createNilaiRapor: async (req, res) => {
    try {
      const { 
        rapor_id, 
        mapel_id, 
        nilai_pengetahuan, predikat_pengetahuan, deskripsi_pengetahuan,
        nilai_keterampilan, predikat_keterampilan, deskripsi_keterampilan
      } = req.body;

      // Validasi Nilai (0-100)
      if ((nilai_pengetahuan < 0 || nilai_pengetahuan > 100) || (nilai_keterampilan < 0 || nilai_keterampilan > 100)) {
        return res.status(400).json({ success: false, message: 'Nilai harus antara 0 - 100' });
      }

      // Cek Duplikat
      const existing = await NilaiRapor.findOne({ where: { rapor_id, mapel_id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Nilai mapel ini sudah ada di rapor tersebut' });
      }

      const nilaiRapor = await NilaiRapor.create({
        rapor_id,
        mapel_id,
        nilai_pengetahuan, predikat_pengetahuan, deskripsi_pengetahuan,
        nilai_keterampilan, predikat_keterampilan, deskripsi_keterampilan
      });

      res.status(201).json({ success: true, message: 'Nilai rapor berhasil dibuat', data: nilaiRapor });
    } catch (error) {
      console.error('Create nilai rapor error:', error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
  },

  // Update nilai rapor
  updateNilaiRapor: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        nilai_pengetahuan, predikat_pengetahuan, deskripsi_pengetahuan,
        nilai_keterampilan, predikat_keterampilan, deskripsi_keterampilan
      } = req.body;

      const nilaiRapor = await NilaiRapor.findByPk(id);
      if (!nilaiRapor) {
        return res.status(404).json({ success: false, message: 'Nilai rapor tidak ditemukan' });
      }

      // Validasi Nilai
      if (nilai_pengetahuan !== undefined && (nilai_pengetahuan < 0 || nilai_pengetahuan > 100)) {
         return res.status(400).json({ success: false, message: 'Nilai Pengetahuan tidak valid' });
      }
      if (nilai_keterampilan !== undefined && (nilai_keterampilan < 0 || nilai_keterampilan > 100)) {
         return res.status(400).json({ success: false, message: 'Nilai Keterampilan tidak valid' });
      }

      await nilaiRapor.update({
        nilai_pengetahuan: nilai_pengetahuan !== undefined ? nilai_pengetahuan : nilaiRapor.nilai_pengetahuan,
        predikat_pengetahuan: predikat_pengetahuan || nilaiRapor.predikat_pengetahuan,
        deskripsi_pengetahuan: deskripsi_pengetahuan || nilaiRapor.deskripsi_pengetahuan,
        
        nilai_keterampilan: nilai_keterampilan !== undefined ? nilai_keterampilan : nilaiRapor.nilai_keterampilan,
        predikat_keterampilan: predikat_keterampilan || nilaiRapor.predikat_keterampilan,
        deskripsi_keterampilan: deskripsi_keterampilan || nilaiRapor.deskripsi_keterampilan
      });

      res.json({ success: true, message: 'Nilai rapor berhasil diupdate', data: nilaiRapor });
    } catch (error) {
      console.error('Update nilai rapor error:', error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
  },

  // Delete nilai rapor
  deleteNilaiRapor: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await NilaiRapor.destroy({ where: { id } });
      if (!deleted) return res.status(404).json({ success: false, message: 'Nilai rapor tidak ditemukan' });
      res.json({ success: true, message: 'Nilai rapor berhasil dihapus' });
    } catch (error) {
      console.error('Delete nilai rapor error:', error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
  },

  // Bulk Create/Update (Untuk proses Generate/Simpan massal)
  bulkCreateNilaiRapor: async (req, res) => {
    const transaction = await NilaiRapor.sequelize.transaction();
    try {
      // data_nilai: [{ mapel_id, nilai_pengetahuan, predikat_pengetahuan, ..., nilai_keterampilan, ... }]
      const { rapor_id, data_nilai } = req.body; 

      if (!data_nilai || !Array.isArray(data_nilai)) {
         return res.status(400).json({ success: false, message: 'Data nilai tidak valid' });
      }

      const results = [];
      
      for (const item of data_nilai) {
         // Cek eksistensi
         const existing = await NilaiRapor.findOne({
            where: { rapor_id, mapel_id: item.mapel_id },
            transaction
         });

         const payload = {
            nilai_pengetahuan: item.nilai_pengetahuan,
            predikat_pengetahuan: item.predikat_pengetahuan,
            deskripsi_pengetahuan: item.deskripsi_pengetahuan,
            nilai_keterampilan: item.nilai_keterampilan,
            predikat_keterampilan: item.predikat_keterampilan,
            deskripsi_keterampilan: item.deskripsi_keterampilan
         };

         if (existing) {
            await existing.update(payload, { transaction });
            results.push({ mapel_id: item.mapel_id, status: 'updated' });
         } else {
            await NilaiRapor.create({
                rapor_id,
                mapel_id: item.mapel_id,
                ...payload
            }, { transaction });
            results.push({ mapel_id: item.mapel_id, status: 'created' });
         }
      }

      await transaction.commit();
      res.json({ 
        success: true, 
        message: 'Nilai rapor berhasil diproses', 
        data: { processed: results.length } 
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Bulk create nilai rapor error:', error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
  }
};

module.exports = nilaiRaporController;