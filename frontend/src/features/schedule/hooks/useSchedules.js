import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSchedules, getDoctorSchedules, getSchedules } from '../services/schedule.service.js';
import { QUERY_KEYS } from '../../../shared/constants/query-keys.js';

export function useSchedules(params) {
  return useQuery({
    queryKey: QUERY_KEYS.schedules(params),
    queryFn: () => getSchedules(params),
  });
}

export function useDoctorSchedules(doctorId, params) {
  return useQuery({
    queryKey: QUERY_KEYS.doctorSchedules(doctorId, params),
    queryFn: () => getDoctorSchedules({ doctorId, ...params }),
    enabled: Boolean(doctorId),
  });
}

export function useCreateSchedules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSchedules,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}
