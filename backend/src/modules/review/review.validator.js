const { z } = require('zod');
const { REVIEW_ERROR_CODES, REVIEW_PAGINATION } = require('./review.types');

function sendValidationError(res, details, code = REVIEW_ERROR_CODES.VALIDATION_ERROR, message = 'Dữ liệu không hợp lệ') {
  return res.status(400).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}

function mapIssues(issues) {
  return issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : 'body',
    message: issue.message,
  }));
}

const createReviewSchema = z.object({
  appointmentId: z.string().min(1, 'ID lịch hẹn không hợp lệ'),
  rating: z.coerce.number().int().min(1, 'Đánh giá tối thiểu là 1 sao').max(5, 'Đánh giá tối đa là 5 sao'),
  comment: z.string()
    .trim()
    .min(10, 'Nội dung nhận xét phải có tối thiểu 10 ký tự')
    .max(1000, 'Nội dung nhận xét tối đa 1000 ký tự'),
}).strict();

const getDoctorReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(REVIEW_PAGINATION.MAX_LIMIT).optional(),
}).strict();

function validateCreateReview(req, res, next) {
  const parsedResult = createReviewSchema.safeParse(req.body || {});
  if (!parsedResult.success) {
    return sendValidationError(res, mapIssues(parsedResult.error.issues));
  }
  req.body = parsedResult.data;
  return next();
}

function validateGetDoctorReviews(req, res, next) {
  const parsedResult = getDoctorReviewsQuerySchema.safeParse(req.query || {});
  if (!parsedResult.success) {
    return sendValidationError(res, mapIssues(parsedResult.error.issues));
  }
  req.query = parsedResult.data;
  return next();
}

module.exports = {
  validateCreateReview,
  validateGetDoctorReviews,
};
