import { useQuery } from '@tanstack/react-query';
import { getMe } from '../services/user.service.js';
import { USER_QUERY_KEYS } from '../types/user.types.js';

export function useMe(options = {}) {
  return useQuery({
    queryKey: USER_QUERY_KEYS.me,
    queryFn: getMe,
    ...options,
  });
}

