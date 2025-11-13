const express = require('express');
const router = express.Router();
const pegawaiController = require('../controllers/pegawaiController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get all pegawai with pagination and filters
router.get('/', authorize('Admin', 'Guru'), pegawaiController.getAllPegawai);

// Get pegawai by ID
router.get('/:id', authorize('Admin', 'Guru'), pegawaiController.getPegawaiById);

// Create new pegawai (Admin only)
router.post('/', authorize('Admin'), pegawaiController.createPegawai);

// Update pegawai (Admin only)
router.put('/:id', authorize('Admin'), pegawaiController.updatePegawai);

// Delete pegawai (Admin only)
router.delete('/:id', authorize('Admin'), pegawaiController.deletePegawai);

module.exports = router;