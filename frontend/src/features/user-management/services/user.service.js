import axiosInstance from '../../../shared/services/axios.instance.js';

export async function getMe() {
  const response = await axiosInstance.get('/users/me');
  return response.data;
}

export async function updateMe(payload) {
  const response = await axiosInstance.patch('/users/me', payload);
  return response.data;
}

export async function getUsers(params) {
  const response = await axiosInstance.get('/users', { params });
  return response.data;
}

export async function updateUserStatus({ userId, status }) {
  const response = await axiosInstance.patch(`/users/${userId}/status`, { status });
  return response.data;
}

export async function resetNoShowCount(userId) {
  const response = await axiosInstance.patch(`/users/${userId}/reset-no-show`);
  return response.data;
}
