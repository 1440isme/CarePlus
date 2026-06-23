import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getDoctorReviews,
  submitReview,
  getAppointmentReview
} from '../services/review.service.js';
import { QUERY_KEYS } from '../../../shared/constants/query-keys.js';

export function useDoctorReviews(doctorId, params) {
  return useQuery({
    queryKey: QUERY_KEYS.doctorReviews(doctorId, params),
    queryFn: () => getDoctorReviews(doctorId, params),
    enabled: Boolean(doctorId),
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitReview,
    onSuccess: (data, variables) => {
      // Invalidate my appointments list so the "Đánh giá" button updates to "Đã đánh giá"
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      // Invalidate the specific doctor details to update rating & reviewCount
      if (data?.data?.doctorId) {
        queryClient.invalidateQueries({ queryKey: ['doctor-detail', data.data.doctorId] });
        queryClient.invalidateQueries({ queryKey: ['doctor-reviews', data.data.doctorId] });
      }
      // Also invalidate appointment detail
      if (variables?.appointmentId) {
        queryClient.invalidateQueries({ queryKey: ['my-appointment-detail', variables.appointmentId] });
        queryClient.invalidateQueries({ queryKey: ['appointment-review', variables.appointmentId] });
      }
    },
  });
}

export function useAppointmentReview(appointmentId) {
  return useQuery({
    queryKey: QUERY_KEYS.appointmentReview(appointmentId),
    queryFn: () => getAppointmentReview(appointmentId),
    enabled: Boolean(appointmentId),
  });
}
