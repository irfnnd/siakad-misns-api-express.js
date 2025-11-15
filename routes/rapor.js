const express = require('express');
const router = express.Router();
const raporController = require('../controllers/raporController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get all rapor with pagination and filters
router.get('/', authorize('Admin', 'Guru'), raporController.getAllRapor);

// Get rapor by ID
router.get('/:id', authorize('Admin', 'Guru', 'Siswa'), raporController.getRaporById);

// Get rapor by siswa
router.get('/siswa/:siswa_id', authorize('Admin', 'Guru', 'Siswa'), raporController.getRaporBySiswa);

// Get rapor by siswa and semester
router.get('/siswa/:siswa_id/semester/:semester_id', authorize('Admin', 'Guru', 'Siswa'), raporController.getRaporBySiswaSemester);

// Generate rapor (otomatis)
router.post('/generate', authorize('Admin', 'Guru'), raporController.generateRapor);

// Create new rapor
router.post('/', authorize('Admin', 'Guru'), raporController.createRapor);

// Update rapor
router.put('/:id', authorize('Admin', 'Guru'), raporController.updateRapor);

// Delete rapor
router.delete('/:id', authorize('Admin'), raporController.deleteRapor);

module.exports = router;