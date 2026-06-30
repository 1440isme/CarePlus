import { useMutation } from '@tanstack/react-query';
import { register } from '../services/auth.service.js';

export function useRegister(options = {}) {
  return useMutation({
    mutationFn: register,
    ...options,
  });
}

