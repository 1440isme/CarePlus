export const QUERY_KEYS = {
  doctors: ['doctors'],
  doctorDetail: (doctorId) => ['doctor-detail', doctorId],
  doctorProfile: ['doctor-profile'],
  doctorDashboard: ['doctor-dashboard'],
  schedules: (params) => ['schedules', params],
  doctorSchedules: (doctorId, params) => ['doctor-schedules', doctorId, params],
  timeSlots: (params) => ['timeslots', params],
  approvalRequests: (params) => ['approval-requests', params],
  users: (params) => ['users', params],
  me: ['me'],
};
