import axiosInstance from '../../../shared/services/axios.instance.js';

export async function getTimeSlots(params) {
  const response = await axiosInstance.get('/timeslots', { params });
  return response.data;
}
