import { useQuery } from '@tanstack/react-query';
import { getAdminUserDetail } from '../services/admin-user.service.js';
import { ADMIN_USER_QUERY_KEYS } from '../types/admin-user.types.js';

export function useAdminUserDetail(userId, options = {}) {
  return useQuery({
    queryKey: ADMIN_USER_QUERY_KEYS.detail(userId),
    queryFn: () => getAdminUserDetail(userId),
    enabled: Boolean(userId),
    ...options,
  });
}
