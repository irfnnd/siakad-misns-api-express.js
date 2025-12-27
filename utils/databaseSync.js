const { sequelize, User, TahunAjaran, Semester } = require('../models');
const bcrypt = require('bcryptjs');

const syncDatabase = async () => {
  try {
    console.log('🔄 Mensinkronisasi database...');

    // Test koneksi database
    await sequelize.authenticate();
    console.log('✅ Koneksi database berhasil');

    // Sinkronisasi tabel
    await sequelize.sync({
      force: false,
      alter: true
    });

    console.log('✅ Database berhasil disinkronisasi');
    console.log('📊 Tabel-tabel berhasil dibuat/diperbarui');

    // Buat data default
    await createDefaultData();

  } catch (error) {
    console.error('❌ Gagal sinkronisasi database:', error);
    throw error;
  }
};

const createDefaultData = async () => {
  try {
    // ===============================
    // 1️⃣ BUAT ADMIN DEFAULT
    // ===============================
    const adminExists = await User.findOne({
      where: { role: 'Admin' }
    });

    if (!adminExists) {
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
    } else {
      console.log('ℹ️ Admin sudah ada');
    }

    // ===============================
    // 2️⃣ CEK TAHUN AJARAN AKTIF
    // ===============================
    const tahunAjaranAktif = await TahunAjaran.findOne({
      where: { status: 'Aktif' }
    });

    if (!tahunAjaranAktif) {
      // ===============================
      // BUAT TAHUN AJARAN BARU
      // ===============================
      const currentYear = new Date().getFullYear();
      const tahunAjaran = `${currentYear}/${currentYear + 1}`;

      const newTahunAjaran = await TahunAjaran.create({
        tahun: tahunAjaran,
        status: 'Aktif'
      });

      // ===============================
      // BUAT SEMESTER GANJIL & GENAP
      // ===============================
      await Semester.bulkCreate([
        {
          tahun_ajaran_id: newTahunAjaran.id,
          nama: 'Ganjil',
          status: 'Nonaktif'
        },
        {
          tahun_ajaran_id: newTahunAjaran.id,
          nama: 'Genap',
          status: 'Nonaktif'
        }
      ]);

      console.log('✅ Tahun ajaran & semester berhasil dibuat');
    } else {
      // ===============================
      // 3️⃣ TAHUN AJARAN SUDAH ADA
      //     → CEK SEMESTER
      // ===============================
      const jumlahSemester = await Semester.count({
        where: { tahun_ajaran_id: tahunAjaranAktif.id }
      });

      if (jumlahSemester === 0) {
        await Semester.bulkCreate([
          {
            tahun_ajaran_id: tahunAjaranAktif.id,
            nama: 'Ganjil',
            status: 'Nonaktif'
          },
          {
            tahun_ajaran_id: tahunAjaranAktif.id,
            nama: 'Genap',
            status: 'Nonaktif'
          }
        ]);

        console.log('✅ Semester otomatis berhasil dibuat');
      } else {
        console.log('ℹ️ Semester sudah ada, tidak perlu dibuat ulang');
      }
    }

    console.log('🎉 Setup database selesai!');

  } catch (error) {
    console.error('❌ Gagal membuat data default:', error);
  }
};

module.exports = { syncDatabase };
