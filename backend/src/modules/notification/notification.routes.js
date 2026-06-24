const express = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const NotificationController = require('./notification.controller');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', NotificationController.getMyNotifications);
router.patch('/read-all', NotificationController.markAllAsRead);
router.patch('/:id/read', NotificationController.markAsRead);

module.exports = router;
