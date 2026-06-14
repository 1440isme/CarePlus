const BaseRepository = require('./base.repository');

class ReviewRepository extends BaseRepository {
  constructor() {
    super('Review');
  }

  /**
   * Add a new review and recalculate the doctor's rating.
   * @param {object} reviewData - { appointmentId, doctorId, patientId, patientName, rating, comment }
   * @returns {Promise<object>} Created review
   */
  async addReview(reviewData) {
    const review = await this.prisma.review.create({
      data: {
        ...reviewData,
        createdAt: new Date(),
      },
    });
    // Recalculate rating using RatingRepository (assume it will be required later)
    const ratingRepo = require('./rating.repository');
    await ratingRepo.recalculateDoctorRating(review.doctorId);
    return review;
  }

  // Define custom query methods here if needed
}

module.exports = new ReviewRepository();
