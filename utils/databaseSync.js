const { sequelize, User, TahunAjaran } = require('../models');

const syncDatabase = async () => {
  try {
    console.log('🔄 Mensinkronisasi database...');
    
    // Test koneksi terlebih dahulu
    await sequelize.authenticate();
    console.log('✅ Koneksi database berhasil');
    
    // Sinkronisasi semua model
    await sequelize.sync({ 
      force: false, 
      alter: true
    });
    
    console.log('✅ Database berhasil disinkronisasi');
    console.log('📊 Tabel-tabel berhasil dibuat/diperbarui');

    // Buat data default
    await createDefaultData();
    
  } catch (error) {
    console.error('❌ Gagal sinkronisasi database:', error.message);
    throw error;
  }
};

const createDefaultData = async () => {
  try {
    const bcrypt = require('bcryptjs');

    // Cek apakah admin sudah ada
    const adminExists = await User.findOne({ where: { role: 'Admin' } });
    
    if (!adminExists) {
      // Buat user admin default
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await User.create({
        username: 'admin',
        email: 'admin@siakad.sd',
        password_hash: hashedPassword,
        role: 'Admin',
        status: 'Aktif',
        created_at: new Date()
      });
      
      console.log('✅ Admin default berhasil dibuat');
      console.log('   👤 Username: admin');
      console.log('   🔑 Password: admin123');
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
      
      console.log('✅ Tahun ajaran default berhasil dibuat:', tahunAjaran);
    }
    
    console.log('🎉 Setup database selesai!');
    
  } catch (error) {
    console.error('❌ Gagal membuat data default:', error.message);
  }
};

module.exports = { syncDatabase };