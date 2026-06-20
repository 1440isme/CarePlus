import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMe,
  getUsers,
  resetNoShowCount,
  updateMe,
  updateUserStatus,
} from '../services/user.service.js';
import { QUERY_KEYS } from '../../../shared/constants/query-keys.js';

export function useMe() {
  return useQuery({
    queryKey: QUERY_KEYS.me,
    queryFn: getMe,
  });
}

export function useUsers(params) {
  return useQuery({
    queryKey: QUERY_KEYS.users(params),
    queryFn: () => getUsers(params),
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.me });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useResetNoShowCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resetNoShowCount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
