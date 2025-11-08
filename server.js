const app = require('./app');
const { syncDatabase } = require('./utils/databaseSync');

const PORT = process.env.PORT || 3000;

// Sync database dan start server
const startServer = async () => {
  try {
    // Sinkronisasi database
    await syncDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server Siakad SD berjalan di port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Gagal memulai server:', error);
    process.exit(1);
  }
};

startServer();