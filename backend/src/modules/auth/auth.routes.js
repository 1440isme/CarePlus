const express = require('express');
const AuthController = require('./auth.controller');
const { createRateLimiter } = require('../../middleware/rateLimiter.middleware');
const {
  validateRegister,
  validateLogin,
  validateRefresh,
  validateLogout,
  validateVerifyEmail,
  validateResendVerificationOtp,
  validateForgotPassword,
  validateResetPassword,
} = require('./auth.validator');
const { AUTH_ROUTE_PATHS } = require('./auth.types');

const router = express.Router();

const registerRateLimiter = createRateLimiter({
  action: 'register',
  limit: 3,
  windowSeconds: 60,
});

const loginRateLimiter = createRateLimiter({
  action: 'login',
  limit: 5,
  windowSeconds: 60,
});

const forgotPasswordRateLimiter = createRateLimiter({
  action: 'forgot-password',
  limit: 3,
  windowSeconds: 300,
});

const resendOtpRateLimiter = createRateLimiter({
  action: 'resend-otp',
  limit: 3,
  windowSeconds: 300,
});

router.post(AUTH_ROUTE_PATHS.REGISTER, registerRateLimiter, validateRegister, AuthController.register);
router.post(AUTH_ROUTE_PATHS.LOGIN, loginRateLimiter, validateLogin, AuthController.login);
router.post(AUTH_ROUTE_PATHS.REFRESH, validateRefresh, AuthController.refresh);
router.post(AUTH_ROUTE_PATHS.LOGOUT, validateLogout, AuthController.logout);
router.post(AUTH_ROUTE_PATHS.VERIFY_EMAIL, validateVerifyEmail, AuthController.verifyEmail);
router.post(
  AUTH_ROUTE_PATHS.RESEND_VERIFICATION_OTP,
  resendOtpRateLimiter,
  validateResendVerificationOtp,
  AuthController.resendVerificationOtp,
);
router.post(
  AUTH_ROUTE_PATHS.FORGOT_PASSWORD,
  forgotPasswordRateLimiter,
  validateForgotPassword,
  AuthController.forgotPassword,
);
router.post(AUTH_ROUTE_PATHS.RESET_PASSWORD, validateResetPassword, AuthController.resetPassword);

module.exports = router;
