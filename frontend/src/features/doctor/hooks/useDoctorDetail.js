import { useQuery } from '@tanstack/react-query';
import { getDoctorById } from '../services/doctor.service.js';
import { QUERY_KEYS } from '../../../shared/constants/query-keys.js';

export function useDoctorDetail(doctorId) {
  return useQuery({
    queryKey: QUERY_KEYS.doctorDetail(doctorId),
    queryFn: () => getDoctorById(doctorId),
    enabled: Boolean(doctorId),
  });
}
