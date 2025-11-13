const express = require('express');
const router = express.Router();
const siswaDiKelasController = require('../controllers/siswaDiKelasController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get all siswa di kelas with pagination and filters
router.get('/', authorize('Admin', 'Guru'), siswaDiKelasController.getAllSiswaDiKelas);

// Get siswa by kelas
router.get('/siswa-by-kelas', authorize('Admin', 'Guru'), siswaDiKelasController.getSiswaByKelas);

// Assign siswa to kelas (Admin only)
router.post('/', authorize('Admin'), siswaDiKelasController.assignSiswaToKelas);

// Remove siswa from kelas (Admin only)
router.delete('/:id', authorize('Admin'), siswaDiKelasController.removeSiswaFromKelas);

module.exports = router;