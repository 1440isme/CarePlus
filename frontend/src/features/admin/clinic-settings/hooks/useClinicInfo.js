import { useQuery } from '@tanstack/react-query';
import { getClinicInfo } from '../services/clinic-settings.service.js';
import { CLINIC_SETTINGS_QUERY_KEYS } from '../types/clinic-settings.types.js';

export function useClinicInfo(options = {}) {
  return useQuery({
    queryKey: [CLINIC_SETTINGS_QUERY_KEYS.clinicInfo],
    queryFn: getClinicInfo,
    ...options,
  });
}
