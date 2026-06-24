const notificationService = require('./notification.service');

class NotificationController {
  /**
   * Get notifications for current user
   */
  async getMyNotifications(req, res, next) {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const result = await notificationService.getMyNotifications(userId, { page, limit });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const result = await notificationService.markAsRead(id, userId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all user notifications as read
   */
  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.userId;
      await notificationService.markAllAsRead(userId);

      return res.status(200).json({
        success: true,
        message: 'Đã đánh dấu tất cả thông báo là đã đọc',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
