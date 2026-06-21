import axiosInstance from '../../../shared/services/axios.instance.js';

export async function getAppointments(params) {
  const response = await axiosInstance.get('/appointments', { params });
  return response.data;
}

export async function getAppointmentById(id) {
  const response = await axiosInstance.get(`/appointments/${id}`);
  return response.data;
}

export async function updateAppointmentStatus(id, payload) {
  const response = await axiosInstance.patch(`/appointments/${id}/status`, payload);
  return response.data;
}

export async function searchPatients(params) {
  const response = await axiosInstance.get('/appointments/receptionist/patients', { params });
  return response.data;
}

export async function bookAppointmentByReceptionist(payload) {
  const response = await axiosInstance.post('/appointments/receptionist', payload);
  return response.data;
}

export async function bookAppointment(payload) {
  const response = await axiosInstance.post('/appointments', payload);
  return response.data;
}
