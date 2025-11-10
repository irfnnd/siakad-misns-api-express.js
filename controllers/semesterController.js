const { Semester, TahunAjaran } = require('../models');
const { Op } = require('sequelize');

const semesterController = {
  // Get all semester dengan pagination
  getAllSemester: async (req, res) => {
    try {
      const { page = 1, limit = 10, status, tahun_ajaran_id } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (status) whereClause.status = status;
      if (tahun_ajaran_id) whereClause.tahun_ajaran_id = tahun_ajaran_id;

      const semester = await Semester.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: TahunAjaran,
            as: 'tahun_ajaran',
            attributes: ['id', 'tahun', 'status'],
            required: true
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['tahun_ajaran_id', 'DESC'], ['nama', 'ASC']]
      });

      res.json({
        success: true,
        data: {
          semester: semester.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(semester.count / limit),
            totalItems: semester.count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get all semester error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Get semester by ID
  getSemesterById: async (req, res) => {
    try {
      const { id } = req.params;

      const semester = await Semester.findByPk(id, {
        include: [
          {
            model: TahunAjaran,
            as: 'tahun_ajaran',
            required: true
          }
        ]
      });

      if (!semester) {
        return res.status(404).json({
          success: false,
          message: 'Semester tidak ditemukan'
        });
      }

      res.json({
        success: true,
        data: semester
      });
    } catch (error) {
      console.error('Get semester by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Update semester
  updateSemester: async (req, res) => {
    try {
      const { id } = req.params;
      const { nama, status } = req.body;

      const semester = await Semester.findByPk(id);
      if (!semester) {
        return res.status(404).json({
          success: false,
          message: 'Semester tidak ditemukan'
        });
      }

      // Validasi nama semester
      if (nama && !['Ganjil', 'Genap'].includes(nama)) {
        return res.status(400).json({
          success: false,
          message: 'Nama semester harus Ganjil atau Genap'
        });
      }

      await semester.update({
        nama: nama || semester.nama,
        status: status || semester.status
      });

      // Get updated semester
      const updatedSemester = await Semester.findByPk(id, {
        include: [
          {
            model: TahunAjaran,
            as: 'tahun_ajaran',
            required: true
          }
        ]
      });

      res.json({
        success: true,
        message: 'Semester berhasil diupdate',
        data: updatedSemester
      });

    } catch (error) {
      console.error('Update semester error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Aktifkan semester (nonaktifkan yang lain di tahun ajaran yang sama)
  activateSemester: async (req, res) => {
    try {
      const { id } = req.params;

      const semester = await Semester.findByPk(id, {
        include: [
          {
            model: TahunAjaran,
            as: 'tahun_ajaran',
            required: true
          }
        ]
      });

      if (!semester) {
        return res.status(404).json({
          success: false,
          message: 'Semester tidak ditemukan'
        });
      }

      // Start transaction
      const transaction = await Semester.sequelize.transaction();

      try {
        // Nonaktifkan semua semester di tahun ajaran yang sama
        await Semester.update(
          { status: 'Nonaktif' },
          { 
            where: { tahun_ajaran_id: semester.tahun_ajaran_id },
            transaction 
          }
        );

        // Aktifkan semester yang dipilih
        await semester.update({ status: 'Aktif' }, { transaction });

        await transaction.commit();

        res.json({
          success: true,
          message: 'Semester berhasil diaktifkan'
        });

      } catch (error) {
        await transaction.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Activate semester error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Get semester aktif
  getActiveSemester: async (req, res) => {
    try {
      const semesterAktif = await Semester.findOne({ 
        where: { status: 'Aktif' },
        include: [
          {
            model: TahunAjaran,
            as: 'tahun_ajaran',
            required: true
          }
        ]
      });

      if (!semesterAktif) {
        return res.status(404).json({
          success: false,
          message: 'Tidak ada semester yang aktif'
        });
      }

      res.json({
        success: true,
        data: semesterAktif
      });
    } catch (error) {
      console.error('Get active semester error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  // Get semester statistics
  getSemesterStats: async (req, res) => {
    try {
      const totalSemester = await Semester.count();
      const aktifSemester = await Semester.count({ where: { status: 'Aktif' } });
      const nonaktifSemester = await Semester.count({ where: { status: 'Nonaktif' } });

      // Count by nama
      const ganjilCount = await Semester.count({ where: { nama: 'Ganjil' } });
      const genapCount = await Semester.count({ where: { nama: 'Genap' } });

      res.json({
        success: true,
        data: {
          total_semester: totalSemester,
          by_status: {
            aktif: aktifSemester,
            nonaktif: nonaktifSemester
          },
          by_nama: {
            ganjil: ganjilCount,
            genap: genapCount
          }
        }
      });
    } catch (error) {
      console.error('Get semester stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  }
};

module.exports = semesterController;