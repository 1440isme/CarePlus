const express = require('express');
const SpecialtyController = require('./specialty.controller');
const {
  validateListSpecialties,
  validateSpecialtyId,
  validateCreateSpecialty,
  validateUpdateSpecialty,
} = require('./specialty.validator');
const { SPECIALTY_ROUTE_PATHS } = require('./specialty.types');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { USER_ROLES } = require('../../shared/constants/roles');

const router = express.Router();

router.get(
  SPECIALTY_ROUTE_PATHS.ROOT,
  validateListSpecialties,
  SpecialtyController.listPublicSpecialties,
);

router.get(
  SPECIALTY_ROUTE_PATHS.ADMIN_ROOT,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateListSpecialties,
  SpecialtyController.listSpecialties,
);

router.get(
  SPECIALTY_ROUTE_PATHS.DETAIL,
  validateSpecialtyId,
  SpecialtyController.getSpecialtyById,
);

router.post(
  SPECIALTY_ROUTE_PATHS.ROOT,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateCreateSpecialty,
  SpecialtyController.createSpecialty,
);

router.patch(
  SPECIALTY_ROUTE_PATHS.DETAIL,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateSpecialtyId,
  validateUpdateSpecialty,
  SpecialtyController.updateSpecialty,
);

router.delete(
  SPECIALTY_ROUTE_PATHS.DETAIL,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateSpecialtyId,
  SpecialtyController.deleteSpecialty,
);

module.exports = router;
