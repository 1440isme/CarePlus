import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPatientProfile } from '../services/patient-profile.service.js';
import { PATIENT_PROFILE_QUERY_KEYS } from '../types/patient-profile.types.js';

export function useCreatePatientProfile(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...mutationOptions } = options;

  return useMutation({
    mutationFn: createPatientProfile,
    ...mutationOptions,
    onSuccess: async (response, variables, context) => {
      // Invalidate and refetch all patient profile queries to force immediate UI updates
      await queryClient.invalidateQueries({ queryKey: ['patient-profiles'] });
      await queryClient.invalidateQueries({ queryKey: ['patient-profiles', {}] });
      await queryClient.refetchQueries({ queryKey: ['patient-profiles'] });
      await queryClient.refetchQueries({ queryKey: ['patient-profiles', {}] });
      
      onSuccess?.(response, variables, context);
    },
  });
}
