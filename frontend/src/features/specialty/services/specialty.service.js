import axiosInstance from '../../../shared/services/axios.instance.js';

export async function getSpecialties(params) {
  const response = await axiosInstance.get('/specialties', { params });
  return response.data;
}
