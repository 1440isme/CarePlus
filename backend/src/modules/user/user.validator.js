const { z } = require('zod');
const { VALID_USER_ROLES } = require('../../shared/constants/roles');
const { USER_ERROR_CODES, USER_PAGINATION, VALID_USER_STATUSES } = require('./user.types');

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
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one allowed field is required',
  },
);

function validateListUsers(req, res, next) {
  const details = [];
  const page = req.query.page;
  const limit = req.query.limit;
  const role = typeof req.query.role === 'string' ? req.query.role.trim() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';

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
  validateUpdateUserStatus,
  validateResetNoShowCount,
};
