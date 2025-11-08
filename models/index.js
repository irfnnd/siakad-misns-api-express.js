const sequelize = require('../config/database');
const User = require('./User');
const Pegawai = require('./Pegawai');
const Siswa = require('./Siswa');
const TahunAjaran = require('./TahunAjaran');
const Semester = require('./Semester');
const Kelas = require('./Kelas');
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

// Define Associations
User.hasOne(Pegawai, { foreignKey: 'user_id' });
Pegawai.belongsTo(User, { foreignKey: 'user_id' });

User.hasOne(Siswa, { foreignKey: 'user_id' });
Siswa.belongsTo(User, { foreignKey: 'user_id' });

TahunAjaran.hasMany(Semester, { foreignKey: 'tahun_ajaran_id' });
Semester.belongsTo(TahunAjaran, { foreignKey: 'tahun_ajaran_id' });

Pegawai.hasMany(Kelas, { foreignKey: 'wali_kelas_id' });
Kelas.belongsTo(Pegawai, { foreignKey: 'wali_kelas_id' });

Siswa.belongsToMany(Kelas, { 
  through: SiswaDiKelas, 
  foreignKey: 'siswa_id',
  otherKey: 'kelas_id'
});
Kelas.belongsToMany(Siswa, { 
  through: SiswaDiKelas, 
  foreignKey: 'kelas_id',
  otherKey: 'siswa_id'
});

Semester.hasMany(SiswaDiKelas, { foreignKey: 'semester_id' });
SiswaDiKelas.belongsTo(Semester, { foreignKey: 'semester_id' });

// Add more associations as needed...

module.exports = {
  sequelize,
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