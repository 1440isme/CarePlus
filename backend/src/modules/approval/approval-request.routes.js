const express = require('express');
const ApprovalRequestController = require('./approval-request.controller');
const {
  validateCreateScheduleException,
  validateListApprovalRequests,
  validateApprovalRequestId,
} = require('./approval-request.validator');
const { APPROVAL_REQUEST_ROUTE_PATHS } = require('./approval-request.types');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { USER_ROLES } = require('../../shared/constants/roles');

const router = express.Router();

router.post(
  APPROVAL_REQUEST_ROUTE_PATHS.SCHEDULE_EXCEPTION,
  authenticate,
  authorize(USER_ROLES.DOCTOR),
  validateCreateScheduleException,
  ApprovalRequestController.createScheduleException,
);

router.get(
  APPROVAL_REQUEST_ROUTE_PATHS.ROOT,
  authenticate,
  authorize(USER_ROLES.ADMIN, USER_ROLES.DOCTOR),
  validateListApprovalRequests,
  ApprovalRequestController.listRequests,
);

router.patch(
  APPROVAL_REQUEST_ROUTE_PATHS.APPROVE,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateApprovalRequestId,
  ApprovalRequestController.approveRequest,
);

router.patch(
  APPROVAL_REQUEST_ROUTE_PATHS.REJECT,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateApprovalRequestId,
  ApprovalRequestController.rejectRequest,
);

module.exports = router;
