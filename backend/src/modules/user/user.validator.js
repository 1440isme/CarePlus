const { z } = require('zod');
const { VALID_USER_ROLES } = require('../../shared/constants/roles');
const {
  USER_ERROR_CODES,
  USER_PAGINATION,
  VALID_USER_STATUSES,
  STAFF_CREATABLE_ROLES,
} = require('./user.types');

function sendValidationError(res, details, code = USER_ERROR_CODES.VALIDATION_ERROR, message = 'Validation failed') {
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

function isValidDateOfBirth(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return false;
  }

  const ddmmyyyyMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmedValue);

  if (ddmmyyyyMatch) {
    const day = Number.parseInt(ddmmyyyyMatch[1], 10);
    const month = Number.parseInt(ddmmyyyyMatch[2], 10);
    const year = Number.parseInt(ddmmyyyyMatch[3], 10);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    return parsedDate.getUTCFullYear() === year
      && parsedDate.getUTCMonth() === month - 1
      && parsedDate.getUTCDate() === day
      && parsedDate.getTime() <= Date.now();
  }
  return false;
}

function isValidDateOnly(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return false;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedValue);

  if (!match) {
    return false;
  }

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  return parsedDate.getUTCFullYear() === year
    && parsedDate.getUTCMonth() === month - 1
    && parsedDate.getUTCDate() === day;
}

const updateMeSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'name must not be empty')
    .max(100, 'name must be at most 100 characters')
    .optional(),
  phone: z.string()
    .trim()
    .refine((value) => isValidVietnamPhone(value), {
      message: 'phone must be a valid Vietnamese phone number',
    })
    .optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'])
    .optional(),
  dateOfBirth: z.string()
    .trim()
    .refine((value) => isValidDateOfBirth(value), {
      message: 'dateOfBirth must be a valid date in DD/MM/YYYY format',
    })
    .optional(),
  address: z.string()
    .trim()
    .min(1, 'address must not be empty')
    .max(255, 'address must be at most 255 characters')
    .optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one allowed field is required',
  },
);

const changeMyPasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'currentPassword is required'),
  newPassword: z.string()
    .min(6, 'newPassword must be at least 6 characters'),
  confirmPassword: z.string()
    .min(1, 'confirmPassword is required'),
}).strict().refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'confirmPassword must match newPassword',
    path: ['confirmPassword'],
  },
);

const createStaffUserSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'name must not be empty')
    .max(100, 'name must be at most 100 characters'),
  email: z.string()
    .trim()
    .email('email must be a valid email address')
    .transform((value) => value.toLowerCase()),
  phone: z.string()
    .trim()
    .refine((value) => isValidVietnamPhone(value), {
      message: 'phone must be a valid Vietnamese phone number',
    }),
  password: z.string()
    .min(6, 'password must be at least 6 characters'),
  role: z.string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine((value) => STAFF_CREATABLE_ROLES.includes(value), {
      message: 'role must be one of DOCTOR, RECEPTIONIST, ADMIN',
    }),
  status: z.enum(VALID_USER_STATUSES).optional(),
  doctorName: z.string().trim().min(1).max(100).optional(),
  specialtyId: z.string().trim().min(1).optional(),
  academicTitle: z.string().trim().min(1).max(100).optional(),
  yearsOfExperience: z.coerce.number().int().min(0).max(80).optional(),
  consultationFee: z.coerce.number().min(0).optional(),
  avatarUrl: z.string().trim().url().optional().or(z.literal('')),
}).strict().superRefine((value, ctx) => {
  if (value.role !== 'DOCTOR') {
    return;
  }

  if (!value.doctorName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['doctorName'],
      message: 'doctorName is required when role is DOCTOR',
    });
  }

  if (!value.specialtyId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['specialtyId'],
      message: 'specialtyId is required when role is DOCTOR',
    });
  }

  if (!value.academicTitle) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['academicTitle'],
      message: 'academicTitle is required when role is DOCTOR',
    });
  }
});

function validateListUsers(req, res, next) {
  const details = [];
  const page = req.query.page;
  const limit = req.query.limit;
  const role = typeof req.query.role === 'string' ? req.query.role.trim() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const createdFrom = typeof req.query.createdFrom === 'string' ? req.query.createdFrom.trim() : '';
  const createdTo = typeof req.query.createdTo === 'string' ? req.query.createdTo.trim() : '';

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
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > USER_PAGINATION.MAX_LIMIT) {
      details.push({
        field: 'limit',
        message: `limit must be an integer between 1 and ${USER_PAGINATION.MAX_LIMIT}`,
      });
    }
  }

  if (role && !VALID_USER_ROLES.includes(role)) {
    details.push({
      field: 'role',
      message: 'role must be one of PATIENT, DOCTOR, RECEPTIONIST, ADMIN',
    });
  }

  if (status && !VALID_USER_STATUSES.includes(status)) {
    details.push({
      field: 'status',
      message: 'status must be one of ACTIVE, LOCKED',
    });
  }

  if (createdFrom && !isValidDateOnly(createdFrom)) {
    details.push({
      field: 'createdFrom',
      message: 'createdFrom must be a valid date in YYYY-MM-DD format',
    });
  }

  if (createdTo && !isValidDateOnly(createdTo)) {
    details.push({
      field: 'createdTo',
      message: 'createdTo must be a valid date in YYYY-MM-DD format',
    });
  }

  if (createdFrom && createdTo && isValidDateOnly(createdFrom) && isValidDateOnly(createdTo) && createdFrom > createdTo) {
    details.push({
      field: 'createdTo',
      message: 'createdTo must be greater than or equal to createdFrom',
    });
  }

  if (details.length > 0) {
    return sendValidationError(res, details, USER_ERROR_CODES.VALIDATION_ERROR, 'Dữ liệu không hợp lệ');
  }

  return next();
}

function validateUpdateMe(req, res, next) {
  const parsedResult = updateMeSchema.safeParse(req.body || {});

  if (!parsedResult.success) {
    const details = parsedResult.error.issues.map((issue) => ({
      field: issue.path.length > 0 ? issue.path.join('.') : 'body',
      message: issue.message,
    }));

    return sendValidationError(res, details, USER_ERROR_CODES.VALIDATION_ERROR, 'Dữ liệu không hợp lệ');
  }

  req.body = parsedResult.data;

  return next();
}

function validateAdminUpdateUser(req, res, next) {
  const parsedResult = updateMeSchema.safeParse(req.body || {});

  if (!parsedResult.success) {
    const details = parsedResult.error.issues.map((issue) => ({
      field: issue.path.length > 0 ? issue.path.join('.') : 'body',
      message: issue.message,
    }));

    return sendValidationError(res, details, USER_ERROR_CODES.VALIDATION_ERROR, 'Dữ liệu không hợp lệ');
  }

  req.body = parsedResult.data;

  return next();
}

function validateChangeMyPassword(req, res, next) {
  const parsedResult = changeMyPasswordSchema.safeParse(req.body || {});

  if (!parsedResult.success) {
    const details = parsedResult.error.issues.map((issue) => ({
      field: issue.path.length > 0 ? issue.path.join('.') : 'body',
      message: issue.message,
    }));

    return sendValidationError(res, details, USER_ERROR_CODES.VALIDATION_ERROR, 'Dữ liệu không hợp lệ');
  }

  req.body = parsedResult.data;

  return next();
}

function validateCreateStaffUser(req, res, next) {
  const parsedResult = createStaffUserSchema.safeParse(req.body || {});

  if (!parsedResult.success) {
    const details = parsedResult.error.issues.map((issue) => ({
      field: issue.path.length > 0 ? issue.path.join('.') : 'body',
      message: issue.message,
    }));

    return sendValidationError(res, details, USER_ERROR_CODES.VALIDATION_ERROR, 'Dữ liệu không hợp lệ');
  }

  req.body = parsedResult.data;

  return next();
}

function validateUpdateUserStatus(req, res, next) {
  const details = [];
  const userId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  const status = typeof req.body?.status === 'string' ? req.body.status.trim() : '';

  if (!userId) {
    details.push({
      field: 'id',
      message: 'id is required',
    });
  }

  if (!status) {
    details.push({
      field: 'status',
      message: 'status is required',
    });
  } else if (!VALID_USER_STATUSES.includes(status)) {
    details.push({
      field: 'status',
      message: 'status must be one of ACTIVE, LOCKED',
    });
  }

  if (details.length > 0) {
    return sendValidationError(res, details, USER_ERROR_CODES.VALIDATION_ERROR, 'Dữ liệu không hợp lệ');
  }

  return next();
}

function validateGetUserDetail(req, res, next) {
  const details = [];
  const userId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';

  if (!userId) {
    details.push({
      field: 'id',
      message: 'id is required',
    });
  }

  if (details.length > 0) {
    return sendValidationError(res, details, USER_ERROR_CODES.VALIDATION_ERROR, 'Dữ liệu không hợp lệ');
  }

  return next();
}

function validateResetNoShowCount(req, res, next) {
  const details = [];
  const userId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';

  if (!userId) {
    details.push({
      field: 'id',
      message: 'id is required',
    });
  }

  if (details.length > 0) {
    return sendValidationError(res, details, USER_ERROR_CODES.VALIDATION_ERROR, 'Dữ liệu không hợp lệ');
  }

  return next();
}

module.exports = {
  validateListUsers,
  validateUpdateMe,
  validateChangeMyPassword,
  validateAdminUpdateUser,
  validateCreateStaffUser,
  validateGetUserDetail,
  validateUpdateUserStatus,
  validateResetNoShowCount,
};
