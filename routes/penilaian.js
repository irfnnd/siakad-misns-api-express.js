const express = require('express');
const router = express.Router();
const penilaianController = require('../controllers/penilaianController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get all penilaian with pagination and filters
router.get('/', authorize('Admin', 'Guru'), penilaianController.getAllPenilaian);

// Get penilaian by ID
router.get('/:id', authorize('Admin', 'Guru'), penilaianController.getPenilaianById);

// Get penilaian by pengajaran
router.get('/pengajaran/:pengajaran_id', authorize('Admin', 'Guru'), penilaianController.getPenilaianByPengajaran);

// Get penilaian by guru
router.get('/guru/:guru_id', authorize('Admin', 'Guru'), penilaianController.getPenilaianByGuru);

// Get statistik penilaian
router.get('/laporan/statistik', authorize('Admin', 'Guru'), penilaianController.getStatistikPenilaian);

// Create new penilaian
router.post('/', authorize('Admin', 'Guru'), penilaianController.createPenilaian);

// Update penilaian
router.put('/:id', authorize('Admin', 'Guru'), penilaianController.updatePenilaian);

// Delete penilaian
router.delete('/:id', authorize('Admin', 'Guru'), penilaianController.deletePenilaian);

module.exports = router;