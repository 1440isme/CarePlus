const cloudinary = require('../../infrastructure/storage/cloudinary.client');

class UploadService {
  /**
   * Uploads an image buffer directly to Cloudinary using a stream.
   * @param {Buffer} fileBuffer - File buffer from multer memory storage
   * @param {string} folder - Cloudinary target folder path
   * @returns {Promise<{url: string, public_id: string}>}
   */
  static async uploadImage(fileBuffer, folder) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            const uploadError = new Error('Failed to upload image to Cloudinary');
            uploadError.statusCode = 500;
            uploadError.code = 'UPLOAD_FAILED';
            uploadError.details = null;
            return reject(uploadError);
          }
          
          resolve({
            url: result.secure_url,
            public_id: result.public_id
          });
        }
      );

      uploadStream.end(fileBuffer);
    });
  }

  /**
   * Deletes an image from Cloudinary by public ID.
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<any>}
   */
  static async deleteImage(publicId) {
    if (!publicId) return null;
    
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          const deleteError = new Error('Failed to delete image from Cloudinary');
          deleteError.statusCode = 500;
          deleteError.code = 'DELETE_FAILED';
          deleteError.details = null;
          return reject(deleteError);
        }
        resolve(result);
      });
    });
  }
}

module.exports = UploadService;
