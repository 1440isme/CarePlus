import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateClinicInfo } from '../services/clinic-settings.service.js';
import { CLINIC_SETTINGS_QUERY_KEYS } from '../types/clinic-settings.types.js';

export function useUpdateClinicInfo(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateClinicInfo,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: [CLINIC_SETTINGS_QUERY_KEYS.clinicInfo],
      });

      if (typeof options.onSuccess === 'function') {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}
