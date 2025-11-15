const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { syncDatabase } = require('./utils/databaseSync');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const siswaRoutes = require('./routes/siswa');
const pegawaiRoutes = require('./routes/pegawai');
const kelasRoutes = require('./routes/kelas');
const mataPelajaranRoutes = require('./routes/mataPelajaran');
const tahunAjaranRoutes = require('./routes/tahunAjaran');
const semesterRoutes = require('./routes/semester');
const jadwalPelajaranRoutes = require('./routes/jadwalPelajaran');
const absensiHarianRoutes = require('./routes/absensiHarian');
const siswaDiKelasRoutes = require('./routes/siswaDiKelas');
const pengajaranRoutes = require('./routes/pengajaran');
const konfigurasiBobotRoutes = require('./routes/konfigurasiBobot');
const penilaianRoutes = require('./routes/penilaian');
const nilaiRoutes = require('./routes/nilai');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/siswa', siswaRoutes);
app.use('/api/pegawai', pegawaiRoutes);
app.use('/api/kelas', kelasRoutes);
app.use('/api/mata-pelajaran', mataPelajaranRoutes);
app.use('/api/tahun-ajaran', tahunAjaranRoutes);
app.use('/api/semester', semesterRoutes);
app.use('/api/jadwal-pelajaran', jadwalPelajaranRoutes);
app.use('/api/absensi-harian', absensiHarianRoutes);
app.use('/api/siswa-di-kelas', siswaDiKelasRoutes);
app.use('/api/pengajaran', pengajaranRoutes);
app.use('/api/konfigurasi-bobot', konfigurasiBobotRoutes);
app.use('/api/penilaian', penilaianRoutes);
app.use('/api/nilai', nilaiRoutes);


// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server Siakad  MISNS berjalan dengan baik',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
// app.all('.*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Endpoint tidak ditemukan'
//   });
// });

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan internal server',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = app;