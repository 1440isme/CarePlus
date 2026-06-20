import { useMutation } from '@tanstack/react-query';
import { forgotPassword } from '../services/auth.service.js';

export function useForgotPassword(options = {}) {
  return useMutation({
    mutationFn: forgotPassword,
    ...options,
  });
}

