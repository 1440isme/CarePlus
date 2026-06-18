import { useQuery } from '@tanstack/react-query';
import { getTimeSlots } from '../services/timeslot.service.js';
import { QUERY_KEYS } from '../../../shared/constants/query-keys.js';

export function useTimeSlots(params) {
  return useQuery({
    queryKey: QUERY_KEYS.timeSlots(params),
    queryFn: () => getTimeSlots(params),
    enabled: Boolean(params?.doctorId && params?.date),
  });
}
