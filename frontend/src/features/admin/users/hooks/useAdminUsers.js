import { useQuery } from '@tanstack/react-query';
import { getAdminUsers } from '../services/admin-user.service.js';
import { ADMIN_USER_QUERY_KEYS } from '../types/admin-user.types.js';

export function useAdminUsers(params, options = {}) {
  return useQuery({
    queryKey: ADMIN_USER_QUERY_KEYS.list(params),
    queryFn: () => getAdminUsers(params),
    ...options,
  });
}
