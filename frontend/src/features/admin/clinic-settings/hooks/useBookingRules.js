import { useQuery } from '@tanstack/react-query';
import { getBookingRules } from '../services/clinic-settings.service.js';
import { SYSTEM_SETTINGS_QUERY_KEYS } from '../types/system-settings.types.js';

export function useBookingRules(options = {}) {
  return useQuery({
    queryKey: [SYSTEM_SETTINGS_QUERY_KEYS.all, 'booking-rules'],
    queryFn: getBookingRules,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}
