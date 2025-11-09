const express = require('express');
const router = express.Router();
const kelasController = require('../controllers/kelasController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get kelas statistics
router.get('/stats', authorize('Admin', 'Guru'), kelasController.getKelasStats);

// Get all kelas with pagination and filters
router.get('/', authorize('Admin', 'Guru'), kelasController.getAllKelas);

// Get kelas by ID
router.get('/:id', authorize('Admin', 'Guru'), kelasController.getKelasById);

// Create new kelas (Admin only)
router.post('/', authorize('Admin'), kelasController.createKelas);

// Update kelas (Admin only)
router.put('/:id', authorize('Admin'), kelasController.updateKelas);

// Delete kelas (Admin only)
router.delete('/:id', authorize('Admin'), kelasController.deleteKelas);

// Add siswa to kelas
router.post('/:id/siswa', authorize('Admin', 'Guru'), kelasController.addSiswaToKelas);

// Remove siswa from kelas
router.delete('/:id/siswa/:siswa_id', authorize('Admin', 'Guru'), kelasController.removeSiswaFromKelas);

module.exports = router;