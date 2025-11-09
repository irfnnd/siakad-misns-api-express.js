const express = require('express');
const router = express.Router();
const siswaController = require('../controllers/siswaController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get siswa statistics
router.get('/stats', authorize('Admin', 'Guru'), siswaController.getSiswaStats);

// Get all siswa with pagination and filters
router.get('/', authorize('Admin', 'Guru'), siswaController.getAllSiswa);

// Get siswa by ID
router.get('/:id', authorize('Admin', 'Guru'), siswaController.getSiswaById);

// Create new siswa (Admin only)
router.post('/', authorize('Admin'), siswaController.createSiswa);

// Update siswa (Admin only)
router.put('/:id', authorize('Admin'), siswaController.updateSiswa);

// Update siswa status (Admin only)
router.patch('/:id/status', authorize('Admin'), siswaController.updateSiswaStatus);

// Delete siswa (Admin only)
router.delete('/:id', authorize('Admin'), siswaController.deleteSiswa);

module.exports = router;