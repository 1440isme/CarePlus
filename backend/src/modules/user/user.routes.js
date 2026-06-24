const express = require('express');
const UserController = require('./user.controller');
const {
  validateListUsers,
  validateUpdateMe,
  validateChangeMyPassword,
  validateAdminUpdateUser,
  validateCreateStaffUser,
  validateGetUserDetail,
  validateUpdateUserStatus,
  validateResetNoShowCount,
  validateResetUserPassword,
} = require('./user.validator');
const { USER_ROUTE_PATHS } = require('./user.types');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { uploadAvatar } = require('../../middleware/multer.middleware');
const { USER_ROLES } = require('../../shared/constants/roles');

const router = express.Router();

router.get(USER_ROUTE_PATHS.ME, authenticate, UserController.getMe);
router.patch(USER_ROUTE_PATHS.ME, authenticate, validateUpdateMe, UserController.updateMe);
router.patch(USER_ROUTE_PATHS.ME_AVATAR, authenticate, uploadAvatar, UserController.updateMyAvatar);
router.patch(
  USER_ROUTE_PATHS.ME_PASSWORD,
  authenticate,
  validateChangeMyPassword,
  UserController.changeMyPassword,
);

router.get(
  USER_ROUTE_PATHS.ROOT,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateListUsers,
  UserController.listUsers,
);

router.post(
  USER_ROUTE_PATHS.STAFF,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateCreateStaffUser,
  UserController.createStaffUser,
);

router.get(
  USER_ROUTE_PATHS.DETAIL,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateGetUserDetail,
  UserController.getUserDetail,
);

router.patch(
  USER_ROUTE_PATHS.DETAIL,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateGetUserDetail,
  validateAdminUpdateUser,
  UserController.adminUpdateUser,
);

router.patch(
  USER_ROUTE_PATHS.STATUS,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateUpdateUserStatus,
  UserController.updateUserStatus,
);

router.patch(
  USER_ROUTE_PATHS.RESET_NO_SHOW,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateResetNoShowCount,
  UserController.resetNoShowCount,
);

router.patch(
  USER_ROUTE_PATHS.RESET_PASSWORD,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateResetUserPassword,
  UserController.resetUserPasswordByAdmin,
);

module.exports = router;
