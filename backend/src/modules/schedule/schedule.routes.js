const express = require('express');
const ScheduleController = require('./schedule.controller');
const {
  validateCreateSchedule,
  validateListSchedules,
  validateDoctorScheduleParams,
} = require('./schedule.validator');
const { SCHEDULE_ROUTE_PATHS } = require('./schedule.types');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { USER_ROLES } = require('../../shared/constants/roles');

const router = express.Router();

router.post(
  SCHEDULE_ROUTE_PATHS.ROOT,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateCreateSchedule,
  ScheduleController.createSchedules,
);

router.get(
  SCHEDULE_ROUTE_PATHS.ROOT,
  authenticate,
  authorize(USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST, USER_ROLES.DOCTOR),
  validateListSchedules,
  ScheduleController.listSchedules,
);

router.get(
  SCHEDULE_ROUTE_PATHS.BY_DOCTOR,
  validateDoctorScheduleParams,
  ScheduleController.getDoctorSchedules,
);

module.exports = router;
