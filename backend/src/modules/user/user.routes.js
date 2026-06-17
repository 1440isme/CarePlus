const express = require('express');
const UserController = require('./user.controller');
const {
  validateListUsers,
  validateUpdateMe,
  validateUpdateUserStatus,
  validateResetNoShowCount,
} = require('./user.validator');
const { USER_ROUTE_PATHS } = require('./user.types');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { USER_ROLES } = require('../../shared/constants/roles');

const router = express.Router();

router.get(USER_ROUTE_PATHS.ME, authenticate, UserController.getMe);
router.patch(USER_ROUTE_PATHS.ME, authenticate, validateUpdateMe, UserController.updateMe);

router.get(
  USER_ROUTE_PATHS.ROOT,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateListUsers,
  UserController.listUsers,
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

module.exports = router;
