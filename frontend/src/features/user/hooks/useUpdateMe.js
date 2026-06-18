import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMe } from '../services/user.service.js';
import { USER_QUERY_KEYS } from '../types/user.types.js';

export function useUpdateMe(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...mutationOptions } = options;

  return useMutation({
    mutationFn: updateMe,
    ...mutationOptions,
    onSuccess: async (response, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.me });
      onSuccess?.(response, variables, context);
    },
  });
}

