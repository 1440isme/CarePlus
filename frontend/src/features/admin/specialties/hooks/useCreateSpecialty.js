import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSpecialty } from '../services/admin-specialty.service.js';
import { ADMIN_SPECIALTY_QUERY_KEYS } from '../types/admin-specialty.types.js';

export function useCreateSpecialty(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...mutationOptions } = options;

  return useMutation({
    mutationFn: createSpecialty,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_SPECIALTY_QUERY_KEYS.all] });
      onSuccess?.(data, variables, context);
    },
    ...mutationOptions,
  });
}
