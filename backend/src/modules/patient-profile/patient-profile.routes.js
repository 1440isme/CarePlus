const express = require('express');
const PatientProfileController = require('./patient-profile.controller');
const {
  validateListPatientProfiles,
  validateCreatePatientProfile,
  validatePatientProfileId,
  validateUpdatePatientProfile,
} = require('./patient-profile.validator');
const { PATIENT_PROFILE_ROUTE_PATHS } = require('./patient-profile.types');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { USER_ROLES } = require('../../shared/constants/roles');

const router = express.Router();

router.get(
  PATIENT_PROFILE_ROUTE_PATHS.ROOT,
  authenticate,
  authorize(USER_ROLES.PATIENT),
  validateListPatientProfiles,
  PatientProfileController.listMyProfiles,
);

router.post(
  PATIENT_PROFILE_ROUTE_PATHS.ROOT,
  authenticate,
  authorize(USER_ROLES.PATIENT),
  validateCreatePatientProfile,
  PatientProfileController.createMyProfile,
);

router.patch(
  PATIENT_PROFILE_ROUTE_PATHS.SET_DEFAULT,
  authenticate,
  authorize(USER_ROLES.PATIENT),
  validatePatientProfileId,
  PatientProfileController.setDefaultProfile,
);

router.get(
  PATIENT_PROFILE_ROUTE_PATHS.DETAIL,
  authenticate,
  authorize(USER_ROLES.PATIENT),
  validatePatientProfileId,
  PatientProfileController.getMyProfileById,
);

router.patch(
  PATIENT_PROFILE_ROUTE_PATHS.DETAIL,
  authenticate,
  authorize(USER_ROLES.PATIENT),
  validatePatientProfileId,
  validateUpdatePatientProfile,
  PatientProfileController.updateMyProfile,
);

router.delete(
  PATIENT_PROFILE_ROUTE_PATHS.DETAIL,
  authenticate,
  authorize(USER_ROLES.PATIENT),
  validatePatientProfileId,
  PatientProfileController.deleteMyProfile,
);

module.exports = router;
