const multer = require('multer');

// Configure memory storage
const storage = multer.memoryStorage();

// File filter to allow only image formats
const fileFilter = (req, file, cb) => {
  const allowedMimetypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedMimetypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Only JPEG, PNG, WEBP, and GIF image files are allowed.');
    error.statusCode = 400;
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// Multer upload middleware configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  }
});

module.exports = upload;
