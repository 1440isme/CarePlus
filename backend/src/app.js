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
const clinicSettingsRoutes = require('./modules/clinic-settings/clinic-settings.routes');
const specialtyRoutes = require('./modules/specialty/specialty.routes');
const blogRoutes = require('./modules/blog/blog.routes');
const searchRoutes = require('./modules/search/search.routes');
const appointmentRoutes = require('./modules/appointment/appointment.routes');
const reviewRoutes = require('./modules/review/review.routes');
const chatRoutes = require('./modules/chat/chat.routes');
const notificationRoutes = require('./modules/notification/notification.routes');
const aiAssistantRoutes = require('./modules/ai-assistant/ai-assistant.routes');

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
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/clinic-settings', clinicSettingsRoutes);
app.use('/api/v1/specialties', specialtyRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/ai-assistant', aiAssistantRoutes);

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
  
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'Something went wrong on the server';

  // Handle MulterErrors
  const multer = require('multer');
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      code = 'FILE_TOO_LARGE';
      message = 'Kích thước file vượt quá giới hạn cho phép (tối đa 5MB).';
    } else {
      code = err.code || 'UPLOAD_ERROR';
      message = err.message || 'Lỗi tải tệp tin lên.';
    }
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details: err.details || null
    }
  });
});

module.exports = app;
