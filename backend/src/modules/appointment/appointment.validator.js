const { z } = require('zod');
const {
  APPOINTMENT_ERROR_CODES,
  APPOINTMENT_PAGINATION,
  VALID_APPOINTMENT_STATUSES,
} = require('./appointment.types');

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
    .refine((val) => isValidUuid(val), { message: 'timeSlotId must be a valid UUID' }),
  forSelf: z.boolean(),
  patientProfileId: z.string()
    .trim()
    .refine((val) => isValidUuid(val), { message: 'patientProfileId must be a valid UUID' })
    .optional(),
  reason: z.string()
    .trim()
    .max(500, 'reason must be at most 500 characters')
    .optional(),
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
  patientId: z.string()
    .trim()
    .refine((val) => isValidUuid(val), { message: 'patientId must be a valid UUID' }),
  timeSlotId: z.string()
    .trim()
    .refine((val) => isValidUuid(val), { message: 'timeSlotId must be a valid UUID' }),
  forSelf: z.boolean(),
  patientProfileId: z.string()
    .trim()
    .refine((val) => isValidUuid(val), { message: 'patientProfileId must be a valid UUID' })
    .optional(),
  reason: z.string()
    .trim()
    .max(500, 'reason must be at most 500 characters')
    .optional(),
  note: z.string()
    .trim()
    .max(500, 'note must be at most 500 characters')
    .optional(),
}).strict().refine((data) => {
  if (data.forSelf === false && !data.patientProfileId) {
    return false;
  }
  return true;
}, {
  message: 'patientProfileId is required when forSelf is false',
  path: ['patientProfileId'],
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
  const { page, limit, status, date, doctorId, patientId } = req.query;
  const details = [];

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

  if (doctorId !== undefined && !isValidUuid(doctorId.trim())) {
    details.push({
      field: 'doctorId',
      message: 'doctorId must be a valid UUID',
    });
  }

  if (patientId !== undefined && !isValidUuid(patientId.trim())) {
    details.push({
      field: 'patientId',
      message: 'patientId must be a valid UUID',
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
