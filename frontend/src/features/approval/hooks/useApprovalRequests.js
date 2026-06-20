import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveRequest,
  createScheduleException,
  getApprovalRequests,
  rejectRequest,
} from '../services/approval.service.js';
import { QUERY_KEYS } from '../../../shared/constants/query-keys.js';

export function useApprovalRequests(params) {
  return useQuery({
    queryKey: QUERY_KEYS.approvalRequests(params),
    queryFn: () => getApprovalRequests(params),
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createScheduleException,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-dashboard'] });
    },
  });
}

export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-dashboard'] });
    },
  });
}
