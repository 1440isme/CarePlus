const { z } = require('zod');
const { AUTH_ERROR_CODES, AUTH_OTP_CONFIG } = require('./auth.types');

function sendValidationError(
  res,
  details,
  code = AUTH_ERROR_CODES.VALIDATION_ERROR,
  message = 'Dữ liệu không hợp lệ',
) {
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

function formatZodIssues(error) {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : 'body',
    message: issue.message,
  }));
}

function createValidationMiddleware(schema, options = {}) {
  const {
    errorCode = AUTH_ERROR_CODES.VALIDATION_ERROR,
    errorMessage = 'Dữ liệu không hợp lệ',
  } = options;

  return (req, res, next) => {
    const parsedResult = schema.safeParse(req.body || {});

    if (!parsedResult.success) {
      return sendValidationError(
        res,
        formatZodIssues(parsedResult.error),
        errorCode,
        errorMessage,
      );
    }

    req.body = parsedResult.data;
    return next();
  };
}

const nameSchema = z.string()
  .trim()
  .min(1, 'name must not be empty')
  .max(100, 'name must be at most 100 characters');

const emailSchema = z.string()
  .trim()
  .min(1, 'email is required')
  .max(255, 'email must be at most 255 characters')
  .email('email must be a valid email address')
  .transform((value) => value.toLowerCase());

const passwordSchema = z.string()
  .min(6, 'password must be at least 6 characters');

const phoneSchema = z.string()
  .trim()
  .refine((value) => isValidVietnamPhone(value), {
    message: 'phone must be a valid Vietnamese phone number',
  });

const otpSchema = z.string()
  .trim()
  .length(
    AUTH_OTP_CONFIG.OTP_LENGTH,
    `otp must be exactly ${AUTH_OTP_CONFIG.OTP_LENGTH} digits`,
  )
  .regex(/^\d+$/, 'otp must contain only digits');

const tokenSchema = z.string()
  .trim()
  .min(1, 'token must not be empty');

const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
}).strict();

const verifyEmailSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
}).strict();

const resendOtpSchema = z.object({
  email: emailSchema,
}).strict();

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'password must not be empty'),
  rememberMe: z.boolean().optional(),
}).strict();

const forgotPasswordSchema = z.object({
  email: emailSchema,
}).strict();

const resetPasswordSchema = z.object({
  email: emailSchema,
  token: tokenSchema,
  newPassword: z.string().min(6, 'newPassword must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'confirmPassword is required').optional(),
}).strict().superRefine((data, ctx) => {
  if (typeof data.confirmPassword === 'string' && data.newPassword !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmPassword'],
      message: 'confirmPassword must match newPassword',
    });
  }
});

const refreshTokenSchema = z.object({}).strict();
const logoutSchema = z.object({}).strict();

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendOtpSchema,
  resendVerificationOtpSchema: resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  logoutSchema,
  validateRegister: createValidationMiddleware(registerSchema),
  validateLogin: createValidationMiddleware(loginSchema),
  validateRefresh: createValidationMiddleware(refreshTokenSchema),
  validateLogout: createValidationMiddleware(logoutSchema),
  validateVerifyEmail: createValidationMiddleware(verifyEmailSchema),
  validateResendVerificationOtp: createValidationMiddleware(resendOtpSchema),
  validateForgotPassword: createValidationMiddleware(forgotPasswordSchema),
  validateResetPassword: createValidationMiddleware(resetPasswordSchema),
};
