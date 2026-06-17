export const AUTH_API_PATHS = {
  register: '/auth/register',
  login: '/auth/login',
  verifyEmail: '/auth/verify-email',
  resendVerificationOtp: '/auth/resend-verification-otp',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
};

export const AUTH_USER_ROLES = ['PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN'];
export const AUTH_USER_STATUSES = ['ACTIVE', 'LOCKED'];
export const AUTH_ROLE_DEFAULT_ROUTES = {
  PATIENT: '/benh-nhan',
  DOCTOR: '/bac-si-portal',
  RECEPTIONIST: '/le-tan',
  ADMIN: '/admin',
};

/**
 * @typedef {Object} AuthUser
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string | null | undefined} [phone]
 * @property {'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN'} role
 * @property {'ACTIVE' | 'LOCKED'} status
 * @property {boolean} emailVerified
 * @property {number | undefined} [noShowCount]
 * @property {string | undefined} [createdAt]
 * @property {string | undefined} [updatedAt]
 */

/**
 * @typedef {Object} LoginRequest
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} LoginResponse
 * @property {string} accessToken
 * @property {AuthUser} user
 */

/**
 * @typedef {Object} RegisterRequest
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {string} password
 * @property {string} confirmPassword
 */

/**
 * @typedef {Object} VerifyEmailRequest
 * @property {string} email
 * @property {string} otp
 */

/**
 * @typedef {Object} ResendVerificationOtpRequest
 * @property {string} email
 */

/**
 * @typedef {Object} ForgotPasswordRequest
 * @property {string} email
 */

/**
 * @typedef {Object} ForgotPasswordResponse
 * @property {string} message
 * @property {{ expiresInSeconds?: number | undefined } | undefined} [reset]
 */

/**
 * @typedef {Object} ResetPasswordRequest
 * @property {string} email
 * @property {string} token
 * @property {string} newPassword
 */

/**
 * @typedef {Object} ResetPasswordFormValues
 * @property {string} email
 * @property {string} token
 * @property {string} newPassword
 * @property {string} confirmPassword
 */

/**
 * @typedef {Object} ResetPasswordResponse
 * @property {string} message
 */

/**
 * @template T
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {T} data
 * @property {{ code: string, message: string, details?: unknown[] } | undefined} [error]
 * @property {Record<string, unknown> | undefined} [meta]
 */
