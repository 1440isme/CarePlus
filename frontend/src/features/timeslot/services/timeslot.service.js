import axiosInstance from '../../../shared/services/axios.instance.js';

export async function getTimeSlots(params) {
  const response = await axiosInstance.get('/timeslots', { params });
  return response.data;
}

export async function lockTimeSlot(slotId, lockClientId) {
  const response = await axiosInstance.post(`/timeslots/${slotId}/lock`, { lockClientId });
  return response.data;
}

export async function unlockTimeSlot(slotId, lockClientId) {
  const response = await axiosInstance.post(`/timeslots/${slotId}/unlock`, { lockClientId });
  return response.data;
}

