import { useQuery } from '@tanstack/react-query';
import { getDoctorDashboard } from '../services/doctor.service.js';
import { QUERY_KEYS } from '../../../shared/constants/query-keys.js';

export function useDoctorDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.doctorDashboard,
    queryFn: getDoctorDashboard,
  });
}
