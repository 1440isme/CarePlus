function toAuthUserDto(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    noShowCount: user.noShowCount,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function createAuthSuccessPayload(action, data = {}) {
  return {
    action,
    ...data,
  };
}

function createRegisterResponseDto(user, expiresInSeconds) {
  return {
    user: toAuthUserDto(user),
    verification: {
      required: true,
      expiresInSeconds,
    },
  };
}

function createVerifyEmailResponseDto(user) {
  return {
    message: 'Xác minh email thành công',
    user: toAuthUserDto(user),
  };
}

function createResendVerificationOtpResponseDto(expiresInSeconds) {
  return {
    message: 'Mã OTP xác minh email đã được gửi lại',
    verification: {
      required: true,
      expiresInSeconds,
    },
  };
}

function createLoginResponseDto(user, accessToken) {
  return {
    user: toAuthUserDto(user),
    accessToken,
  };
}

function createRefreshResponseDto(user, accessToken) {
  return {
    accessToken,
    user: toAuthUserDto(user),
  };
}

function createLogoutResponseDto() {
  return {
    message: 'Đăng xuất thành công',
  };
}

function createForgotPasswordResponseDto(expiresInSeconds) {
  return {
    message: 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu sẽ được gửi.',
    reset: {
      expiresInSeconds,
    },
  };
}

function createResetPasswordResponseDto() {
  return {
    message: 'Đặt lại mật khẩu thành công',
  };
}

module.exports = {
  toAuthUserDto,
  createAuthSuccessPayload,
  createRegisterResponseDto,
  createVerifyEmailResponseDto,
  createResendVerificationOtpResponseDto,
  createLoginResponseDto,
  createRefreshResponseDto,
  createLogoutResponseDto,
  createForgotPasswordResponseDto,
  createResetPasswordResponseDto,
};
