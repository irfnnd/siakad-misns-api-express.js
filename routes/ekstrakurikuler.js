const express = require('express');
const router = express.Router();
const ekstrakurikulerController = require('../controllers/ekstrakurikulerController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get all ekstrakurikuler with pagination and filters
router.get('/', authorize('Admin', 'Guru'), ekstrakurikulerController.getAllEkstrakurikuler);

// Get ekstrakurikuler by ID
router.get('/:id', authorize('Admin', 'Guru'), ekstrakurikulerController.getEkstrakurikulerById);

// Get peserta ekstrakurikuler
router.get('/:id/peserta', authorize('Admin', 'Guru'), ekstrakurikulerController.getPesertaEkstrakurikuler);

// Create new ekstrakurikuler
router.post('/', authorize('Admin'), ekstrakurikulerController.createEkstrakurikuler);

// Update ekstrakurikuler
router.put('/:id', authorize('Admin'), ekstrakurikulerController.updateEkstrakurikuler);

// Delete ekstrakurikuler
router.delete('/:id', authorize('Admin'), ekstrakurikulerController.deleteEkstrakurikuler);

module.exports = router;