const express = require('express');
const AppointmentController = require('./appointment.controller');
const {
  validateCreateAppointment,
  validateCreateReceptionistAppointment,
  validateListAppointments,
  validateUpdateStatus,
} = require('./appointment.validator');
const { APPOINTMENT_ROUTE_PATHS } = require('./appointment.types');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { USER_ROLES } = require('../../shared/constants/roles');

const router = express.Router();

// Bệnh nhân - Đặt lịch & Quản lý lịch hẹn cá nhân
router.post(
  APPOINTMENT_ROUTE_PATHS.ROOT,
  authenticate,
  authorize(USER_ROLES.PATIENT),
  validateCreateAppointment,
  AppointmentController.createAppointment
);

router.get(
  APPOINTMENT_ROUTE_PATHS.MY,
  authenticate,
  authorize(USER_ROLES.PATIENT),
  validateListAppointments,
  AppointmentController.listMyAppointments
);

router.get(
  APPOINTMENT_ROUTE_PATHS.MY_DETAIL,
  authenticate,
  authorize(USER_ROLES.PATIENT),
  AppointmentController.getMyAppointmentDetail
);

router.patch(
  APPOINTMENT_ROUTE_PATHS.MY_CANCEL,
  authenticate,
  authorize(USER_ROLES.PATIENT),
  AppointmentController.cancelMyAppointment
);

// Bác sĩ - Xem và cập nhật lịch hẹn của chính mình
router.get(
  APPOINTMENT_ROUTE_PATHS.DOCTOR_ME,
  authenticate,
  authorize(USER_ROLES.DOCTOR),
  validateListAppointments,
  AppointmentController.listDoctorAppointments
);

router.patch(
  APPOINTMENT_ROUTE_PATHS.DOCTOR_ME_STATUS,
  authenticate,
  authorize(USER_ROLES.DOCTOR),
  validateUpdateStatus,
  AppointmentController.updateDoctorAppointmentStatus
);

// Lễ tân & Admin - Quản lý toàn bộ lịch hẹn
router.post(
  APPOINTMENT_ROUTE_PATHS.RECEPTIONIST_BOOK,
  authenticate,
  authorize(USER_ROLES.RECEPTIONIST, USER_ROLES.ADMIN),
  validateCreateReceptionistAppointment,
  AppointmentController.createReceptionistAppointment
);

router.get(
  APPOINTMENT_ROUTE_PATHS.RECEPTIONIST_PATIENTS,
  authenticate,
  authorize(USER_ROLES.RECEPTIONIST, USER_ROLES.ADMIN),
  AppointmentController.receptionistSearchPatients
);

router.get(
  APPOINTMENT_ROUTE_PATHS.ROOT,
  authenticate,
  authorize(USER_ROLES.RECEPTIONIST, USER_ROLES.ADMIN),
  validateListAppointments,
  AppointmentController.listAllAppointments
);

router.get(
  APPOINTMENT_ROUTE_PATHS.DETAIL,
  authenticate,
  authorize(USER_ROLES.RECEPTIONIST, USER_ROLES.ADMIN),
  AppointmentController.getAppointmentDetail
);

router.patch(
  APPOINTMENT_ROUTE_PATHS.STATUS,
  authenticate,
  authorize(USER_ROLES.RECEPTIONIST, USER_ROLES.ADMIN),
  validateUpdateStatus,
  AppointmentController.updateAppointmentStatus
);

module.exports = router;
