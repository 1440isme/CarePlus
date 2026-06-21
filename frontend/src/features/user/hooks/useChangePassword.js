import { useMutation } from '@tanstack/react-query';
import { changePassword } from '../services/user.service.js';

export function useChangePassword(options = {}) {
  return useMutation({
    mutationFn: changePassword,
    ...options,
  });
}
