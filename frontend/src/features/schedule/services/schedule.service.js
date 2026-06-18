import axiosInstance from '../../../shared/services/axios.instance.js';

export async function getSchedules(params) {
  const response = await axiosInstance.get('/schedules', { params });
  return response.data;
}

export async function getDoctorSchedules({ doctorId, ...params }) {
  const response = await axiosInstance.get(`/schedules/doctor/${doctorId}`, { params });
  return response.data;
}

export async function createSchedules(payload) {
  const response = await axiosInstance.post('/schedules', payload);
  return response.data;
}
