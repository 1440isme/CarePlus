const { z } = require('zod');
const { WORKING_SHIFTS } = require('../schedule/schedule.types');
const {
  APPROVAL_REQUEST_ERROR_CODES,
  APPROVAL_REQUEST_PAGINATION,
  APPROVAL_REQUEST_TYPES,
  EXCEPTION_TYPES,
  APPROVAL_STATUSES,
} = require('./approval-request.types');

function sendValidationError(res, details) {
  return res.status(400).json({
    success: false,
    error: {
      code: APPROVAL_REQUEST_ERROR_CODES.VALIDATION_ERROR,
      message: 'Dữ liệu không hợp lệ',
      details,
    },
  });
}

function buildIssueDetails(error) {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : 'body',
    message: issue.message,
  }));
}

const exceptionShiftValues = [
  WORKING_SHIFTS.MORNING,
  WORKING_SHIFTS.AFTERNOON,
];

const scheduleExceptionSchema = z.object({
  type: z.literal(APPROVAL_REQUEST_TYPES.SCHEDULE_EXCEPTION),
  date: z.string().date(),
  exceptionType: z.enum(Object.values(EXCEPTION_TYPES)),
  shift: z.enum(exceptionShiftValues).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'startTime must be in HH:MM format').optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'endTime must be in HH:MM format').optional(),
  reason: z.string().trim().min(5).max(1000),
}).strict().superRefine((value, ctx) => {
  if (value.exceptionType === EXCEPTION_TYPES.SHIFT && !value.shift) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['shift'],
      message: 'shift is required when exceptionType is SHIFT',
    });
  }

  if (value.exceptionType === EXCEPTION_TYPES.TIME_RANGE) {
    if (!value.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startTime'],
        message: 'startTime is required when exceptionType is TIME_RANGE',
      });
    }

    if (!value.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'endTime is required when exceptionType is TIME_RANGE',
      });
    }

    if (value.startTime && value.endTime && value.startTime >= value.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'endTime must be greater than startTime',
      });
    }
  }
});

const listRequestsQuerySchema = z.object({
  type: z.enum(Object.values(APPROVAL_REQUEST_TYPES)).optional(),
  status: z.enum(Object.values(APPROVAL_STATUSES)).optional(),
  doctorId: z.string().trim().min(1).optional(),
  date: z.string().date().optional(),
  page: z.coerce.number().int().min(1).default(APPROVAL_REQUEST_PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(APPROVAL_REQUEST_PAGINATION.MAX_LIMIT).default(APPROVAL_REQUEST_PAGINATION.DEFAULT_LIMIT),
}).strict();

const requestIdSchema = z.object({
  id: z.string().trim().min(1, 'id is required'),
});

function validateCreateScheduleException(req, res, next) {
  const parsed = scheduleExceptionSchema.safeParse(req.body || {});

  if (!parsed.success) {
    return sendValidationError(res, buildIssueDetails(parsed.error));
  }

  req.body = parsed.data;
  return next();
}

function validateListApprovalRequests(req, res, next) {
  const parsed = listRequestsQuerySchema.safeParse(req.query || {});

  if (!parsed.success) {
    return sendValidationError(res, buildIssueDetails(parsed.error));
  }

  req.query = parsed.data;
  return next();
}

function validateApprovalRequestId(req, res, next) {
  const parsed = requestIdSchema.safeParse(req.params || {});

  if (!parsed.success) {
    return sendValidationError(res, buildIssueDetails(parsed.error));
  }

  req.params = parsed.data;
  return next();
}

module.exports = {
  validateCreateScheduleException,
  validateListApprovalRequests,
  validateApprovalRequestId,
};
