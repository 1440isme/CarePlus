const reviewService = require('./review.service');
const { ReviewServiceError } = require('./review.service');

class ReviewController {
  /**
   * Submit a review for a completed appointment.
   * POST /api/v1/reviews
   */
  async createReview(req, res, next) {
    try {
      const userId = req.user.userId;
      const review = await reviewService.createReview(userId, req.body);
      
      return res.status(201).json({
        success: true,
        data: review,
        message: 'Đánh giá bác sĩ thành công'
      });
    } catch (error) {
      if (error instanceof ReviewServiceError) {
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details
          }
        });
      }
      return next(error);
    }
  }

  /**
   * Get reviews of a doctor.
   * GET /api/v1/reviews/doctor/:doctorId
   */
  async listDoctorReviews(req, res, next) {
    try {
      const { doctorId } = req.params;
      const result = await reviewService.listDoctorReviews(doctorId, req.query);
      
      return res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Check if an appointment has been reviewed.
   * GET /api/v1/reviews/appointment/:appointmentId
   */
  async getAppointmentReview(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const result = await reviewService.getAppointmentReview(appointmentId);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new ReviewController();
