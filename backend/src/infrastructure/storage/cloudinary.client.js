const cloudinary = require('cloudinary').v2;

// Load env vars if not loaded (fallback, app.js already loads dotenv)
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  require('dotenv').config();
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

module.exports = cloudinary;
