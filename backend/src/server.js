const app = require('./app');
const prisma = require('./infrastructure/database/prisma.client');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('Successfully connected to MySQL database');

    const http = require('http');
    const { Server } = require('socket.io');
    const socketService = require('./infrastructure/realtime/socket.service');
    const { socketAuthMiddleware, handleSocketConnection } = require('./infrastructure/realtime/socket.handler');

    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: '*', // For local dev, simplify or mirror app CORS
        credentials: true,
        methods: ['GET', 'POST']
      }
    });

    // Initialize socket service
    socketService.setIo(io);

    // Apply socket middlewares & connection handler
    io.use(socketAuthMiddleware);
    io.on('connection', (socket) => handleSocketConnection(io, socket));

    server.listen(PORT, () => {
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
