import { useMutation } from '@tanstack/react-query';
import { verifyEmail } from '../services/auth.service.js';

export function useVerifyEmail(options = {}) {
  return useMutation({
    mutationFn: verifyEmail,
    ...options,
  });
}

