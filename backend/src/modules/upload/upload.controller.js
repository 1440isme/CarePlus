const UploadService = require('./upload.service');

class UploadController {
  /**
   * Controller to handle single image uploads.
   * Route: POST /api/v1/upload/image
   */
  static async uploadImage(req, res, next) {
    try {
      if (!req.file) {
        const error = new Error('No image file provided');
        error.statusCode = 400;
        error.code = 'NO_FILE_UPLOADED';
        throw error;
      }

      const { type, userId, postId } = req.body;
      
      // Determine folder path on Cloudinary based on type and guidelines
      let folder = 'careplus/clinic';
      
      if (type === 'avatar') {
        const id = userId || req.user?.userId || 'unknown';
        folder = `careplus/avatars/${id}`;
      } else if (type === 'blog') {
        const id = postId || 'temp';
        folder = `careplus/blog/${id}`;
      }

      // Upload the buffer to Cloudinary
      const result = await UploadService.uploadImage(req.file.buffer, folder);

      // Return standard CarePlus response envelope
      res.status(200).json({
        success: true,
        data: {
          url: result.url,
          public_id: result.public_id
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Controller to delete an image by public ID.
   * Route: POST /api/v1/upload/delete
   */
  static async deleteImage(req, res, next) {
    try {
      const { public_id } = req.body;

      if (!public_id) {
        const error = new Error('public_id is required');
        error.statusCode = 400;
        error.code = 'MISSING_PUBLIC_ID';
        throw error;
      }

      await UploadService.deleteImage(public_id);

      res.status(200).json({
        success: true,
        data: {
          message: 'Image deleted successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UploadController;
