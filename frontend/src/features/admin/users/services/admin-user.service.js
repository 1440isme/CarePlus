import axiosInstance from '../../../../shared/services/axios.instance.js';
import { ADMIN_USER_API_PATHS } from '../types/admin-user.types.js';

function buildListUsersParams(params = {}) {
  const requestParams = {
    page: params.page,
    limit: params.limit,
  };

  if (params.search) {
    requestParams.search = params.search;
  }

  if (params.role) {
    requestParams.role = params.role;
  }

  if (params.status) {
    requestParams.status = params.status;
  }

  if (params.createdFrom) {
    requestParams.createdFrom = params.createdFrom;
  }

  if (params.createdTo) {
    requestParams.createdTo = params.createdTo;
  }

  return requestParams;
}

export async function getAdminUsers(params) {
  const response = await axiosInstance.get(ADMIN_USER_API_PATHS.root, {
    params: buildListUsersParams(params),
  });

  return response.data;
}

export async function getAdminUserDetail(userId) {
  const response = await axiosInstance.get(ADMIN_USER_API_PATHS.detail(userId));
  return response.data;
}

export async function createAdminStaffUser(payload) {
  const response = await axiosInstance.post(ADMIN_USER_API_PATHS.staff, payload);
  return response.data;
}

export async function updateAdminUser(userId, payload) {
  const response = await axiosInstance.patch(ADMIN_USER_API_PATHS.detail(userId), payload);
  return response.data;
}

export async function updateUserStatus(userId, status) {
  const response = await axiosInstance.patch(ADMIN_USER_API_PATHS.status(userId), { status });
  return response.data;
}

export async function resetUserNoShowCount(userId) {
  const response = await axiosInstance.patch(ADMIN_USER_API_PATHS.resetNoShow(userId));
  return response.data;
}

export async function resetUserPassword(userId) {
  const response = await axiosInstance.patch(ADMIN_USER_API_PATHS.resetPassword(userId), {});
  return response.data;
}
