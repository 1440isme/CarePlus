const { z } = require('zod');
const {
  APPOINTMENT_ERROR_CODES,
  APPOINTMENT_PAGINATION,
  VALID_APPOINTMENT_STATUSES,
} = require('./appointment.types');
const { WORKING_SHIFTS } = require('../schedule/schedule.types');

function sendValidationError(res, details, code = APPOINTMENT_ERROR_CODES.VALIDATION_ERROR, message = 'Validation failed') {
  return res.status(400).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}

const isValidUuid = (val) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
};

const createAppointmentSchema = z.object({
  timeSlotId: z.string()
    .trim()
    .min(1, 'timeSlotId is required'),
  doctorId: z.string().trim().min(1).optional(),
  date: z.string().date().optional(),
  workingShift: z.enum([WORKING_SHIFTS.MORNING, WORKING_SHIFTS.AFTERNOON]).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'startTime must be in HH:mm format').optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'endTime must be in HH:mm format').optional(),
  forSelf: z.boolean(),
  patientProfileId: z.string()
    .trim()
    .min(1, 'patientProfileId must be a non-empty string')
    .optional(),
  reason: z.string()
    .trim()
    .max(500, 'reason must be at most 500 characters')
    .optional(),
  lockClientId: z.string().trim().optional(),
}).strict().refine((data) => {
  if (data.forSelf === false && !data.patientProfileId) {
    return false;
  }
  return true;
}, {
  message: 'patientProfileId is required when forSelf is false',
  path: ['patientProfileId'],
});

const createReceptionistAppointmentSchema = z.object({
  patientId: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.string().date().optional(),
  address: z.string().trim().optional(),
  timeSlotId: z.string()
    .trim()
    .min(1, 'timeSlotId is required'),
  doctorId: z.string().trim().min(1).optional(),
  date: z.string().date().optional(),
  workingShift: z.enum([WORKING_SHIFTS.MORNING, WORKING_SHIFTS.AFTERNOON]).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'startTime must be in HH:mm format').optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'endTime must be in HH:mm format').optional(),
  forSelf: z.boolean(),
  patientProfileId: z.string()
    .trim()
    .min(1, 'patientProfileId must be a non-empty string')
    .optional(),
  reason: z.string()
    .trim()
    .max(500, 'reason must be at most 500 characters')
    .optional(),
  note: z.string()
    .trim()
    .max(500, 'note must be at most 500 characters')
    .optional(),
  lockClientId: z.string().trim().optional(),
}).strict().refine((data) => {
  if (!data.patientId && (!data.name || !data.phone || !data.email)) {
    return false;
  }
  if (data.forSelf === false && !data.patientProfileId) {
    return false;
  }
  return true;
}, {
  message: 'patientProfileId is required when forSelf is false, or name, phone and email are required if patientId is omitted',
  path: ['patientId'],
});

const updateStatusSchema = z.object({
  status: z.string()
    .trim()
    .toUpperCase()
    .refine((val) => ['CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(val), {
      message: 'status must be one of CHECKED_IN, COMPLETED, CANCELLED, NO_SHOW',
    }),
  reason: z.string()
    .trim()
    .max(500, 'reason must be at most 500 characters')
    .optional(),
  note: z.string()
    .trim()
    .max(500, 'note must be at most 500 characters')
    .optional(),
}).strict();

function validateCreateAppointment(req, res, next) {
  const parsedResult = createAppointmentSchema.safeParse(req.body || {});

  if (!parsedResult.success) {
    const details = parsedResult.error.issues.map((issue) => ({
      field: issue.path.length > 0 ? issue.path.join('.') : 'body',
      message: issue.message,
    }));

    return sendValidationError(res, details, APPOINTMENT_ERROR_CODES.VALIDATION_ERROR, 'Dữ liệu không hợp lệ');
  }

  req.body = parsedResult.data;
  return next();
}

function validateCreateReceptionistAppointment(req, res, next) {
  const parsedResult = createReceptionistAppointmentSchema.safeParse(req.body || {});

  if (!parsedResult.success) {
    const details = parsedResult.error.issues.map((issue) => ({
      field: issue.path.length > 0 ? issue.path.join('.') : 'body',
      message: issue.message,
    }));

    return sendValidationError(res, details, APPOINTMENT_ERROR_CODES.VALIDATION_ERROR, 'Dữ liệu không hợp lệ');
  }

  req.body = parsedResult.data;
  return next();
}

function validateListAppointments(req, res, next) {
  const { page, limit, status, date, doctorId, patientId, specialtyId, startDate, endDate } = req.query;
  const details = [];

  if (startDate !== undefined) {
    const startDateTrim = startDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDateTrim) || Number.isNaN(Date.parse(startDateTrim))) {
      details.push({
        field: 'startDate',
        message: 'startDate must be a valid date string in YYYY-MM-DD format',
      });
    }
  }

  if (endDate !== undefined) {
    const endDateTrim = endDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(endDateTrim) || Number.isNaN(Date.parse(endDateTrim))) {
      details.push({
        field: 'endDate',
        message: 'endDate must be a valid date string in YYYY-MM-DD format',
      });
    }
  }

  if (specialtyId !== undefined && (typeof specialtyId !== 'string' || !specialtyId.trim())) {
    details.push({
      field: 'specialtyId',
      message: 'specialtyId must be a non-empty string',
    });
  }

  if (page !== undefined) {
    const parsedPage = Number.parseInt(page, 10);
    if (!Number.isInteger(parsedPage) || parsedPage < 1) {
      details.push({
        field: 'page',
        message: 'page must be an integer greater than or equal to 1',
      });
    }
  }

  if (limit !== undefined) {
    const parsedLimit = Number.parseInt(limit, 10);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > APPOINTMENT_PAGINATION.MAX_LIMIT) {
      details.push({
        field: 'limit',
        message: `limit must be an integer between 1 and ${APPOINTMENT_PAGINATION.MAX_LIMIT}`,
      });
    }
  }

  if (status !== undefined) {
    const statusUpper = status.trim().toUpperCase();
    if (!VALID_APPOINTMENT_STATUSES.includes(statusUpper)) {
      details.push({
        field: 'status',
        message: `status must be one of ${VALID_APPOINTMENT_STATUSES.join(', ')}`,
      });
    }
  }

  if (date !== undefined) {
    const dateTrim = date.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateTrim) || Number.isNaN(Date.parse(dateTrim))) {
      details.push({
        field: 'date',
        message: 'date must be a valid date string in YYYY-MM-DD format',
      });
    }
  }

  if (doctorId !== undefined && (typeof doctorId !== 'string' || !doctorId.trim())) {
    details.push({
      field: 'doctorId',
      message: 'doctorId must be a non-empty string',
    });
  }

  if (patientId !== undefined && (typeof patientId !== 'string' || !patientId.trim())) {
    details.push({
      field: 'patientId',
      message: 'patientId must be a non-empty string',
    });
  }

  if (details.length > 0) {
    return sendValidationError(res, details, APPOINTMENT_ERROR_CODES.VALIDATION_ERROR, 'Dữ liệu không hợp lệ');
  }

  return next();
}

function validateUpdateStatus(req, res, next) {
  const parsedResult = updateStatusSchema.safeParse(req.body || {});

  if (!parsedResult.success) {
    const details = parsedResult.error.issues.map((issue) => ({
      field: issue.path.length > 0 ? issue.path.join('.') : 'body',
      message: issue.message,
    }));

    return sendValidationError(res, details, APPOINTMENT_ERROR_CODES.VALIDATION_ERROR, 'Dữ liệu không hợp lệ');
  }

  req.body = parsedResult.data;
  return next();
}

module.exports = {
  validateCreateAppointment,
  validateCreateReceptionistAppointment,
  validateListAppointments,
  validateUpdateStatus,
};
