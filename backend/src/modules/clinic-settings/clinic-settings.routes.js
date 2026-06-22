const express = require('express');
const ClinicSettingsController = require('./clinic-settings.controller');
const {
  validateUpdateClinicInfo,
  validateUpdateSystemSetting,
} = require('./clinic-settings.validator');
const { CLINIC_SETTINGS_ROUTE_PATHS } = require('./clinic-settings.types');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { USER_ROLES } = require('../../shared/constants/roles');

const router = express.Router();

router.get(
  CLINIC_SETTINGS_ROUTE_PATHS.CLINIC_INFO,
  ClinicSettingsController.getPublicClinicInfo,
);

router.patch(
  CLINIC_SETTINGS_ROUTE_PATHS.CLINIC_INFO,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateUpdateClinicInfo,
  ClinicSettingsController.updateClinicInfo,
);

router.get(
  CLINIC_SETTINGS_ROUTE_PATHS.BOOKING_RULES,
  ClinicSettingsController.getBookingRules,
);

router.get(
  CLINIC_SETTINGS_ROUTE_PATHS.PUBLIC_SYSTEM,
  // Deprecated: use GET /api/v1/clinic-settings/booking-rules instead.
  ClinicSettingsController.getPublicSystemSetting,
);

router.get(
  CLINIC_SETTINGS_ROUTE_PATHS.SYSTEM,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  ClinicSettingsController.getSystemSetting,
);

router.patch(
  CLINIC_SETTINGS_ROUTE_PATHS.SYSTEM,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateUpdateSystemSetting,
  ClinicSettingsController.updateSystemSetting,
);

module.exports = router;
