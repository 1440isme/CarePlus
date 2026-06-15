const express = require('express');
const upload = require('../../middleware/multer.middleware');
const UploadController = require('./upload.controller');

const router = express.Router();

/**
 * Route: POST /api/v1/upload/image
 * Expects multi-part/form-data with field name 'image'
 */
router.post('/image', upload.single('image'), UploadController.uploadImage);

/**
 * Route: POST /api/v1/upload/delete
 * Expects JSON payload with { "public_id": "..." }
 */
router.post('/delete', UploadController.deleteImage);

module.exports = router;
