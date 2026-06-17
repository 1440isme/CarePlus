import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { login } from '../services/auth.service.js';
import { setCredentials } from '../store/auth.slice.js';

export function useLogin(options = {}) {
  const dispatch = useDispatch();
  const { onSuccess, ...mutationOptions } = options;

  return useMutation({
    mutationFn: login,
    ...mutationOptions,
    onSuccess: (response, variables, context) => {
      const accessToken = response?.data?.accessToken;
      const user = response?.data?.user ?? null;

      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }

      if (user) {
        localStorage.setItem('authUser', JSON.stringify(user));
      }

      if (accessToken && user) {
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
