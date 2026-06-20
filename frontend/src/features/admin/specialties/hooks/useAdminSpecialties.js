import { useQuery } from '@tanstack/react-query';
import { getAdminSpecialties } from '../services/admin-specialty.service.js';
import { ADMIN_SPECIALTY_QUERY_KEYS } from '../types/admin-specialty.types.js';

export function useAdminSpecialties(params, options = {}) {
  return useQuery({
    queryKey: [ADMIN_SPECIALTY_QUERY_KEYS.all, params],
    queryFn: () => getAdminSpecialties(params),
    ...options,
  });
}
