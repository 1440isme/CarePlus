import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAdminUser } from '../services/admin-user.service.js';
import { ADMIN_USER_QUERY_KEYS } from '../types/admin-user.types.js';

export function useUpdateAdminUser(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...mutationOptions } = options;

  return useMutation({
    mutationFn: ({ userId, payload }) => updateAdminUser(userId, payload),
    ...mutationOptions,
    onSuccess: async (response, variables, context) => {
      const updatedUser = response?.data ?? null;

      if (variables?.userId && updatedUser) {
        queryClient.setQueryData(
          ADMIN_USER_QUERY_KEYS.detail(variables.userId),
          (previousValue) => ({
            ...previousValue,
            data: {
              ...(previousValue?.data ?? {}),
              ...updatedUser,
            },
          }),
        );

        queryClient.setQueriesData(
          { queryKey: ADMIN_USER_QUERY_KEYS.all },
          (previousValue) => {
            if (!Array.isArray(previousValue?.data)) {
              return previousValue;
            }

            return {
              ...previousValue,
              data: previousValue.data.map((user) => (
                user.id === variables.userId
                  ? { ...user, ...updatedUser }
                  : user
              )),
            };
          },
        );
      }

      await queryClient.invalidateQueries({ queryKey: ADMIN_USER_QUERY_KEYS.all });
      if (variables?.userId) {
        await queryClient.invalidateQueries({ queryKey: ADMIN_USER_QUERY_KEYS.detail(variables.userId) });
      }
      onSuccess?.(response, variables, context);
    },
  });
}
