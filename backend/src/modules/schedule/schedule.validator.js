const { z } = require('zod');
const {
  SCHEDULE_ERROR_CODES,
  SCHEDULE_PAGINATION,
  SCHEDULE_STATUSES,
  SCHEDULE_VIEWS,
  WORKING_SHIFTS,
  VALID_WEEKDAYS,
} = require('./schedule.types');

function sendValidationError(res, details) {
  return res.status(400).json({
    success: false,
    error: {
      code: SCHEDULE_ERROR_CODES.VALIDATION_ERROR,
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

const shiftEnumValues = Object.values(WORKING_SHIFTS);
const scheduleViewValues = Object.values(SCHEDULE_VIEWS);
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'time must use HH:mm format');

const idParamSchema = z.object({
  doctorId: z.string().trim().min(1, 'doctorId is required'),
});

const singleScheduleSchema = z.object({
  doctorId: z.string().trim().min(1),
  workingDate: z.string().date(),
  shifts: z.array(z.enum(shiftEnumValues)).min(1).optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
}).strict();

const batchScheduleSchema = z.object({
  doctorId: z.string().trim().min(1),
  fromDate: z.string().date(),
  toDate: z.string().date(),
  weekdays: z.array(z.number().int().min(0).max(6)).min(1),
  shifts: z.array(z.enum(shiftEnumValues)).min(1).optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
}).strict();

const createScheduleSchema = z.union([singleScheduleSchema, batchScheduleSchema]);

const listSchedulesQuerySchema = z.object({
  doctorId: z.string().trim().min(1).optional(),
  status: z.enum(Object.values(SCHEDULE_STATUSES)).optional(),
  date: z.string().date().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  view: z.enum(scheduleViewValues).optional(),
  page: z.coerce.number().int().min(1).default(SCHEDULE_PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(SCHEDULE_PAGINATION.MAX_LIMIT).default(SCHEDULE_PAGINATION.DEFAULT_LIMIT),
}).strict();

function validateCreateSchedule(req, res, next) {
  const parsed = createScheduleSchema.safeParse(req.body || {});

  if (!parsed.success) {
    return sendValidationError(res, buildIssueDetails(parsed.error));
  }

  if (Array.isArray(parsed.data.weekdays)) {
    const invalidWeekday = parsed.data.weekdays.find((value) => !VALID_WEEKDAYS.includes(value));
    if (invalidWeekday !== undefined) {
      return sendValidationError(res, [{ field: 'weekdays', message: 'weekdays must contain values from 0 to 6' }]);
    }
  }

  req.body = parsed.data;
  return next();
}

function validateListSchedules(req, res, next) {
  const parsed = listSchedulesQuerySchema.safeParse(req.query || {});

  if (!parsed.success) {
    return sendValidationError(res, buildIssueDetails(parsed.error));
  }

  req.query = parsed.data;
  return next();
}

function validateDoctorScheduleParams(req, res, next) {
  const paramsParsed = idParamSchema.safeParse(req.params || {});
  const queryParsed = listSchedulesQuerySchema.safeParse(req.query || {});

  if (!paramsParsed.success || !queryParsed.success) {
    const details = [
      ...(paramsParsed.success ? [] : buildIssueDetails(paramsParsed.error)),
      ...(queryParsed.success ? [] : buildIssueDetails(queryParsed.error)),
    ];
    return sendValidationError(res, details);
  }

  req.params = paramsParsed.data;
  req.query = queryParsed.data;
  return next();
}

module.exports = {
  validateCreateSchedule,
  validateListSchedules,
  validateDoctorScheduleParams,
};
