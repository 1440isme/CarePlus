import { useQuery } from '@tanstack/react-query';
import { getSpecialties } from '../services/specialty.service.js';
import { QUERY_KEYS } from '../../../shared/constants/query-keys.js';

export function useSpecialties(params) {
  return useQuery({
    queryKey: QUERY_KEYS.specialties(params),
    queryFn: () => getSpecialties(params),
  });
}
