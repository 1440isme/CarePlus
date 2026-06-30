const jwt = require('jsonwebtoken');
const { AUTH_ERROR_CODES } = require('../modules/auth/auth.types');

function sendAuthError(res, statusCode, code, message, details = []) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}

async function authenticate(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return sendAuthError(res, 401, AUTH_ERROR_CODES.AUTH_TOKEN_MISSING, 'Thiếu access token');
  }

  if (!authorizationHeader.startsWith('Bearer ')) {
    return sendAuthError(res, 401, AUTH_ERROR_CODES.INVALID_AUTH_HEADER, 'Authorization header không hợp lệ');
  }

  const accessToken = authorizationHeader.slice('Bearer '.length).trim();
  if (!accessToken) {
    return sendAuthError(res, 401, AUTH_ERROR_CODES.INVALID_AUTH_HEADER, 'Authorization header không hợp lệ');
  }

  const accessTokenSecret = process.env.JWT_SECRET;
  if (!accessTokenSecret) {
    return sendAuthError(res, 500, AUTH_ERROR_CODES.JWT_SECRET_MISSING, 'Thiếu cấu hình JWT secret');
  }

  let decodedAccessToken;
  try {
    decodedAccessToken = jwt.verify(accessToken, accessTokenSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendAuthError(res, 401, AUTH_ERROR_CODES.ACCESS_TOKEN_EXPIRED, 'Access token đã hết hạn');
    }

    return sendAuthError(res, 401, AUTH_ERROR_CODES.INVALID_ACCESS_TOKEN, 'Access token không hợp lệ');
  }

  const { userId, role, jti } = decodedAccessToken;
  if (!userId || !role || !jti) {
    return sendAuthError(
      res,
      401,
      AUTH_ERROR_CODES.INVALID_ACCESS_TOKEN_PAYLOAD,
      'Payload access token không hợp lệ',
    );
  }

  req.user = {
    userId,
    role,
    jti,
  };

  return next();
}

module.exports = {
  authenticate,
};
