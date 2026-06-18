const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./modules/auth/auth.routes');
const doctorRoutes = require('./modules/doctor/doctor.routes');
const scheduleRoutes = require('./modules/schedule/schedule.routes');
const timeslotRoutes = require('./modules/timeslot/timeslot.routes');
const approvalRequestRoutes = require('./modules/approval/approval-request.routes');
const uploadRoutes = require('./modules/upload/upload.routes');
const userRoutes = require('./modules/user/user.routes');
const patientProfileRoutes = require('./modules/patient-profile/patient-profile.routes');

// Load environment variables
dotenv.config();

const redis = require('./infrastructure/cache/redis.client');
const elasticClient = require('./infrastructure/search/elastic.client');
const prismaClient = require('./infrastructure/database/prisma.client');

const app = express();

function getAllowedCorsOrigins() {
  const configuredOrigins = process.env.CORS_ORIGIN;

  if (!configuredOrigins) {
    return ['http://localhost:5173'];
  }

  return configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedCorsOrigins = getAllowedCorsOrigins();

// Standard middlewares
app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedCorsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS origin is not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Basic health check endpoint
app.get('/health', async (req, res) => {
  const healthDetails = {
    uptime: process.uptime(),
    timestamp: new Date(),
    services: {
      database: 'unknown',
      redis: 'unknown',
      elasticsearch: 'unknown'
    }
  };

  let isHealthy = true;

  // 1. Check Redis
  try {
    const pingResponse = await redis.ping();
    if (pingResponse === 'PONG') {
      healthDetails.services.redis = 'healthy';
    } else {
      healthDetails.services.redis = 'unhealthy';
      isHealthy = false;
    }
  } catch (error) {
    healthDetails.services.redis = `error: ${error.message}`;
    isHealthy = false;
  }

  // 2. Check Elasticsearch
  try {
    const esPing = await elasticClient.ping();
    if (esPing) {
      healthDetails.services.elasticsearch = 'healthy';
    } else {
      healthDetails.services.elasticsearch = 'unhealthy';
      isHealthy = false;
    }
  } catch (error) {
    healthDetails.services.elasticsearch = `error: ${error.message}`;
    isHealthy = false;
  }

  // 3. Check Database (Prisma)
  try {
    await prismaClient.$queryRaw`SELECT 1`;
    healthDetails.services.database = 'healthy';
  } catch (error) {
    healthDetails.services.database = `error: ${error.message}`;
    isHealthy = false;
  }

  if (isHealthy) {
    return res.status(200).json({
      success: true,
      message: 'CarePlus API and all services are healthy',
      details: healthDetails
    });
  } else {
    return res.status(503).json({
      success: false,
      message: 'One or more services are down',
      details: healthDetails
    });
  }
});

// Root API route
app.get('/api/v1', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to CarePlus Clinic API v1'
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/schedules', scheduleRoutes);
app.use('/api/v1/timeslots', timeslotRoutes);
app.use('/api/v1/approval-requests', approvalRequestRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/patient-profiles', patientProfileRoutes);
app.use('/api/v1/upload', uploadRoutes);

// Global 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Something went wrong on the server',
      details: err.details || null
    }
  });
});

module.exports = app;
