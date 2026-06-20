import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUserStatus } from '../services/admin-user.service.js';
import { ADMIN_USER_QUERY_KEYS } from '../types/admin-user.types.js';

export function useUpdateUserStatus(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...mutationOptions } = options;

  return useMutation({
    mutationFn: ({ userId, status }) => updateUserStatus(userId, status),
    ...mutationOptions,
    onSuccess: async (response, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_USER_QUERY_KEYS.all });
      onSuccess?.(response, variables, context);
    },
  });
}
