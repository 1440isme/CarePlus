const { VALID_USER_ROLES } = require('../shared/constants/roles');

function sendAuthorizationError(res, statusCode, code, message, details = []) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendAuthorizationError(
        res,
        401,
        'UNAUTHENTICATED',
        'Bạn cần đăng nhập để truy cập tài nguyên này',
      );
    }

    const userRole = req.user.role;
    if (!userRole || !VALID_USER_ROLES.includes(userRole)) {
      return sendAuthorizationError(
        res,
        403,
        'INVALID_USER_ROLE',
        'Role người dùng không hợp lệ',
      );
    }

    if (!allowedRoles.includes(userRole)) {
      return sendAuthorizationError(
        res,
        403,
        'FORBIDDEN',
        'Bạn không có quyền thực hiện thao tác này',
      );
    }

    return next();
  };
}

module.exports = {
  authorize,
};
