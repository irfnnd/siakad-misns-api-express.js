const express = require('express');
const router = express.Router();
const pengajaranController = require('../controllers/pengajaranController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get all pengajaran with pagination and filters
router.get('/', authorize('Admin', 'Guru'), pengajaranController.getAllPengajaran);

// Get pengajaran by ID
router.get('/:id', authorize('Admin', 'Guru'), pengajaranController.getPengajaranById);

// Get pengajaran by guru
router.get('/guru/:guru_id', authorize('Admin', 'Guru'), pengajaranController.getPengajaranByGuru);

// Get pengajaran by kelas
router.get('/kelas/:kelas_id', authorize('Admin', 'Guru'), pengajaranController.getPengajaranByKelas);

// Create new pengajaran (Admin only)
router.post('/', authorize('Admin'), pengajaranController.createPengajaran);

// Update pengajaran (Admin only)
router.put('/:id', authorize('Admin'), pengajaranController.updatePengajaran);

// Delete pengajaran (Admin only)
router.delete('/:id', authorize('Admin'), pengajaranController.deletePengajaran);

module.exports = router;