import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { logout } from '../services/auth.service.js';
import { clearAuth } from '../store/auth.slice.js';

export function useLogout(options = {}) {
  const dispatch = useDispatch();
  const { onSuccess, ...mutationOptions } = options;

  return useMutation({
    mutationFn: logout,
    ...mutationOptions,
    onSuccess: (response, variables, context) => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('authUser');
      dispatch(clearAuth());
      onSuccess?.(response, variables, context);
    },
  });
}
