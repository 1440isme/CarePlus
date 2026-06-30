const express = require('express');
const reviewController = require('./review.controller');
const { validateCreateReview, validateGetDoctorReviews } = require('./review.validator');
const { REVIEW_ROUTE_PATHS } = require('./review.types');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { USER_ROLES } = require('../../shared/constants/roles');

const router = express.Router();

/**
 * Route: POST /api/v1/reviews
 * Submit a review for a completed appointment.
 * Only accessible to logged-in patients.
 */
router.post(
  REVIEW_ROUTE_PATHS.ROOT,
  authenticate,
  authorize(USER_ROLES.PATIENT),
  validateCreateReview,
  reviewController.createReview
);

/**
 * Route: GET /api/v1/reviews/doctor/:doctorId
 * Get paginated list of reviews for a doctor.
 * Publicly accessible.
 */
router.get(
  REVIEW_ROUTE_PATHS.DOCTOR_REVIEWS,
  validateGetDoctorReviews,
  reviewController.listDoctorReviews
);

/**
 * Route: GET /api/v1/reviews/appointment/:appointmentId
 * Check if a review exists for an appointment.
 * Accessible to authenticated users.
 */
router.get(
  REVIEW_ROUTE_PATHS.APPOINTMENT_REVIEW,
  authenticate,
  reviewController.getAppointmentReview
);

module.exports = router;
