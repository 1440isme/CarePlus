import { useQuery } from '@tanstack/react-query';
import { getPatientProfiles } from '../services/patient-profile.service.js';
import { PATIENT_PROFILE_QUERY_KEYS } from '../types/patient-profile.types.js';

export function usePatientProfiles(params = {}, options = {}) {
  return useQuery({
    queryKey: PATIENT_PROFILE_QUERY_KEYS.list(params),
    queryFn: () => getPatientProfiles(params),
    ...options,
  });
}
