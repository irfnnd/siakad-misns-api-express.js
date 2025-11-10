const express = require('express');
const router = express.Router();
const mataPelajaranController = require('../controllers/mataPelajaranController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get mata pelajaran statistics
router.get('/stats', authorize('Admin', 'Guru'), mataPelajaranController.getMataPelajaranStats);

// Search mata pelajaran
router.get('/search', authorize('Admin', 'Guru'), mataPelajaranController.searchMataPelajaran);

// Get all mata pelajaran with pagination and filters
router.get('/', authorize('Admin', 'Guru'), mataPelajaranController.getAllMataPelajaran);

// Get mata pelajaran by ID
router.get('/:id', authorize('Admin', 'Guru'), mataPelajaranController.getMataPelajaranById);

// Create new mata pelajaran (Admin only)
router.post('/', authorize('Admin'), mataPelajaranController.createMataPelajaran);

// Update mata pelajaran (Admin only)
router.put('/:id', authorize('Admin'), mataPelajaranController.updateMataPelajaran);

// Delete mata pelajaran (Admin only)
router.delete('/:id', authorize('Admin'), mataPelajaranController.deleteMataPelajaran);

module.exports = router;