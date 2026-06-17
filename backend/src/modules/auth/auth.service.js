const AuthRepository = require('./auth.repository');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redis = require('../../infrastructure/cache/redis.client');
const { randomUUID, randomBytes } = require('crypto');
const { sendPasswordResetEmail } = require('./auth.email');
const {
  createForgotPasswordResponseDto,
  createLoginResponseDto,
  createLogoutResponseDto,
  createRefreshResponseDto,
  createRegisterResponseDto,
  createResetPasswordResponseDto,
  createResendVerificationOtpResponseDto,
  createVerifyEmailResponseDto,
} = require('./auth.dto');
const { AUTH_ERROR_CODES, AUTH_OTP_CONFIG, AUTH_TOKEN_CONFIG } = require('./auth.types');

class AuthServiceError extends Error {
  constructor({ code, message, statusCode, details = [] }) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

class AuthService {
  constructor(authRepository) {
    this.authRepository = authRepository;
  }

  async register(dto) {
    try {
      const normalizedDto = this._normalizeRegisterDto(dto);
      const existingUser = await this.authRepository.findUserByEmail(normalizedDto.email);

      if (existingUser) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS,
          message: 'Email đã được sử dụng',
          statusCode: 409,
          details: [],
        });
      }

      const passwordHash = await bcrypt.hash(normalizedDto.password, 10);

      const createdUser = await this.authRepository.createPatientUser({
        name: normalizedDto.name,
        email: normalizedDto.email,
        phone: normalizedDto.phone,
        passwordHash,
        role: 'PATIENT',
        status: 'ACTIVE',
        noShowCount: 0,
        emailVerified: false,
      });

      const otp = this._generateNumericOtp();
      const otpKey = this._buildEmailVerificationOtpKey(createdUser.email);

      try {
        await redis.set(otpKey, otp, 'EX', AUTH_OTP_CONFIG.EMAIL_VERIFICATION_TTL_SECONDS);
      } catch (error) {
        await this._rollbackCreatedUser(createdUser.id);

        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.REDIS_CONNECTION_ERROR,
          message: 'Không thể lưu OTP xác minh email',
          statusCode: 503,
          details: [],
        });
      }

      return createRegisterResponseDto(
        createdUser,
        AUTH_OTP_CONFIG.EMAIL_VERIFICATION_TTL_SECONDS,
      );
    } catch (error) {
      if (error instanceof AuthServiceError) {
        throw error;
      }

      throw new AuthServiceError({
        code: AUTH_ERROR_CODES.REGISTER_FAILED,
        message: 'Đăng ký tài khoản thất bại',
        statusCode: 500,
        details: [],
      });
    }
  }

  async login(dto) {
    try {
      const normalizedEmail = dto.email.trim().toLowerCase();
      const password = dto.password;
      const user = await this.authRepository.findUserByEmail(normalizedEmail);

      if (!user) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Email hoặc mật khẩu không chính xác',
          statusCode: 401,
          details: [],
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Email hoặc mật khẩu không chính xác',
          statusCode: 401,
          details: [],
        });
      }

      if (user.status === 'LOCKED') {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.ACCOUNT_LOCKED,
          message: 'Tài khoản đã bị khóa',
          statusCode: 403,
          details: [],
        });
      }

      const jwtSecrets = this._getJwtSecrets();
      const accessTokenJti = randomUUID();
      const refreshTokenJti = randomUUID();

      const accessToken = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          jti: accessTokenJti,
        },
        jwtSecrets.accessTokenSecret,
        { expiresIn: AUTH_TOKEN_CONFIG.ACCESS_TOKEN_EXPIRES_IN },
      );

      const refreshToken = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          jti: refreshTokenJti,
        },
        jwtSecrets.refreshTokenSecret,
        { expiresIn: AUTH_TOKEN_CONFIG.REFRESH_TOKEN_EXPIRES_IN },
      );

      return {
        ...createLoginResponseDto(user, accessToken),
        refreshToken,
        refreshCookie: {
          name: AUTH_TOKEN_CONFIG.REFRESH_TOKEN_COOKIE_NAME,
          options: this._buildRefreshCookieOptions(),
        },
      };
    } catch (error) {
      if (error instanceof AuthServiceError) {
        throw error;
      }

      throw new AuthServiceError({
        code: AUTH_ERROR_CODES.LOGIN_FAILED,
        message: 'Đăng nhập thất bại',
        statusCode: 500,
        details: [],
      });
    }
  }

  async refresh(refreshToken) {
    try {
      if (!refreshToken) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.REFRESH_TOKEN_MISSING,
          message: 'Không tìm thấy refresh token',
          statusCode: 401,
          details: [],
        });
      }

      const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
      if (!refreshTokenSecret) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.JWT_REFRESH_SECRET_MISSING,
          message: 'Thiếu cấu hình JWT refresh secret',
          statusCode: 500,
          details: [],
        });
      }

      let decodedRefreshToken;
      try {
        decodedRefreshToken = jwt.verify(refreshToken, refreshTokenSecret);
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          throw new AuthServiceError({
            code: AUTH_ERROR_CODES.REFRESH_TOKEN_EXPIRED,
            message: 'Refresh token đã hết hạn',
            statusCode: 401,
            details: [],
          });
        }

        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.INVALID_REFRESH_TOKEN,
          message: 'Refresh token không hợp lệ',
          statusCode: 401,
          details: [],
        });
      }

      const blacklistKey = this._buildTokenBlacklistKey(decodedRefreshToken.jti);
      let isRefreshTokenRevoked = false;

      try {
        isRefreshTokenRevoked = Boolean(await redis.get(blacklistKey));
      } catch (error) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.REDIS_CONNECTION_ERROR,
          message: 'Không thể kiểm tra trạng thái refresh token',
          statusCode: 503,
          details: [],
        });
      }

      if (isRefreshTokenRevoked) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.REFRESH_TOKEN_REVOKED,
          message: 'Refresh token đã bị thu hồi',
          statusCode: 401,
          details: [],
        });
      }

      const user = await this.authRepository.findUserById(decodedRefreshToken.userId);
      if (!user) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.USER_NOT_FOUND,
          message: 'Không tìm thấy người dùng',
          statusCode: 404,
          details: [],
        });
      }

      if (user.status === 'LOCKED') {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.ACCOUNT_LOCKED,
          message: 'Tài khoản đã bị khóa',
          statusCode: 403,
          details: [],
        });
      }

      const accessTokenSecret = process.env.JWT_SECRET;
      if (!accessTokenSecret) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.JWT_SECRET_MISSING,
          message: 'Thiếu cấu hình JWT secret',
          statusCode: 500,
          details: [],
        });
      }

      const accessToken = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          jti: randomUUID(),
        },
        accessTokenSecret,
        { expiresIn: AUTH_TOKEN_CONFIG.ACCESS_TOKEN_EXPIRES_IN },
      );

      return createRefreshResponseDto(user, accessToken);
    } catch (error) {
      if (error instanceof AuthServiceError) {
        throw error;
      }

      throw new AuthServiceError({
        code: AUTH_ERROR_CODES.REFRESH_TOKEN_FAILED,
        message: 'Làm mới access token thất bại',
        statusCode: 500,
        details: [],
      });
    }
  }

  async logout(refreshToken) {
    try {
      const refreshCookie = {
        name: AUTH_TOKEN_CONFIG.REFRESH_TOKEN_COOKIE_NAME,
        options: this._buildRefreshCookieOptions(),
      };

      if (!refreshToken) {
        return {
          ...createLogoutResponseDto(),
          refreshCookie,
        };
      }

      const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
      if (!refreshTokenSecret) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.JWT_REFRESH_SECRET_MISSING,
          message: 'Thiếu cấu hình JWT refresh secret',
          statusCode: 500,
          details: [],
        });
      }

      let decodedRefreshToken;
      try {
        decodedRefreshToken = jwt.verify(refreshToken, refreshTokenSecret);
      } catch (error) {
        return {
          ...createLogoutResponseDto(),
          refreshCookie,
        };
      }

      const ttlSeconds = decodedRefreshToken.exp - Math.floor(Date.now() / 1000);
      if (ttlSeconds > 0) {
        const blacklistKey = this._buildTokenBlacklistKey(decodedRefreshToken.jti);

        try {
          await redis.set(blacklistKey, 'revoked', 'EX', ttlSeconds);
        } catch (error) {
          throw new AuthServiceError({
            code: AUTH_ERROR_CODES.REDIS_CONNECTION_ERROR,
            message: 'Không thể thu hồi refresh token trên server',
            statusCode: 503,
            details: [],
          });
        }
      }

      return {
        ...createLogoutResponseDto(),
        refreshCookie,
      };
    } catch (error) {
      if (error instanceof AuthServiceError) {
        throw error;
      }

      throw new AuthServiceError({
        code: AUTH_ERROR_CODES.LOGOUT_FAILED,
        message: 'Đăng xuất thất bại',
        statusCode: 500,
        details: [],
      });
    }
  }

  async verifyEmail(dto) {
    try {
      const normalizedEmail = dto.email.trim().toLowerCase();
      const normalizedOtp = dto.otp.trim();
      const user = await this.authRepository.findUserByEmail(normalizedEmail);

      if (!user) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.USER_NOT_FOUND,
          message: 'Không tìm thấy người dùng',
          statusCode: 404,
          details: [],
        });
      }

      if (user.emailVerified) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.EMAIL_ALREADY_VERIFIED,
          message: 'Email đã được xác minh',
          statusCode: 409,
          details: [],
        });
      }

      const otpKey = this._buildEmailVerificationOtpKey(normalizedEmail);
      const storedOtp = await redis.get(otpKey);

      if (!storedOtp) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.OTP_EXPIRED_OR_NOT_FOUND,
          message: 'Mã OTP đã hết hạn hoặc không tồn tại',
          statusCode: 400,
          details: [],
        });
      }

      if (storedOtp !== normalizedOtp) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.INVALID_OTP,
          message: 'Mã OTP không chính xác',
          statusCode: 400,
          details: [],
        });
      }

      const verifiedUser = await this.authRepository.updateUserEmailVerified(user.id, true);
      await redis.del(otpKey);

      return createVerifyEmailResponseDto(verifiedUser);
    } catch (error) {
      if (error instanceof AuthServiceError) {
        throw error;
      }

      throw new AuthServiceError({
        code: AUTH_ERROR_CODES.VERIFY_EMAIL_FAILED,
        message: 'Xác minh email thất bại',
        statusCode: 500,
        details: [],
      });
    }
  }

  async resendVerificationOtp(dto) {
    try {
      const normalizedEmail = dto.email.trim().toLowerCase();
      const user = await this.authRepository.findUserByEmail(normalizedEmail);

      if (!user) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.USER_NOT_FOUND,
          message: 'Không tìm thấy người dùng',
          statusCode: 404,
          details: [],
        });
      }

      if (user.emailVerified) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.EMAIL_ALREADY_VERIFIED,
          message: 'Email này đã được xác minh',
          statusCode: 409,
          details: [],
        });
      }

      const rateLimitKey = this._buildResendOtpRateLimitKey(normalizedEmail);
      let resendRequestCount;

      try {
        resendRequestCount = await redis.incr(rateLimitKey);

        if (resendRequestCount === 1) {
          await redis.expire(rateLimitKey, AUTH_OTP_CONFIG.RESEND_RATE_LIMIT_TTL_SECONDS);
        }
      } catch (error) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.REDIS_CONNECTION_ERROR,
          message: 'Không thể kiểm tra giới hạn gửi lại OTP',
          statusCode: 503,
          details: [],
        });
      }

      if (resendRequestCount > AUTH_OTP_CONFIG.RESEND_RATE_LIMIT_MAX_REQUESTS) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.TOO_MANY_OTP_REQUESTS,
          message: 'Bạn đã yêu cầu gửi lại OTP quá nhiều lần. Vui lòng thử lại sau',
          statusCode: 429,
          details: [],
        });
      }

      const otp = this._generateNumericOtp();
      const otpKey = this._buildEmailVerificationOtpKey(normalizedEmail);

      try {
        await redis.set(otpKey, otp, 'EX', AUTH_OTP_CONFIG.EMAIL_VERIFICATION_TTL_SECONDS);
      } catch (error) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.REDIS_CONNECTION_ERROR,
          message: 'Không thể lưu OTP xác minh email',
          statusCode: 503,
          details: [],
        });
      }

      // TODO: integrate email sending service from notification module when available.
      return createResendVerificationOtpResponseDto(
        AUTH_OTP_CONFIG.EMAIL_VERIFICATION_TTL_SECONDS,
      );
    } catch (error) {
      if (error instanceof AuthServiceError) {
        throw error;
      }

      throw new AuthServiceError({
        code: AUTH_ERROR_CODES.RESEND_OTP_FAILED,
        message: 'Gửi lại OTP xác minh email thất bại',
        statusCode: 500,
        details: [],
      });
    }
  }

  async forgotPassword(dto) {
    try {
      const normalizedEmail = dto.email.trim().toLowerCase();
      const user = await this.authRepository.findUserByEmail(normalizedEmail);

      if (!user) {
        return createForgotPasswordResponseDto(AUTH_OTP_CONFIG.PASSWORD_RESET_TTL_SECONDS);
      }

      const resetToken = randomBytes(32).toString('hex');
      const resetKey = this._buildPasswordResetKey(normalizedEmail);

      try {
        await redis.set(resetKey, resetToken, 'EX', AUTH_OTP_CONFIG.PASSWORD_RESET_TTL_SECONDS);
      } catch (error) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.REDIS_CONNECTION_ERROR,
          message: 'Không thể lưu yêu cầu đặt lại mật khẩu',
          statusCode: 503,
          details: [],
        });
      }

      await sendPasswordResetEmail({
        to: normalizedEmail,
        resetToken,
        resetUrl: process.env.PASSWORD_RESET_URL || '',
      });

      return createForgotPasswordResponseDto(AUTH_OTP_CONFIG.PASSWORD_RESET_TTL_SECONDS);
    } catch (error) {
      if (error instanceof AuthServiceError) {
        throw error;
      }

      throw new AuthServiceError({
        code: AUTH_ERROR_CODES.FORGOT_PASSWORD_FAILED,
        message: 'Không thể xử lý yêu cầu quên mật khẩu',
        statusCode: 500,
        details: [],
      });
    }
  }

  async resetPassword(dto) {
    try {
      const normalizedEmail = dto.email.trim().toLowerCase();
      const resetToken = dto.token.trim();
      const user = await this.authRepository.findUserByEmail(normalizedEmail);

      if (!user) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.INVALID_RESET_TOKEN,
          message: 'Mã đặt lại mật khẩu không hợp lệ',
          statusCode: 400,
          details: [],
        });
      }

      const resetKey = this._buildPasswordResetKey(normalizedEmail);
      let storedResetToken;

      try {
        storedResetToken = await redis.get(resetKey);
      } catch (error) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.REDIS_CONNECTION_ERROR,
          message: 'Không thể kiểm tra yêu cầu đặt lại mật khẩu',
          statusCode: 503,
          details: [],
        });
      }

      if (!storedResetToken) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.RESET_TOKEN_EXPIRED_OR_NOT_FOUND,
          message: 'Mã đặt lại mật khẩu đã hết hạn hoặc không tồn tại',
          statusCode: 400,
          details: [],
        });
      }

      if (storedResetToken !== resetToken) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.INVALID_RESET_TOKEN,
          message: 'Mã đặt lại mật khẩu không hợp lệ',
          statusCode: 400,
          details: [],
        });
      }

      const passwordHash = await bcrypt.hash(dto.newPassword, 10);
      await this.authRepository.updateUserPasswordHash(user.id, passwordHash);

      try {
        await redis.del(resetKey);
      } catch (error) {
        throw new AuthServiceError({
          code: AUTH_ERROR_CODES.REDIS_CONNECTION_ERROR,
          message: 'Không thể hoàn tất thu hồi mã đặt lại mật khẩu',
          statusCode: 503,
          details: [],
        });
      }

      return createResetPasswordResponseDto();
    } catch (error) {
      if (error instanceof AuthServiceError) {
        throw error;
      }

      throw new AuthServiceError({
        code: AUTH_ERROR_CODES.RESET_PASSWORD_FAILED,
        message: 'Đặt lại mật khẩu thất bại',
        statusCode: 500,
        details: [],
      });
    }
  }

  _normalizeRegisterDto(dto) {
    return {
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone.trim(),
      password: dto.password,
    };
  }

  _generateNumericOtp() {
    const min = 10 ** (AUTH_OTP_CONFIG.OTP_LENGTH - 1);
    const max = (10 ** AUTH_OTP_CONFIG.OTP_LENGTH) - 1;
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
  }

  _buildEmailVerificationOtpKey(email) {
    return `${AUTH_OTP_CONFIG.EMAIL_VERIFICATION_KEY_PREFIX}${email}`;
  }

  _buildResendOtpRateLimitKey(email) {
    return `${AUTH_OTP_CONFIG.RESEND_RATE_LIMIT_KEY_PREFIX}${email}`;
  }

  _buildPasswordResetKey(email) {
    return `${AUTH_OTP_CONFIG.PASSWORD_RESET_KEY_PREFIX}${email}`;
  }

  _buildTokenBlacklistKey(jti) {
    return `${AUTH_TOKEN_CONFIG.TOKEN_BLACKLIST_KEY_PREFIX}${jti}`;
  }

  _getJwtSecrets() {
    const accessTokenSecret = process.env.JWT_SECRET;
    const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;

    if (!accessTokenSecret || !refreshTokenSecret) {
      throw new AuthServiceError({
        code: AUTH_ERROR_CODES.JWT_SECRET_MISSING,
        message: 'Thiếu cấu hình JWT secret cho đăng nhập',
        statusCode: 500,
        details: [],
      });
    }

    return {
      accessTokenSecret,
      refreshTokenSecret,
    };
  }

  _buildRefreshCookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: AUTH_TOKEN_CONFIG.REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
    };
  }

  async _rollbackCreatedUser(userId) {
    try {
      await this.authRepository.deleteUserById(userId);
    } catch (error) {
      throw new AuthServiceError({
        code: AUTH_ERROR_CODES.REGISTER_FAILED,
        message: 'Đăng ký thất bại do không thể hoàn tất lưu OTP xác minh',
        statusCode: 500,
        details: [],
      });
    }
  }
}

module.exports = new AuthService(AuthRepository);
