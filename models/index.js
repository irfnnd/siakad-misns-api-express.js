const sequelize = require('../config/database');

// Import semua models
const User = require('./User');
const Pegawai = require('./Pegawai');
const Kelas = require('./Kelas');
const Siswa = require('./Siswa');
const TahunAjaran = require('./TahunAjaran');
const Semester = require('./Semester');
const MataPelajaran = require('./MataPelajaran');
const SiswaDiKelas = require('./SiswaDiKelas');
const JadwalPelajaran = require('./JadwalPelajaran');
const AbsensiHarian = require('./AbsensiHarian');
const Pengajaran = require('./Pengajaran');
const KonfigurasiBobot = require('./KonfigurasiBobot');
const Penilaian = require('./Penilaian');
const Nilai = require('./Nilai');
const Rapor = require('./Rapor');
const NilaiRapor = require('./NilaiRapor');
const Ekstrakurikuler = require('./Ekstrakurikuler');
const NilaiEkskulSiswa = require('./NilaiEkskulSiswa');

// Kumpulkan semua models
const models = {
  User,
  Pegawai,
  Siswa,
  TahunAjaran,
  Semester,
  Kelas,
  MataPelajaran,
  SiswaDiKelas,
  JadwalPelajaran,
  AbsensiHarian,
  Pengajaran,
  KonfigurasiBobot,
  Penilaian,
  Nilai,
  Rapor,
  NilaiRapor,
  Ekstrakurikuler,
  NilaiEkskulSiswa
};

// Fungsi untuk setup associations
const setupAssociations = () => {
  // User associations
  User.hasOne(Pegawai, { foreignKey: 'user_id', as: 'pegawai' });
  Pegawai.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  User.hasOne(Siswa, { foreignKey: 'user_id', as: 'siswa' });
  Siswa.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Tahun Ajaran associations
  TahunAjaran.hasMany(Semester, { foreignKey: 'tahun_ajaran_id', as: 'semesters' });
  Semester.belongsTo(TahunAjaran, { foreignKey: 'tahun_ajaran_id', as: 'tahun_ajaran' });

  // Kelas associations
  Kelas.belongsTo(Pegawai, { foreignKey: 'wali_kelas_id', as: 'wali_kelas' });
  Pegawai.hasMany(Kelas, { foreignKey: 'wali_kelas_id', as: 'kelas' });
 // models/index.js - Buat konsisten dengan controller

  // Many-to-Many associations
  Kelas.belongsToMany(Siswa, { 
    through: SiswaDiKelas, 
    foreignKey: 'kelas_id',
    otherKey: 'siswa_id',
    as: 'siswa'
  });

  Siswa.belongsToMany(Kelas, { 
    through: SiswaDiKelas, 
    foreignKey: 'siswa_id',
    otherKey: 'kelas_id', 
    as: 'kelas'
  });

  // SiswaDiKelas associations - GUNAKAN ALIAS YANG SAMA
  SiswaDiKelas.belongsTo(Siswa, { foreignKey: 'siswa_id', as: 'siswa' });
  SiswaDiKelas.belongsTo(Kelas, { foreignKey: 'kelas_id', as: 'kelas' });
  SiswaDiKelas.belongsTo(Semester, { foreignKey: 'semester_id', as: 'semester' });

  // HasMany associations - GUNAKAN ALIAS YANG SAMA
  Siswa.hasMany(SiswaDiKelas, { foreignKey: 'siswa_id', as: 'siswa_di_kelas' });
  Kelas.hasMany(SiswaDiKelas, { foreignKey: 'kelas_id', as: 'siswa_di_kelas' });
  Semester.hasMany(SiswaDiKelas, { foreignKey: 'semester_id', as: 'siswa_di_kelas' });

  // Jadwal Pelajaran associations
  JadwalPelajaran.belongsTo(Kelas, { foreignKey: 'kelas_id', as: 'kelas' });
  JadwalPelajaran.belongsTo(MataPelajaran, { foreignKey: 'mapel_id', as: 'mata_pelajaran' });
  JadwalPelajaran.belongsTo(Pegawai, { foreignKey: 'guru_id', as: 'guru' });
  JadwalPelajaran.belongsTo(Semester, { foreignKey: 'semester_id', as: 'semester' });

  // Absensi associations
  AbsensiHarian.belongsTo(Siswa, { foreignKey: 'siswa_id', as: 'siswa' });
  AbsensiHarian.belongsTo(Semester, { foreignKey: 'semester_id', as: 'semester' });

  MataPelajaran.hasMany(Pengajaran, { 
    foreignKey: 'mapel_id', 
    as: 'pengajaran' 
  });
  
  Pengajaran.belongsTo(MataPelajaran, { 
    foreignKey: 'mapel_id', 
    as: 'mata_pelajaran_mapel' 
  });

  // MataPelajaran - NilaiRapor associations
  MataPelajaran.hasMany(NilaiRapor, { 
    foreignKey: 'mapel_id', 
    as: 'nilai_rapor_mapel' 
  });
  
  NilaiRapor.belongsTo(MataPelajaran, { 
    foreignKey: 'mapel_id', 
    as: 'mata_pelajaran_nilai' 
  });

  // MataPelajaran - JadwalPelajaran associations
  MataPelajaran.hasMany(JadwalPelajaran, { 
    foreignKey: 'mapel_id', 
    as: 'jadwal_mapel' 
  });
  
  JadwalPelajaran.belongsTo(MataPelajaran, { 
    foreignKey: 'mapel_id', 
    as: 'mata_pelajaran_jadwal' 
  });

  // Pengajaran associations
  Pengajaran.belongsTo(Pegawai, { foreignKey: 'guru_id', as: 'guru' });
  Pengajaran.belongsTo(MataPelajaran, { foreignKey: 'mapel_id', as: 'mata_pelajaran' });
  Pengajaran.belongsTo(Kelas, { foreignKey: 'kelas_id', as: 'kelas' });
  Pengajaran.belongsTo(Semester, { foreignKey: 'semester_id', as: 'semester' });

  // Konfigurasi Bobot associations
  KonfigurasiBobot.belongsTo(Pengajaran, { foreignKey: 'pengajaran_id', as: 'pengajaran' });
  Pengajaran.hasOne(KonfigurasiBobot, { foreignKey: 'pengajaran_id', as: 'konfigurasi_bobot' });

  // Penilaian associations
  Penilaian.belongsTo(Pengajaran, { foreignKey: 'pengajaran_id', as: 'pengajaran' });
  Pengajaran.hasMany(Penilaian, { foreignKey: 'pengajaran_id', as: 'penilaian' });

  // Nilai associations
  Nilai.belongsTo(Penilaian, { foreignKey: 'penilaian_id', as: 'penilaian' });
  Nilai.belongsTo(Siswa, { foreignKey: 'siswa_id', as: 'siswa' });

  Penilaian.hasMany(Nilai, { foreignKey: 'penilaian_id', as: 'nilai' });
  Siswa.hasMany(Nilai, { foreignKey: 'siswa_id', as: 'nilai' });

  // Rapor associations
  Rapor.belongsTo(Siswa, { foreignKey: 'siswa_id', as: 'siswa' });
  Rapor.belongsTo(Semester, { foreignKey: 'semester_id', as: 'semester' });

  Siswa.hasMany(Rapor, { foreignKey: 'siswa_id', as: 'rapor' });
  Semester.hasMany(Rapor, { foreignKey: 'semester_id', as: 'rapor' });

  // Nilai Rapor associations
  NilaiRapor.belongsTo(Rapor, { foreignKey: 'rapor_id', as: 'rapor' });
  NilaiRapor.belongsTo(MataPelajaran, { foreignKey: 'mapel_id', as: 'mata_pelajaran' });

  Rapor.hasMany(NilaiRapor, { foreignKey: 'rapor_id', as: 'nilai_rapor' });
  MataPelajaran.hasMany(NilaiRapor, { foreignKey: 'mapel_id', as: 'nilai_rapor' });

  // Nilai Ekstrakurikuler associations
  NilaiEkskulSiswa.belongsTo(Rapor, { foreignKey: 'rapor_id', as: 'rapor' });
  NilaiEkskulSiswa.belongsTo(Ekstrakurikuler, { foreignKey: 'ekskul_id', as: 'ekstrakurikuler' });

  Rapor.hasMany(NilaiEkskulSiswa, { foreignKey: 'rapor_id', as: 'nilai_ekskul' });
  Ekstrakurikuler.hasMany(NilaiEkskulSiswa, { foreignKey: 'ekskul_id', as: 'nilai_siswa' });
};

// Setup associations
setupAssociations();

module.exports = {
  sequelize,
  ...models
};