import { useMutation, useQueryClient } from '@tanstack/react-query';
import { resetUserNoShowCount } from '../services/admin-user.service.js';
import { ADMIN_USER_QUERY_KEYS } from '../types/admin-user.types.js';

export function useResetUserNoShowCount(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...mutationOptions } = options;

  return useMutation({
    mutationFn: ({ userId }) => resetUserNoShowCount(userId),
    ...mutationOptions,
    onSuccess: async (response, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_USER_QUERY_KEYS.all });
      if (variables?.userId) {
        await queryClient.invalidateQueries({ queryKey: ADMIN_USER_QUERY_KEYS.detail(variables.userId) });
      }
      onSuccess?.(response, variables, context);
    },
  });
}
