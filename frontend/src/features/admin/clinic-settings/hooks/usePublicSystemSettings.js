import { useQuery } from '@tanstack/react-query';
import { getPublicSystemSettings } from '../services/clinic-settings.service.js';
import { SYSTEM_SETTINGS_QUERY_KEYS } from '../types/system-settings.types.js';

export function usePublicSystemSettings(options = {}) {
  return useQuery({
    queryKey: [SYSTEM_SETTINGS_QUERY_KEYS.all, 'public'],
    queryFn: getPublicSystemSettings,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}
