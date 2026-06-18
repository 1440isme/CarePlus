import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setDefaultPatientProfile } from '../services/patient-profile.service.js';
import { PATIENT_PROFILE_QUERY_KEYS } from '../types/patient-profile.types.js';

export function useSetDefaultPatientProfile(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...mutationOptions } = options;

  return useMutation({
    mutationFn: setDefaultPatientProfile,
    ...mutationOptions,
    onSuccess: async (response, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: PATIENT_PROFILE_QUERY_KEYS.all });
      onSuccess?.(response, variables, context);
    },
  });
}
