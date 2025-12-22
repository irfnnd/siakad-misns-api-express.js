const app = require('./app');
const { syncDatabase } = require('./utils/databaseSync');
const sequelize = require('./config/database');

const PORT = process.env.PORT || 3000;


const startServer = async () => {
  try {
    console.log('🚀 Starting Siakad MISNS Backend...');
    
    // Test koneksi database
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Sinkronisasi database
    await syncDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log('\n✨ =================================');
      console.log('✅ Siakad MISNS Backend berhasil dijalankan!');
      console.log('✨ =================================');
      console.log(`🌐 Server: http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`💾 Database: ${process.env.DB_NAME}`);
      console.log(`👤 Default Admin: admin / admin123`);
      console.log('✨ =================================\n');
    });
    
  } catch (error) {
    console.error('\n❌ Gagal memulai server:', error.message);
    process.exit(1);
  }
};

startServer();