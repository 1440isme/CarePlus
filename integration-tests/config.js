require('dotenv').config();

module.exports = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:5173',
  apiBaseUrl: process.env.TEST_API_BASE_URL || 'http://localhost:5000/api/v1',
  headless: String(process.env.TEST_HEADLESS || 'true').toLowerCase() === 'true',
  users: {
    admin: {
      email: process.env.TEST_ADMIN_EMAIL || 'admin@careplus.vn',
      password: process.env.TEST_ADMIN_PASSWORD || '123456',
    },
    receptionist: {
      email: process.env.TEST_RECEPTIONIST_EMAIL || 'letan@careplus.vn',
      password: process.env.TEST_RECEPTIONIST_PASSWORD || '123456',
    },
    doctor: {
      email: process.env.TEST_DOCTOR_EMAIL || 'bsminhanh@careplus.vn',
      password: process.env.TEST_DOCTOR_PASSWORD || '123456',
    },
    patient: {
      email: process.env.TEST_PATIENT_EMAIL || 'nguyenanhtuan@email.com',
      password: process.env.TEST_PATIENT_PASSWORD || '123456',
    },
  },
};
