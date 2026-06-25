import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDoctorPrice } from '../services/doctor.service.js';
import { QUERY_KEYS } from '../../../shared/constants/query-keys.js';

export function useUpdateDoctorPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDoctorPrice,
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doctors });
      if (variables?.doctorId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doctorDetail(variables.doctorId) });
      }
    },
  });
}
