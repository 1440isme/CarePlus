import { useMutation } from '@tanstack/react-query';
import { resendVerificationOtp } from '../services/auth.service.js';

export function useResendVerificationOtp(options = {}) {
  return useMutation({
    mutationFn: resendVerificationOtp,
    ...options,
  });
}

