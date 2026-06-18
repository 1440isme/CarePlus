import axiosInstance from '../../../shared/services/axios.instance.js';
import { PATIENT_PROFILE_API_PATHS } from '../types/patient-profile.types.js';

export async function getPatientProfiles(params = {}) {
  const response = await axiosInstance.get(PATIENT_PROFILE_API_PATHS.root, { params });
  return response.data;
}

export async function createPatientProfile(payload) {
  const response = await axiosInstance.post(PATIENT_PROFILE_API_PATHS.root, payload);
  return response.data;
}

export async function updatePatientProfile({ id, payload }) {
  const response = await axiosInstance.patch(PATIENT_PROFILE_API_PATHS.detail(id), payload);
  return response.data;
}

export async function deletePatientProfile(id) {
  const response = await axiosInstance.delete(PATIENT_PROFILE_API_PATHS.detail(id));
  return response.data;
}

export async function setDefaultPatientProfile(id) {
  const response = await axiosInstance.patch(PATIENT_PROFILE_API_PATHS.setDefault(id));
  return response.data;
}
