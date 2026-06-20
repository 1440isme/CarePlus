const express = require('express');
const DoctorController = require('./doctor.controller');
const {
  validateDoctorIdParam,
  validateListDoctors,
  validateUpdateMyDoctorProfile,
  validateUpdateDoctorPrice,
  validateUpdateDoctorByAdmin,
} = require('./doctor.validator');
const { DOCTOR_ROUTE_PATHS } = require('./doctor.types');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { USER_ROLES } = require('../../shared/constants/roles');

const router = express.Router();

router.get(DOCTOR_ROUTE_PATHS.ROOT, validateListDoctors, DoctorController.listDoctors);
router.get(
  DOCTOR_ROUTE_PATHS.ME_PROFILE,
  authenticate,
  authorize(USER_ROLES.DOCTOR),
  DoctorController.getMyDoctorProfile,
);
router.patch(
  DOCTOR_ROUTE_PATHS.ME_PROFILE,
  authenticate,
  authorize(USER_ROLES.DOCTOR),
  validateUpdateMyDoctorProfile,
  DoctorController.updateMyDoctorProfile,
);
router.get(
  DOCTOR_ROUTE_PATHS.ME_DASHBOARD,
  authenticate,
  authorize(USER_ROLES.DOCTOR),
  DoctorController.getDoctorDashboard,
);
router.patch(
  DOCTOR_ROUTE_PATHS.PRICE,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateUpdateDoctorPrice,
  DoctorController.updateDoctorPrice,
);
router.patch(
  DOCTOR_ROUTE_PATHS.BY_ID,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateUpdateDoctorByAdmin,
  DoctorController.updateDoctorByAdmin,
);
router.get(DOCTOR_ROUTE_PATHS.BY_ID, validateDoctorIdParam, DoctorController.getDoctorById);

module.exports = router;
