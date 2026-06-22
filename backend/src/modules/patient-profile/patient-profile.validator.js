const { z } = require('zod');
const {
  PATIENT_PROFILE_ERROR_CODES,
  PATIENT_PROFILE_PAGINATION,
  VALID_PATIENT_PROFILE_GENDERS,
  VALID_PATIENT_PROFILE_RELATIONSHIPS,
} = require('./patient-profile.types');

function sendValidationError(res, details, code = PATIENT_PROFILE_ERROR_CODES.VALIDATION_ERROR, message = 'Validation failed') {
  return res.status(400).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}

function isValidVietnamPhone(phone) {
  return /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(phone);
}

function isValidDateString(value) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function isNotFutureDate(value) {
  const inputDate = new Date(value);
  const today = new Date();

  inputDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return inputDate.getTime() <= today.getTime();
}

const createPatientProfileSchema = z.object({
  fullName: z.string()
    .trim()
    .min(1, 'fullName must not be empty')
    .max(100, 'fullName must be at most 100 characters'),
  phone: z.string()
    .trim()
    .refine((value) => isValidVietnamPhone(value), {
      message: 'phone must be a valid Vietnamese phone number',
    }),
  email: z.string()
    .trim()
    .email('email must be a valid email')
    .optional(),
  gender: z.string()
    .trim()
    .refine((value) => VALID_PATIENT_PROFILE_GENDERS.includes(value), {
      message: `gender must be one of ${VALID_PATIENT_PROFILE_GENDERS.join(', ')}`,
    }),
  dateOfBirth: z.string()
    .trim()
    .refine((value) => isValidDateString(value), {
      message: 'dateOfBirth must be a valid date',
    })
    .refine((value) => isNotFutureDate(value), {
      message: 'dateOfBirth must not be in the future',
    }),
  address: z.string()
    .trim()
    .max(500, 'address must be at most 500 characters')
    .optional(),
  relationship: z.string()
    .trim()
    .refine((value) => VALID_PATIENT_PROFILE_RELATIONSHIPS.includes(value), {
      message: `relationship must be one of ${VALID_PATIENT_PROFILE_RELATIONSHIPS.join(', ')}`,
    }),
}).strict();

const updatePatientProfileSchema = z.object({
  fullName: z.string()
    .trim()
    .min(1, 'fullName must not be empty')
    .max(100, 'fullName must be at most 100 characters')
    .optional(),
  phone: z.string()
    .trim()
    .refine((value) => isValidVietnamPhone(value), {
      message: 'phone must be a valid Vietnamese phone number',
    })
    .optional(),
  email: z.union([
    z.string().trim().email('email must be a valid email'),
    z.null(),
  ]).optional(),
  gender: z.string()
    .trim()
    .refine((value) => VALID_PATIENT_PROFILE_GENDERS.includes(value), {
      message: `gender must be one of ${VALID_PATIENT_PROFILE_GENDERS.join(', ')}`,
    })
    .optional(),
  dateOfBirth: z.string()
    .trim()
    .refine((value) => isValidDateString(value), {
      message: 'dateOfBirth must be a valid date',
    })
    .refine((value) => isNotFutureDate(value), {
      message: 'dateOfBirth must not be in the future',
    })
    .optional(),
  address: z.union([
    z.string().trim().max(500, 'address must be at most 500 characters'),
    z.null(),
  ]).optional(),
  relationship: z.string()
    .trim()
    .refine((value) => VALID_PATIENT_PROFILE_RELATIONSHIPS.includes(value), {
      message: `relationship must be one of ${VALID_PATIENT_PROFILE_RELATIONSHIPS.join(', ')}`,
    })
    .optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one allowed field is required',
  },
);

const updatePatientProfileParamsSchema = z.object({
  id: z.string()
    .trim()
    .min(1, 'id is required'),
}).strict();

const deletePatientProfileParamsSchema = updatePatientProfileParamsSchema;
const setDefaultPatientProfileParamsSchema = updatePatientProfileParamsSchema;

function validateListPatientProfiles(req, res, next) {
  const details = [];
  const page = req.query.page;
  const limit = req.query.limit;

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
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > PATIENT_PROFILE_PAGINATION.MAX_LIMIT) {
      details.push({
        field: 'limit',
        message: `limit must be an integer between 1 and ${PATIENT_PROFILE_PAGINATION.MAX_LIMIT}`,
      });
    }
  }

  if (details.length > 0) {
    return sendValidationError(res, details, PATIENT_PROFILE_ERROR_CODES.VALIDATION_ERROR, 'Dữ liệu không hợp lệ');
  }

  return next();
}

function validateCreatePatientProfile(req, res, next) {
  const parsedResult = createPatientProfileSchema.safeParse(req.body || {});

  if (!parsedResult.success) {
    const details = parsedResult.error.issues.map((issue) => ({
      field: issue.path.length > 0 ? issue.path.join('.') : 'body',
      message: issue.message,
    }));

    return sendValidationError(res, details, PATIENT_PROFILE_ERROR_CODES.VALIDATION_ERROR, 'Dữ liệu không hợp lệ');
  }

  req.body = parsedResult.data;

  return next();
}

function validatePatientProfileId(req, res, next) {
  const parsedResult = deletePatientProfileParamsSchema.safeParse(req.params || {});

  if (!parsedResult.success) {
    const details = parsedResult.error.issues.map((issue) => ({
      field: issue.path.length > 0 ? issue.path.join('.') : 'params',
      message: issue.message,
    }));

    return sendValidationError(res, details, PATIENT_PROFILE_ERROR_CODES.VALIDATION_ERROR, 'Dữ liệu không hợp lệ');
  }

  req.params = parsedResult.data;

  return next();
}

function validateUpdatePatientProfile(req, res, next) {
  const parsedResult = updatePatientProfileSchema.safeParse(req.body || {});

  if (!parsedResult.success) {
    const details = parsedResult.error.issues.map((issue) => ({
      field: issue.path.length > 0 ? issue.path.join('.') : 'body',
      message: issue.message,
    }));

    return sendValidationError(res, details, PATIENT_PROFILE_ERROR_CODES.VALIDATION_ERROR, 'Dữ liệu không hợp lệ');
  }

  req.body = parsedResult.data;

  return next();
}

module.exports = {
  validateListPatientProfiles,
  validateCreatePatientProfile,
  validatePatientProfileId,
  validateUpdatePatientProfile,
  updatePatientProfileParamsSchema,
  deletePatientProfileParamsSchema,
  setDefaultPatientProfileParamsSchema,
};
