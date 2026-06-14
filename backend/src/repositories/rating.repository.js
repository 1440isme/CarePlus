// Rating repository for Doctor rating calculations
const prisma = require('../infrastructure/database/prisma.client');

class RatingRepository {
  /**
   * Recalculate and update the doctor's average rating and review count.
   * @param {string} doctorId
   * @returns {Promise<{average: number, count: number}>} Updated rating summary
   */
  async recalculateDoctorRating(doctorId) {
    // Fetch all reviews for the doctor
    const reviews = await prisma.review.findMany({
      where: { doctorId },
      select: { rating: true },
    });
    const count = reviews.length;
    const average = count === 0 ? 0 : Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10;
    // Update Doctor model
    await prisma.doctor.update({
      where: { id: doctorId },
      data: { rating: average, reviewCount: count },
    });
    return { average, count };
  }

  /**
   * Get current rating summary for a doctor.
   * @param {string} doctorId
   * @returns {Promise<{average: number, count: number}>}
   */
  async getRatingSummary(doctorId) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { rating: true, reviewCount: true },
    });
    return { average: doctor?.rating ?? 0, count: doctor?.reviewCount ?? 0 };
  }

  /**
   * Retrieve all reviews for a doctor (convenience wrapper).
   * @param {string} doctorId
   */
  async getReviewsByDoctor(doctorId) {
    return prisma.review.findMany({
      where: { doctorId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

module.exports = new RatingRepository();
