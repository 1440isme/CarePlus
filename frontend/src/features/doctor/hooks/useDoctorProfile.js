import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyDoctorProfile, updateMyDoctorProfile } from '../services/doctor.service.js';
import { QUERY_KEYS } from '../../../shared/constants/query-keys.js';

export function useDoctorProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.doctorProfile,
    queryFn: getMyDoctorProfile,
  });
}

export function useUpdateDoctorProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMyDoctorProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doctorProfile });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doctorDashboard });
    },
  });
}
