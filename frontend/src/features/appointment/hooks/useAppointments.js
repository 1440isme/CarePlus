import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  searchPatients,
  bookAppointmentByReceptionist
} from '../services/appointment.service.js';
import { QUERY_KEYS } from '../../../shared/constants/query-keys.js';

export function useAppointments(params) {
  return useQuery({
    queryKey: QUERY_KEYS.appointments(params),
    queryFn: () => getAppointments(params),
  });
}

export function useAppointmentDetail(id) {
  return useQuery({
    queryKey: QUERY_KEYS.appointmentDetail(id),
    queryFn: () => getAppointmentById(id),
    enabled: Boolean(id),
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => updateAppointmentStatus(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment-detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['doctor-dashboard'] });
    },
  });
}

export function useSearchPatients(params, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.patientsSearch(params),
    queryFn: () => searchPatients(params),
    enabled: Boolean(params?.search && params.search.trim().length >= 2),
    ...options,
  });
}

export function useBookAppointmentByReceptionist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookAppointmentByReceptionist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['timeslots'] });
    },
  });
}
