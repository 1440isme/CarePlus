import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { QUERY_KEYS } from '../../../shared/constants/query-keys.js';
import { setCredentials } from '../../auth/store/auth.slice.js';
import { getRememberMePreference, persistAuthSession } from '../../auth/store/auth.storage.js';
import { updateMyAvatar } from '../services/user.service.js';
import { USER_QUERY_KEYS } from '../types/user.types.js';

export function useUpdateMyAvatar(options = {}) {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const { onSuccess, ...mutationOptions } = options;

  return useMutation({
    mutationFn: updateMyAvatar,
    ...mutationOptions,
    onSuccess: async (response, variables, context) => {
      const updatedUser = response?.data?.user ?? null;

      if (updatedUser && accessToken) {
        persistAuthSession({
          user: updatedUser,
          accessToken,
          rememberMe: getRememberMePreference(),
        });

        dispatch(setCredentials({
          user: updatedUser,
          accessToken,
        }));
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.me }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.me }),
      ]);

      onSuccess?.(response, variables, context);
    },
  });
}
