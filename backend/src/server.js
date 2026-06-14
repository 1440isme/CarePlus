const app = require('./app');
const prisma = require('./infrastructure/database/prisma.client');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('Successfully connected to MySQL database');

    const server = app.listen(PORT, () => {
      console.log(`CarePlus Backend Server running on port ${PORT}`);
      console.log(`Health check URL: http://localhost:${PORT}/health`);
    });

    // Handle graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down server...');
      server.close(async () => {
        console.log('Express server closed.');
        await prisma.$disconnect();
        console.log('Database connection disconnected.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('Failed to start CarePlus Backend Server:', error);
    process.exit(1);
  }
}

startServer();
