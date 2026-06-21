import { useQuery } from '@tanstack/react-query';
import { getSystemSettings } from '../services/clinic-settings.service.js';
import { SYSTEM_SETTINGS_QUERY_KEYS } from '../types/system-settings.types.js';

export function useSystemSettings(options = {}) {
  return useQuery({
    queryKey: [SYSTEM_SETTINGS_QUERY_KEYS.all],
    queryFn: getSystemSettings,
    ...options,
  });
}
