const { AUTH_ERROR_CODES } = require('./auth.types');

const registerSchema = {
  requiredFields: ['name', 'email', 'phone', 'password'],
};

const loginSchema = {
  requiredFields: ['email', 'password'],
};

const refreshSchema = {
  requiredFields: [],
};

const logoutSchema = {
  requiredFields: [],
};

const verifyEmailSchema = {
  requiredFields: ['email', 'otp'],
};

const resendVerificationOtpSchema = {
  requiredFields: ['email'],
};

const forgotPasswordSchema = {
  requiredFields: ['email'],
};

const resetPasswordSchema = {
  requiredFields: ['email', 'token', 'newPassword'],
};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidVietnamPhone(phone) {
  return /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(phone);
}

function isValidOtp(otp) {
  return /^\d{6}$/.test(otp);
}

function buildValidationMiddleware(schema) {
  return (req, res, next) => {
    const details = getRequiredFieldErrors(schema, req.body);

    if (details.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: AUTH_ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          details,
        },
      });
    }

    return next();
  };
}

function validateRegister(req, res, next) {
  const requiredFieldDetails = getRequiredFieldErrors(registerSchema, req.body);
  if (requiredFieldDetails.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: AUTH_ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details: requiredFieldDetails,
      },
    });
  }

  const details = [];
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!name) {
    details.push({
      field: 'name',
      message: 'name must not be empty',
    });
  }

  if (!isValidEmail(email)) {
    details.push({
      field: 'email',
      message: 'email must be a valid email address',
    });
  }

  if (!isValidVietnamPhone(phone)) {
    details.push({
      field: 'phone',
      message: 'phone must be a valid Vietnamese phone number',
    });
  }

  if (password.length < 6) {
    details.push({
      field: 'password',
      message: 'password must be at least 6 characters',
    });
  }

  if (details.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: AUTH_ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details,
      },
    });
  }

  return next();
}

function validateVerifyEmail(req, res, next) {
  const requiredFieldDetails = getRequiredFieldErrors(verifyEmailSchema, req.body);
  if (requiredFieldDetails.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: AUTH_ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details: requiredFieldDetails,
      },
    });
  }

  const details = [];
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const otp = typeof req.body.otp === 'string' ? req.body.otp.trim() : '';

  if (!isValidEmail(email)) {
    details.push({
      field: 'email',
      message: 'email must be a valid email address',
    });
  }

  if (!isValidOtp(otp)) {
    details.push({
      field: 'otp',
      message: 'otp must be a 6-digit string',
    });
  }

  if (details.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: AUTH_ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details,
      },
    });
  }

  return next();
}

function validateResendVerificationOtp(req, res, next) {
  const requiredFieldDetails = getRequiredFieldErrors(resendVerificationOtpSchema, req.body);
  if (requiredFieldDetails.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: AUTH_ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details: requiredFieldDetails,
      },
    });
  }

  const details = [];
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

  if (!isValidEmail(email)) {
    details.push({
      field: 'email',
      message: 'email must be a valid email address',
    });
  }

  if (details.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: AUTH_ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details,
      },
    });
  }

  return next();
}

function validateLogin(req, res, next) {
  const requiredFieldDetails = getRequiredFieldErrors(loginSchema, req.body);
  if (requiredFieldDetails.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: AUTH_ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details: requiredFieldDetails,
      },
    });
  }

  const details = [];
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!isValidEmail(email)) {
    details.push({
      field: 'email',
      message: 'email must be a valid email address',
    });
  }

  if (!password.trim()) {
    details.push({
      field: 'password',
      message: 'password must not be empty',
    });
  }

  if (details.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: AUTH_ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details,
      },
    });
  }

  return next();
}

function validateForgotPassword(req, res, next) {
  const requiredFieldDetails = getRequiredFieldErrors(forgotPasswordSchema, req.body);
  if (requiredFieldDetails.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: AUTH_ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details: requiredFieldDetails,
      },
    });
  }

  const details = [];
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

  if (!isValidEmail(email)) {
    details.push({
      field: 'email',
      message: 'email must be a valid email address',
    });
  }

  if (details.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: AUTH_ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details,
      },
    });
  }

  return next();
}

function validateResetPassword(req, res, next) {
  const requiredFieldDetails = getRequiredFieldErrors(resetPasswordSchema, req.body);
  if (requiredFieldDetails.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: AUTH_ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details: requiredFieldDetails,
      },
    });
  }

  const details = [];
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const token = typeof req.body.token === 'string' ? req.body.token.trim() : '';
  const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
  const hasConfirmPassword = Object.prototype.hasOwnProperty.call(req.body || {}, 'confirmPassword');
  const confirmPassword = typeof req.body.confirmPassword === 'string'
    ? req.body.confirmPassword
    : '';

  if (!isValidEmail(email)) {
    details.push({
      field: 'email',
      message: 'email must be a valid email address',
    });
  }

  if (!token) {
    details.push({
      field: 'token',
      message: 'token must not be empty',
    });
  }

  if (newPassword.length < 6) {
    details.push({
      field: 'newPassword',
      message: 'newPassword must be at least 6 characters',
    });
  }

  if (hasConfirmPassword && newPassword !== confirmPassword) {
    details.push({
      field: 'confirmPassword',
      message: 'confirmPassword must match newPassword',
      code: AUTH_ERROR_CODES.PASSWORD_CONFIRMATION_NOT_MATCH,
    });
  }

  if (details.length > 0) {
    const hasPasswordConfirmationMismatch = details.some(
      (detail) => detail.code === AUTH_ERROR_CODES.PASSWORD_CONFIRMATION_NOT_MATCH,
    );

    return res.status(400).json({
      success: false,
      error: {
        code: hasPasswordConfirmationMismatch
          ? AUTH_ERROR_CODES.PASSWORD_CONFIRMATION_NOT_MATCH
          : AUTH_ERROR_CODES.VALIDATION_ERROR,
        message: hasPasswordConfirmationMismatch
          ? 'Xác nhận mật khẩu không khớp'
          : 'Validation failed',
        details: details.map(({ code, ...detail }) => detail),
      },
    });
  }

  return next();
}

function getRequiredFieldErrors(schema, body) {
  return schema.requiredFields
    .filter((field) => !body || body[field] === undefined || body[field] === null || body[field] === '')
    .map((field) => ({
      field,
      message: `${field} is required`,
    }));
}

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  verifyEmailSchema,
  resendVerificationOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validateRegister,
  validateLogin,
  validateRefresh: buildValidationMiddleware(refreshSchema),
  validateLogout: buildValidationMiddleware(logoutSchema),
  validateVerifyEmail,
  validateResendVerificationOtp,
  validateForgotPassword,
  validateResetPassword,
};
