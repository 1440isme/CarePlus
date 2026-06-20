const { z } = require('zod');
const { DOCTOR_ERROR_CODES, DOCTOR_PAGINATION } = require('./doctor.types');

function sendValidationError(res, details, code = DOCTOR_ERROR_CODES.VALIDATION_ERROR) {
  return res.status(400).json({
    success: false,
    error: {
      code,
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

function isValidVietnamPhone(phone) {
  return /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(phone);
}

function normalizeBoolean(value) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === 'true') {
      return true;
    }

    if (normalizedValue === 'false') {
      return false;
    }
  }

  return value;
}

const doctorIdSchema = z.object({
  id: z.string().trim().min(1, 'id is required'),
});

const listDoctorsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DOCTOR_PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(DOCTOR_PAGINATION.MAX_LIMIT).default(DOCTOR_PAGINATION.DEFAULT_LIMIT),
  specialtyId: z.string().trim().min(1).optional(),
  active: z.preprocess(normalizeBoolean, z.boolean().optional()),
  search: z.string().trim().max(100).optional(),
}).strict();

const updateMyDoctorProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().refine((value) => isValidVietnamPhone(value), {
    message: 'phone must be a valid Vietnamese phone number',
  }).optional(),
  title: z.string().trim().min(1).max(100).optional(),
  experience: z.coerce.number().int().min(0).max(80).optional(),
  description: z.string().trim().min(1).max(5000).optional(),
  position: z.string().trim().min(1).max(150).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required',
});

const updateDoctorPriceSchema = z.object({
  price: z.coerce.number().min(0, 'price must be greater than or equal to 0'),
}).strict();

const updateDoctorByAdminSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  title: z.string().trim().min(1).max(100).optional(),
  experience: z.coerce.number().int().min(0).max(80).optional(),
  description: z.string().trim().min(1).max(5000).optional(),
  position: z.string().trim().min(1).max(150).optional(),
  active: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required',
});

function validateDoctorIdParam(req, res, next) {
  const parsed = doctorIdSchema.safeParse(req.params || {});

  if (!parsed.success) {
    return sendValidationError(res, buildIssueDetails(parsed.error));
  }

  req.params = parsed.data;
  return next();
}

function validateListDoctors(req, res, next) {
  const parsed = listDoctorsQuerySchema.safeParse(req.query || {});

  if (!parsed.success) {
    return sendValidationError(res, buildIssueDetails(parsed.error));
  }

  req.query = parsed.data;
  return next();
}

function validateUpdateMyDoctorProfile(req, res, next) {
  const parsed = updateMyDoctorProfileSchema.safeParse(req.body || {});

  if (!parsed.success) {
    return sendValidationError(res, buildIssueDetails(parsed.error));
  }

  req.body = parsed.data;
  return next();
}

function validateUpdateDoctorPrice(req, res, next) {
  const paramsParsed = doctorIdSchema.safeParse(req.params || {});
  const bodyParsed = updateDoctorPriceSchema.safeParse(req.body || {});

  if (!paramsParsed.success || !bodyParsed.success) {
    const details = [
      ...(paramsParsed.success ? [] : buildIssueDetails(paramsParsed.error)),
      ...(bodyParsed.success ? [] : buildIssueDetails(bodyParsed.error)),
    ];
    return sendValidationError(res, details);
  }

  req.params = paramsParsed.data;
  req.body = bodyParsed.data;
  return next();
}

function validateUpdateDoctorByAdmin(req, res, next) {
  const paramsParsed = doctorIdSchema.safeParse(req.params || {});
  const bodyParsed = updateDoctorByAdminSchema.safeParse(req.body || {});

  if (!paramsParsed.success || !bodyParsed.success) {
    const details = [
      ...(paramsParsed.success ? [] : buildIssueDetails(paramsParsed.error)),
      ...(bodyParsed.success ? [] : buildIssueDetails(bodyParsed.error)),
    ];
    return sendValidationError(res, details);
  }

  req.params = paramsParsed.data;
  req.body = bodyParsed.data;
  return next();
}

module.exports = {
  validateDoctorIdParam,
  validateListDoctors,
  validateUpdateMyDoctorProfile,
  validateUpdateDoctorPrice,
  validateUpdateDoctorByAdmin,
};
