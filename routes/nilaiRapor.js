const express = require('express');
const router = express.Router();
const nilaiRaporController = require('../controllers/nilaiRaporController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get all nilai rapor with pagination and filters
router.get('/', authorize('Admin', 'Guru'), nilaiRaporController.getAllNilaiRapor);

// Get nilai rapor by ID
router.get('/:id', authorize('Admin', 'Guru'), nilaiRaporController.getNilaiRaporById);

// Get nilai rapor by rapor
router.get('/rapor/:rapor_id', authorize('Admin', 'Guru'), nilaiRaporController.getNilaiRaporByRapor);

// Bulk create nilai rapor
router.post('/bulk', authorize('Admin', 'Guru'), nilaiRaporController.bulkCreateNilaiRapor);

// Create new nilai rapor
router.post('/', authorize('Admin', 'Guru'), nilaiRaporController.createNilaiRapor);

// Update nilai rapor
router.put('/:id', authorize('Admin', 'Guru'), nilaiRaporController.updateNilaiRapor);

// Delete nilai rapor
router.delete('/:id', authorize('Admin', 'Guru'), nilaiRaporController.deleteNilaiRapor);

module.exports = router;