const express = require('express');
const router = express.Router();
const tahunAjaranController = require('../controllers/tahunAjaranController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get tahun ajaran statistics
router.get('/stats', authorize('Admin', 'Guru'), tahunAjaranController.getTahunAjaranStats);

// Get active tahun ajaran
router.get('/active', authorize('Admin', 'Guru', 'Siswa'), tahunAjaranController.getActiveTahunAjaran);

// Get all tahun ajaran with pagination and filters
router.get('/', authorize('Admin', 'Guru'), tahunAjaranController.getAllTahunAjaran);

// Get tahun ajaran by ID
router.get('/:id', authorize('Admin', 'Guru'), tahunAjaranController.getTahunAjaranById);

// Create new tahun ajaran (Admin only)
router.post('/', authorize('Admin'), tahunAjaranController.createTahunAjaran);

// Update tahun ajaran (Admin only)
router.put('/:id', authorize('Admin'), tahunAjaranController.updateTahunAjaran);

// Activate tahun ajaran (Admin only)
router.patch('/:id/activate', authorize('Admin'), tahunAjaranController.activateTahunAjaran);

// Delete tahun ajaran (Admin only)
router.delete('/:id', authorize('Admin'), tahunAjaranController.deleteTahunAjaran);

module.exports = router;