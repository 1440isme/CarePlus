import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSystemSettings } from '../services/clinic-settings.service.js';
import { SYSTEM_SETTINGS_QUERY_KEYS } from '../types/system-settings.types.js';

export function useUpdateSystemSettings(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSystemSettings,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: [SYSTEM_SETTINGS_QUERY_KEYS.all],
      });

      if (typeof options.onSuccess === 'function') {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}
