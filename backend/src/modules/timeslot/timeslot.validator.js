const { z } = require('zod');
const { TIMESLOT_ERROR_CODES } = require('./timeslot.types');

function sendValidationError(res, details) {
  return res.status(400).json({
    success: false,
    error: {
      code: TIMESLOT_ERROR_CODES.VALIDATION_ERROR,
      message: 'Dữ liệu không hợp lệ',
      details,
    },
  });
}

function buildIssueDetails(error) {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : 'query',
    message: issue.message,
  }));
}

const listTimeSlotsSchema = z.object({
  doctorId: z.string().trim().min(1),
  date: z.string().date(),
}).strict();

function validateListTimeSlots(req, res, next) {
  const parsed = listTimeSlotsSchema.safeParse(req.query || {});

  if (!parsed.success) {
    return sendValidationError(res, buildIssueDetails(parsed.error));
  }

  req.query = parsed.data;
  return next();
}

module.exports = {
  validateListTimeSlots,
};
