const express = require('express');
const router = express.Router();
const nilaiEkskulSiswaController = require('../controllers/nilaiEkskulSiswaController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get all nilai ekskul with pagination and filters
router.get('/', authorize('Admin', 'Guru'), nilaiEkskulSiswaController.getAllNilaiEkskul);

// Get nilai ekskul by ID
router.get('/:id', authorize('Admin', 'Guru'), nilaiEkskulSiswaController.getNilaiEkskulById);

// Get nilai ekskul by rapor
router.get('/rapor/:rapor_id', authorize('Admin', 'Guru'), nilaiEkskulSiswaController.getNilaiEkskulByRapor);

// Get nilai ekskul by siswa
router.get('/siswa/:siswa_id', authorize('Admin', 'Guru', 'Siswa'), nilaiEkskulSiswaController.getNilaiEkskulBySiswa);

// Bulk create nilai ekskul
router.post('/bulk', authorize('Admin', 'Guru'), nilaiEkskulSiswaController.bulkCreateNilaiEkskul);

// Create new nilai ekskul
router.post('/', authorize('Admin', 'Guru'), nilaiEkskulSiswaController.createNilaiEkskul);

// Update nilai ekskul
router.put('/:id', authorize('Admin', 'Guru'), nilaiEkskulSiswaController.updateNilaiEkskul);

// Delete nilai ekskul
router.delete('/:id', authorize('Admin', 'Guru'), nilaiEkskulSiswaController.deleteNilaiEkskul);

module.exports = router;