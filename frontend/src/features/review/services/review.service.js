import axiosInstance from '../../../shared/services/axios.instance.js';

export async function getDoctorReviews(doctorId, params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  const url = queryString 
    ? `/reviews/doctor/${doctorId}?${queryString}`
    : `/reviews/doctor/${doctorId}`;
    
  const response = await axiosInstance.get(url);
  return response.data;
}

export async function submitReview(payload) {
  const response = await axiosInstance.post('/reviews', payload);
  return response.data;
}

export async function getAppointmentReview(appointmentId) {
  const response = await axiosInstance.get(`/reviews/appointment/${appointmentId}`);
  return response.data;
}
