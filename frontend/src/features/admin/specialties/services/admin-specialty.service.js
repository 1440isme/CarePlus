import axiosInstance from '../../../../shared/services/axios.instance.js';
import { ADMIN_SPECIALTY_API_PATHS } from '../types/admin-specialty.types.js';

function buildQueryParams(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  return searchParams;
}

function buildSpecialtyPayload(payload) {
  const normalizedName = payload.name.trim();
  const normalizedDescription = payload.description.trim();

  return {
    name: normalizedName,
    ...(normalizedDescription ? { description: normalizedDescription } : {}),
    active: payload.active,
  };
}

export async function getAdminSpecialties(params = {}) {
  const searchParams = buildQueryParams(params);
  const queryString = searchParams.toString();
  const url = queryString
    ? `${ADMIN_SPECIALTY_API_PATHS.listRoot}?${queryString}`
    : ADMIN_SPECIALTY_API_PATHS.listRoot;

  const response = await axiosInstance.get(url);
  return {
    ...response.data,
    data: Array.isArray(response.data?.data)
      ? response.data.data.map((specialty) => ({
        ...specialty,
        active: specialty.active ?? true,
      }))
      : [],
  };
}

export async function createSpecialty(payload) {
  const response = await axiosInstance.post(
    ADMIN_SPECIALTY_API_PATHS.root,
    buildSpecialtyPayload(payload),
  );

  return response.data;
}

export async function updateSpecialty(id, payload) {
  const response = await axiosInstance.patch(
    ADMIN_SPECIALTY_API_PATHS.detail(id),
    buildSpecialtyPayload(payload),
  );

  return response.data;
}

export async function toggleSpecialtyActive(id, active) {
  const response = await axiosInstance.patch(
    ADMIN_SPECIALTY_API_PATHS.detail(id),
    { active },
  );

  return response.data;
}

export async function deleteSpecialty(id) {
  const response = await axiosInstance.delete(
    ADMIN_SPECIALTY_API_PATHS.detail(id),
  );

  return response.data;
}
