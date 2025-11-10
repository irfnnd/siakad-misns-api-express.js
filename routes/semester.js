const express = require('express');
const router = express.Router();
const semesterController = require('../controllers/semesterController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get semester statistics
router.get('/stats', authorize('Admin', 'Guru'), semesterController.getSemesterStats);

// Get active semester
router.get('/active', authorize('Admin', 'Guru', 'Siswa'), semesterController.getActiveSemester);

// Get all semester with pagination and filters
router.get('/', authorize('Admin', 'Guru'), semesterController.getAllSemester);

// Get semester by ID
router.get('/:id', authorize('Admin', 'Guru'), semesterController.getSemesterById);

// Update semester (Admin only)
router.put('/:id', authorize('Admin'), semesterController.updateSemester);

// Activate semester (Admin only)
router.patch('/:id/activate', authorize('Admin'), semesterController.activateSemester);

module.exports = router;