const express = require('express');
const router = express.Router();
const nilaiController = require('../controllers/nilaiController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Bulk create or update nilai
router.post('/bulk', authorize('Admin', 'Guru'), nilaiController.bulkCreateOrUpdateNilai);
// Get all nilai with pagination and filters
router.get('/', authorize('Admin', 'Guru'), nilaiController.getAllNilai);

// Get nilai by ID
router.get('/:id', authorize('Admin', 'Guru'), nilaiController.getNilaiById);

// Get nilai by penilaian
router.get('/penilaian/:penilaian_id', authorize('Admin', 'Guru'), nilaiController.getNilaiByPenilaian);

// Get nilai by siswa
router.get('/siswa/:siswa_id', authorize('Admin', 'Guru', 'Siswa'), nilaiController.getNilaiBySiswa);

// Get rekap nilai by penilaian
router.get('/rekap/penilaian/:penilaian_id', authorize('Admin', 'Guru'), nilaiController.getRekapNilaiByPenilaian);

// Create or update nilai
router.post('/', authorize('Admin', 'Guru'), nilaiController.createOrUpdateNilai);

// Delete nilai
router.delete('/:id', authorize('Admin', 'Guru'), nilaiController.deleteNilai);

module.exports = router;