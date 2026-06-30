import axiosInstance from '../../../shared/services/axios.instance.js';

export async function getApprovalRequests(params) {
  const response = await axiosInstance.get('/approval-requests', { params });
  return response.data;
}

export async function createScheduleException(payload) {
  const response = await axiosInstance.post('/approval-requests/schedule-exception', payload);
  return response.data;
}

export async function approveRequest(requestId) {
  const response = await axiosInstance.patch(`/approval-requests/${requestId}/approve`);
  return response.data;
}

export async function rejectRequest({ requestId, rejectionReason }) {
  const response = await axiosInstance.patch(`/approval-requests/${requestId}/reject`, { rejectionReason });
  return response.data;
}
