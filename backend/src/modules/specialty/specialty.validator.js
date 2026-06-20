const { z } = require('zod');
const {
  SPECIALTY_ERROR_CODES,
  SPECIALTY_PAGINATION,
} = require('./specialty.types');

const specialtySlugSchema = z.string()
  .trim()
  .min(1, 'slug must not be empty')
  .max(150, 'slug must be at most 150 characters')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must contain only lowercase letters, numbers, and hyphens');

function sendValidationError(res, details, code = SPECIALTY_ERROR_CODES.VALIDATION_ERROR, message = 'Validation failed') {
  return res.status(400).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}

const listSpecialtiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(SPECIALTY_PAGINATION.MAX_LIMIT).optional(),
  search: z.string().trim().optional(),
}).strict();

const specialtyIdParamsSchema = z.object({
  id: z.string().trim().min(1, 'id is required'),
}).strict();

const createSpecialtySchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'name must not be empty')
    .max(100, 'name must be at most 100 characters'),
  slug: specialtySlugSchema.optional(),
  description: z.string()
    .trim()
    .min(1, 'description must not be empty')
    .max(5000, 'description must be at most 5000 characters')
    .optional(),
  icon: z.string()
    .trim()
    .min(1, 'icon must not be empty')
    .max(1000, 'icon must be at most 1000 characters')
    .optional(),
  active: z.boolean().optional(),
}).strict();

const updateSpecialtySchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'name must not be empty')
    .max(100, 'name must be at most 100 characters')
    .optional(),
  slug: specialtySlugSchema.optional(),
  description: z.string()
    .trim()
    .min(1, 'description must not be empty')
    .max(5000, 'description must be at most 5000 characters')
    .optional(),
  icon: z.string()
    .trim()
    .min(1, 'icon must not be empty')
    .max(1000, 'icon must be at most 1000 characters')
    .optional(),
  active: z.boolean().optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one allowed field is required',
  },
);

function mapIssues(issues) {
  return issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : 'body',
    message: issue.message,
  }));
}

function validateListSpecialties(req, res, next) {
  const parsedResult = listSpecialtiesQuerySchema.safeParse(req.query || {});

  if (!parsedResult.success) {
    return sendValidationError(res, mapIssues(parsedResult.error.issues), SPECIALTY_ERROR_CODES.VALIDATION_ERROR, 'Dữ liệu không hợp lệ');
  }

  req.query = parsedResult.data;
  return next();
}

function validateSpecialtyId(req, res, next) {
  const parsedResult = specialtyIdParamsSchema.safeParse(req.params || {});

  if (!parsedResult.success) {
    return sendValidationError(res, mapIssues(parsedResult.error.issues), SPECIALTY_ERROR_CODES.VALIDATION_ERROR, 'Dữ liệu không hợp lệ');
  }

  req.params = parsedResult.data;
  return next();
}

function validateCreateSpecialty(req, res, next) {
  const parsedResult = createSpecialtySchema.safeParse(req.body || {});

  if (!parsedResult.success) {
    return sendValidationError(res, mapIssues(parsedResult.error.issues), SPECIALTY_ERROR_CODES.VALIDATION_ERROR, 'Dữ liệu không hợp lệ');
  }

  req.body = parsedResult.data;
  return next();
}

function validateUpdateSpecialty(req, res, next) {
  const parsedResult = updateSpecialtySchema.safeParse(req.body || {});

  if (!parsedResult.success) {
    return sendValidationError(res, mapIssues(parsedResult.error.issues), SPECIALTY_ERROR_CODES.VALIDATION_ERROR, 'Dữ liệu không hợp lệ');
  }

  req.body = parsedResult.data;
  return next();
}

module.exports = {
  listSpecialtiesQuerySchema,
  specialtyIdParamsSchema,
  createSpecialtySchema,
  updateSpecialtySchema,
  validateListSpecialties,
  validateSpecialtyId,
  validateCreateSpecialty,
  validateUpdateSpecialty,
};
