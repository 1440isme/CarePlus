import { useQuery } from '@tanstack/react-query';
import { getDoctors } from '../services/doctor.service.js';
import { QUERY_KEYS } from '../../../shared/constants/query-keys.js';

export function useDoctorList(params) {
  return useQuery({
    queryKey: [...QUERY_KEYS.doctors, params],
    queryFn: () => getDoctors(params),
  });
}
