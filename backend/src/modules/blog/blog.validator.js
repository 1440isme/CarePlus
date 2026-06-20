const { z } = require('zod');
const { BLOG_ERROR_CODES, BLOG_PAGINATION } = require('./blog.types');

const blogSlugSchema = z.string()
  .trim()
  .min(1, 'Slug must not be empty')
  .max(150, 'Slug must be at most 150 characters')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens');

function sendValidationError(res, details, code = BLOG_ERROR_CODES.VALIDATION_ERROR, message = 'Dữ liệu không hợp lệ') {
  return res.status(400).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}

function mapIssues(issues) {
  return issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : 'body',
    message: issue.message,
  }));
}

const listBlogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(BLOG_PAGINATION.MAX_LIMIT).optional(),
  search: z.string().trim().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  tag: z.string().trim().optional(),
}).strict();

const blogSlugParamsSchema = z.object({
  slug: blogSlugSchema,
}).strict();

const blogIdParamsSchema = z.object({
  id: z.string().uuid('ID must be a valid UUID'),
}).strict();

const createBlogSchema = z.object({
  title: z.string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title must be at most 255 characters'),
  slug: blogSlugSchema.optional(),
  content: z.string()
    .trim()
    .min(10, 'Content must be at least 10 characters'),
  summary: z.string()
    .trim()
    .max(500, 'Summary must be at most 500 characters')
    .optional(),
  thumbnail: z.string()
    .trim()
    .url('Thumbnail must be a valid URL')
    .or(z.string().length(0))
    .optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  tags: z.string()
    .trim()
    .optional(),
}).strict();

const updateBlogSchema = z.object({
  title: z.string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title must be at most 255 characters')
    .optional(),
  slug: blogSlugSchema.optional(),
  content: z.string()
    .trim()
    .min(10, 'Content must be at least 10 characters')
    .optional(),
  summary: z.string()
    .trim()
    .max(500, 'Summary must be at most 500 characters')
    .optional(),
  thumbnail: z.string()
    .trim()
    .url('Thumbnail must be a valid URL')
    .or(z.string().length(0))
    .optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  tags: z.string()
    .trim()
    .optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one field is required to update',
  }
);

function validateListBlogs(req, res, next) {
  const parsedResult = listBlogsQuerySchema.safeParse(req.query || {});
  if (!parsedResult.success) {
    return sendValidationError(res, mapIssues(parsedResult.error.issues));
  }
  req.query = parsedResult.data;
  return next();
}

function validateBlogSlug(req, res, next) {
  const parsedResult = blogSlugParamsSchema.safeParse(req.params || {});
  if (!parsedResult.success) {
    return sendValidationError(res, mapIssues(parsedResult.error.issues));
  }
  req.params = parsedResult.data;
  return next();
}

function validateBlogId(req, res, next) {
  const parsedResult = blogIdParamsSchema.safeParse(req.params || {});
  if (!parsedResult.success) {
    return sendValidationError(res, mapIssues(parsedResult.error.issues));
  }
  req.params = parsedResult.data;
  return next();
}

function validateCreateBlog(req, res, next) {
  const parsedResult = createBlogSchema.safeParse(req.body || {});
  if (!parsedResult.success) {
    return sendValidationError(res, mapIssues(parsedResult.error.issues));
  }
  req.body = parsedResult.data;
  return next();
}

function validateUpdateBlog(req, res, next) {
  const parsedResult = updateBlogSchema.safeParse(req.body || {});
  if (!parsedResult.success) {
    return sendValidationError(res, mapIssues(parsedResult.error.issues));
  }
  req.body = parsedResult.data;
  return next();
}

module.exports = {
  validateListBlogs,
  validateBlogSlug,
  validateBlogId,
  validateCreateBlog,
  validateUpdateBlog,
};
