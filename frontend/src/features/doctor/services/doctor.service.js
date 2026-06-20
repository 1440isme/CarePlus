import axiosInstance from '../../../shared/services/axios.instance.js';

export async function getDoctors(params = {}) {
  const response = await axiosInstance.get('/doctors', { params });
  return response.data;
}

export async function getDoctorById(doctorId) {
  const response = await axiosInstance.get(`/doctors/${doctorId}`);
  return response.data;
}

export async function getMyDoctorProfile() {
  const response = await axiosInstance.get('/doctors/me/profile');
  return response.data;
}

export async function updateMyDoctorProfile(payload) {
  const response = await axiosInstance.patch('/doctors/me/profile', payload);
  return response.data;
}

export async function getDoctorDashboard() {
  const response = await axiosInstance.get('/doctors/me/dashboard');
  return response.data;
}

export async function updateDoctorPrice({ doctorId, price }) {
  const response = await axiosInstance.patch(`/doctors/${doctorId}/price`, { price });
  return response.data;
}

export async function updateDoctorByAdmin({ doctorId, ...payload }) {
  const response = await axiosInstance.patch(`/doctors/${doctorId}`, payload);
  return response.data;
}
