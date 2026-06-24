import axiosInstance from '../../../shared/services/axios.instance.js';

/**
 * Fetch list of user's notifications
 */
export async function getNotifications(params = {}) {
  const response = await axiosInstance.get('/notifications', { params });
  return response.data;
}

/**
 * Mark a single notification as read
 */
export async function markRead(id) {
  const response = await axiosInstance.patch(`/notifications/${id}/read`);
  return response.data;
}

/**
 * Mark all notifications as read
 */
export async function markAllRead() {
  const response = await axiosInstance.patch('/notifications/read-all');
  return response.data;
}
