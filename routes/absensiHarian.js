const express = require('express');
const router = express.Router();
const absensiHarianController = require('../controllers/absensiHarianController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get absensi statistics
router.get('/stats', authorize('Admin', 'Guru'), absensiHarianController.getAbsensiStats);

// Get absensi by kelas
router.get('/kelas/:kelas_id', authorize('Admin', 'Guru'), absensiHarianController.getAbsensiByKelas);

// Bulk create absensi
router.post('/bulk', authorize('Admin', 'Guru'), absensiHarianController.bulkCreateAbsensi);

// Get all absensi harian with pagination and filters
router.get('/', authorize('Admin', 'Guru'), absensiHarianController.getAllAbsensiHarian);

// Get absensi harian by ID
router.get('/:id', authorize('Admin', 'Guru'), absensiHarianController.getAbsensiHarianById);

// Create new absensi harian (Admin & Guru only)
router.post('/', authorize('Admin', 'Guru'), absensiHarianController.createAbsensiHarian);

// Update absensi harian (Admin & Guru only)
router.put('/:id', authorize('Admin', 'Guru'), absensiHarianController.updateAbsensiHarian);

// Delete absensi harian (Admin only)
router.delete('/:id', authorize('Admin'), absensiHarianController.deleteAbsensiHarian);

module.exports = router;