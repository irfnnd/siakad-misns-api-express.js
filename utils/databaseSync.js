const { 
  User, Pegawai, Siswa, TahunAjaran, Semester, Kelas, 
  MataPelajaran, SiswaDiKelas, JadwalPelajaran, AbsensiHarian,
  Pengajaran, KonfigurasiBobot, Penilaian, Nilai, Rapor,
  NilaiRapor, Ekstrakurikuler, NilaiEkskulSiswa, sequelize 
} = require('../models');

const syncDatabase = async () => {
  try {
    // Sinkronisasi semua model
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database berhasil disinkronisasi');

    // Buat data default jika diperlukan
    await createDefaultData();
    
  } catch (error) {
    console.error('❌ Gagal sinkronisasi database:', error);
    throw error;
  }
};

const createDefaultData = async () => {
  try {
    // Cek apakah admin sudah ada
    const adminExists = await User.findOne({ where: { role: 'Admin' } });
    
    if (!adminExists) {
      // Buat user admin default
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const adminUser = await User.create({
        username: 'admin',
        email: 'admin@siakad.sd',
        password_hash: hashedPassword,
        role: 'Admin',
        status: 'Aktif'
      });
      
      console.log('✅ Admin default berhasil dibuat');
    }

    // Buat tahun ajaran aktif default
    const tahunAjaranAktif = await TahunAjaran.findOne({ where: { status: 'Aktif' } });
    if (!tahunAjaranAktif) {
      const currentYear = new Date().getFullYear();
      const tahunAjaran = `${currentYear}/${currentYear + 1}`;
      
      await TahunAjaran.create({
        tahun: tahunAjaran,
        status: 'Aktif'
      });
      
      console.log('✅ Tahun ajaran default berhasil dibuat');
    }
    
  } catch (error) {
    console.error('❌ Gagal membuat data default:', error);
  }
};

module.exports = { syncDatabase };