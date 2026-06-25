import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDoctorByAdmin } from '../services/doctor.service.js';
import { QUERY_KEYS } from '../../../shared/constants/query-keys.js';

export function useUpdateDoctorByAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDoctorByAdmin,
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doctors });
      if (variables?.doctorId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doctorDetail(variables.doctorId) });
      }
    },
  });
}
