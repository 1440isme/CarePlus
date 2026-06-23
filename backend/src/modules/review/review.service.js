const prisma = require('../../infrastructure/database/prisma.client');
const reviewRepository = require('./review.repository');
const ratingRepository = require('./rating.repository');
const SearchService = require('../search/search.service');
const { REVIEW_ERROR_CODES } = require('./review.types');

class ReviewServiceError extends Error {
  constructor({ code, message, statusCode, details = [] }) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

class ReviewService {
  /**
   * Submit a review for a completed appointment.
   */
  async createReview(userId, { appointmentId, rating, comment }) {
    // 1. Fetch appointment details
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true }
    });

    if (!appointment) {
      throw new ReviewServiceError({
        code: REVIEW_ERROR_CODES.APPOINTMENT_NOT_FOUND,
        message: 'Lịch hẹn không tồn tại',
        statusCode: 404
      });
    }

    // 2. Validate patient ownership
    if (appointment.patientId !== userId) {
      throw new ReviewServiceError({
        code: REVIEW_ERROR_CODES.UNAUTHORIZED_REVIEWER,
        message: 'Bạn không có quyền đánh giá lịch hẹn này',
        statusCode: 403
      });
    }

    // 3. Validate appointment status is COMPLETED
    if (appointment.status !== 'COMPLETED') {
      throw new ReviewServiceError({
        code: REVIEW_ERROR_CODES.APPOINTMENT_NOT_COMPLETED,
        message: 'Chỉ có thể đánh giá những lịch hẹn đã hoàn thành khám',
        statusCode: 400
      });
    }

    // 4. Validate if a review already exists
    const existingReview = await reviewRepository.findOne({ appointmentId });
    if (existingReview) {
      throw new ReviewServiceError({
        code: REVIEW_ERROR_CODES.REVIEW_ALREADY_EXISTS,
        message: 'Lịch hẹn này đã được đánh giá trước đó',
        statusCode: 400
      });
    }

    // 5. Create Review
    const review = await reviewRepository.create({
      appointmentId,
      doctorId: appointment.doctorId,
      patientId: userId,
      patientName: appointment.patient.name,
      rating,
      comment
    });

    // 6. Recalculate doctor rating & count
    const ratingSummary = await ratingRepository.recalculateDoctorRating(appointment.doctorId);

    // 7. Sync updated doctor to Elasticsearch
    try {
      const updatedDoctor = await prisma.doctor.findUnique({
        where: { id: appointment.doctorId }
      });
      if (updatedDoctor) {
        await SearchService.indexDocument('doctors', updatedDoctor.id, {
          name: updatedDoctor.name,
          specialtyName: updatedDoctor.specialtyName,
          description: updatedDoctor.description,
          title: updatedDoctor.title,
          experience: updatedDoctor.experience,
          price: updatedDoctor.price,
          rating: updatedDoctor.rating,
          active: updatedDoctor.active
        });
      }
    } catch (esError) {
      console.error('[ReviewService] Failed to sync doctor to Elasticsearch:', esError.message);
    }

    return review;
  }

  /**
   * Get reviews for a doctor (paginated)
   */
  async listDoctorReviews(doctorId, filters = {}) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 5;

    const result = await reviewRepository.findMany({
      page,
      limit,
      doctorId,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }, {
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });

    return result;
  }

  /**
   * Check if review exists for an appointment
   */
  async getAppointmentReview(appointmentId) {
    const review = await reviewRepository.findOne({ appointmentId });
    return {
      reviewed: !!review,
      review
    };
  }
}

module.exports = new ReviewService();
module.exports.ReviewServiceError = ReviewServiceError;
