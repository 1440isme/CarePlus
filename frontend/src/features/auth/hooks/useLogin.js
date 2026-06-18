import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { login } from '../services/auth.service.js';
import { setCredentials } from '../store/auth.slice.js';
import { persistAuthSession } from '../store/auth.storage.js';

export function useLogin(options = {}) {
  const dispatch = useDispatch();
  const { onSuccess, ...mutationOptions } = options;

  return useMutation({
    mutationFn: login,
    ...mutationOptions,
    onSuccess: (response, variables, context) => {
      const accessToken = response?.data?.accessToken;
      const user = response?.data?.user ?? null;
      const rememberMe = Boolean(variables?.rememberMe);

      if (accessToken && user) {
        persistAuthSession({
          user,
          accessToken,
          rememberMe,
        });

        dispatch(
          setCredentials({
            user,
            accessToken,
          }),
        );
      }

      onSuccess?.(response, variables, context);
    },
  });
}
