import { useMutation } from '@tanstack/react-query';
import { resetPassword } from '../services/auth.service.js';

export function useResetPassword(options = {}) {
  return useMutation({
    mutationFn: resetPassword,
    ...options,
  });
}

