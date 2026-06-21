const multer = require('multer');

const storage = multer.memoryStorage();

const DEFAULT_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const AVATAR_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024;
const AVATAR_MAX_FILE_SIZE = 2 * 1024 * 1024;

function createFileFilter(allowedMimeTypes) {
  return (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    const error = new Error('Chỉ chấp nhận file ảnh JPEG, PNG hoặc WEBP.');
    error.statusCode = 400;
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  };
}

function createUpload(options = {}) {
  const {
    allowedMimeTypes = DEFAULT_ALLOWED_MIME_TYPES,
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
  } = options;

  return multer({
    storage,
    fileFilter: createFileFilter(allowedMimeTypes),
    limits: {
      fileSize: maxFileSize,
    },
  });
}

function createSingleImageUpload(fieldName, options = {}) {
  const upload = createUpload(options);

  return (req, res, next) => {
    upload.single(fieldName)(req, res, (error) => {
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        error.statusCode = 400;
        error.code = 'FILE_TOO_LARGE';
        error.message = 'Kích thước file vượt quá giới hạn cho phép.';
      }

      next(error);
    });
  };
}

const upload = createUpload();
const uploadAvatar = createSingleImageUpload('avatar', {
  allowedMimeTypes: AVATAR_ALLOWED_MIME_TYPES,
  maxFileSize: AVATAR_MAX_FILE_SIZE,
});

module.exports = upload;
module.exports.createSingleImageUpload = createSingleImageUpload;
module.exports.uploadAvatar = uploadAvatar;
module.exports.AVATAR_ALLOWED_MIME_TYPES = AVATAR_ALLOWED_MIME_TYPES;
module.exports.AVATAR_MAX_FILE_SIZE = AVATAR_MAX_FILE_SIZE;
