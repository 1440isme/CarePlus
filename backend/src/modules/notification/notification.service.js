const prisma = require('../../infrastructure/database/prisma.client');
const socketService = require('../../infrastructure/realtime/socket.service');

class NotificationService {
  /**
   * Create a new notification in DB and push it via Socket.IO
   */
  async createNotification({ userId, title, content, type, link = null }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          content,
          type,
          link,
        },
      });

      // Emit realtime socket notification to the specific user room
      socketService.emitToUser(userId, 'notification:new', notification);

      return notification;
    } catch (error) {
      console.error('[NotificationService] Error creating notification:', error.message);
      throw error;
    }
  }

  /**
   * Get paginated notifications list for a specific user
   */
  async getMyNotifications(userId, { page = 1, limit = 10 } = {}) {
    try {
      const skip = (page - 1) * limit;
      const [items, total] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where: { userId } }),
      ]);

      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      return {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        unreadCount,
      };
    } catch (error) {
      console.error('[NotificationService] Error getting notifications:', error.message);
      throw error;
    }
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(id, userId) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id },
      });

      if (!notification || notification.userId !== userId) {
        const err = new Error('Không tìm thấy thông báo hoặc không có quyền truy cập');
        err.statusCode = 404;
        err.code = 'NOTIFICATION_NOT_FOUND';
        throw err;
      }

      return prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
    } catch (error) {
      console.error('[NotificationService] Error marking as read:', error.message);
      throw error;
    }
  }

  /**
   * Mark all notifications of a user as read
   */
  async markAllAsRead(userId) {
    try {
      return prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    } catch (error) {
      console.error('[NotificationService] Error marking all as read:', error.message);
      throw error;
    }
  }
}

module.exports = new NotificationService();
