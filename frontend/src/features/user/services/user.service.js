import axiosInstance from '../../../shared/services/axios.instance.js';
import { USER_API_PATHS } from '../types/user.types.js';

export async function getMe() {
  const response = await axiosInstance.get(USER_API_PATHS.me);
  return response.data;
}

export async function updateMe(payload) {
  const response = await axiosInstance.patch(USER_API_PATHS.me, payload);
  return response.data;
}

export async function updateMyAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await axiosInstance.patch(USER_API_PATHS.avatar, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export async function changePassword(payload) {
  const response = await axiosInstance.patch(USER_API_PATHS.changePassword, payload);
  return response.data;
}
