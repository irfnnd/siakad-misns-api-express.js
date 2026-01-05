const express = require('express');
const router = express.Router();
const jadwalPelajaranController = require('../controllers/jadwalPelajaranController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get jadwal pelajaran statistics
router.get('/stats', authorize('Admin', 'Guru'), jadwalPelajaranController.getJadwalPelajaranStats);

// Get jadwal by kelas
router.get('/kelas/:kelas_id', authorize('Admin', 'Guru', 'Siswa'), jadwalPelajaranController.getJadwalByKelas);

// Get jadwal by guru
router.get('/guru/:guru_id', authorize('Admin', 'Guru'), jadwalPelajaranController.getJadwalByGuru);

// Get all jadwal pelajaran with pagination and filters
router.get('/', authorize('Admin', 'Guru'), jadwalPelajaranController.getAllJadwalPelajaran);

// Get jadwal pelajaran by ID
router.get('/:id', authorize('Admin', 'Guru'), jadwalPelajaranController.getJadwalPelajaranById);

// Create new jadwal pelajaran (Admin only)
router.post('/', authorize('Admin', 'Guru'), jadwalPelajaranController.createJadwalPelajaran);

// Update jadwal pelajaran (Admin and Guru)
router.put('/:id', authorize('Admin', 'Guru'), jadwalPelajaranController.updateJadwalPelajaran);

// Delete jadwal pelajaran (Admin only)
router.delete('/:id', authorize('Admin', 'Guru'), jadwalPelajaranController.deleteJadwalPelajaran);

module.exports = router;