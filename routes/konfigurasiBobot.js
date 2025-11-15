const express = require('express');
const router = express.Router();
const konfigurasiBobotController = require('../controllers/konfigurasiBobotController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get all konfigurasi bobot with pagination and filters
router.get('/', authorize('Admin', 'Guru'), konfigurasiBobotController.getAllKonfigurasiBobot);

// Get konfigurasi bobot by ID
router.get('/:id', authorize('Admin', 'Guru'), konfigurasiBobotController.getKonfigurasiById);

// Get konfigurasi bobot by pengajaran ID
router.get('/pengajaran/:pengajaran_id', authorize('Admin', 'Guru'), konfigurasiBobotController.getKonfigurasiByPengajaran);

// Create new konfigurasi bobot
router.post('/', authorize('Admin', 'Guru'), konfigurasiBobotController.createKonfigurasiBobot);

// Update konfigurasi bobot
router.put('/:id', authorize('Admin', 'Guru'), konfigurasiBobotController.updateKonfigurasiBobot);

// Bulk create/update konfigurasi bobot
router.post('/bulk', authorize('Admin', 'Guru'), konfigurasiBobotController.bulkCreateKonfigurasi);

// Delete konfigurasi bobot
router.delete('/:id', authorize('Admin'), konfigurasiBobotController.deleteKonfigurasiBobot);

module.exports = router;