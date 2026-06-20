export const ADMIN_USER_API_PATHS = {
  root: '/users',
  staff: '/users/staff',
  detail: (userId) => `/users/${userId}`,
  status: (userId) => `/users/${userId}/status`,
  resetNoShow: (userId) => `/users/${userId}/reset-no-show`,
};

export const ADMIN_USER_QUERY_KEYS = {
  all: ['admin-users'],
  list: (params = {}) => ['admin-users', params],
};

export const ADMIN_USER_ROLE_OPTIONS = [
  { value: 'ALL', label: 'Tất cả vai trò' },
  { value: 'PATIENT', label: 'Bệnh nhân' },
  { value: 'DOCTOR', label: 'Bác sĩ' },
  { value: 'RECEPTIONIST', label: 'Lễ tân' },
  { value: 'ADMIN', label: 'Quản trị viên' },
];

export const ADMIN_USER_STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'LOCKED', label: 'Đã khóa' },
];

export const ADMIN_USER_ROLE_LABELS = Object.fromEntries(
  ADMIN_USER_ROLE_OPTIONS.filter((option) => option.value !== 'ALL').map((option) => [option.value, option.label]),
);

export const ADMIN_USER_STATUS_LABELS = Object.fromEntries(
  ADMIN_USER_STATUS_OPTIONS.filter((option) => option.value !== 'ALL').map((option) => [option.value, option.label]),
);

export const ADMIN_USER_VERIFIED_LABELS = {
  true: 'Đã xác minh',
  false: 'Chưa xác minh',
};

/**
 * @typedef {'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN'} UserRole
 * @typedef {'ACTIVE' | 'LOCKED'} UserStatus
 */

/**
 * @typedef {Object} AdminUser
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string | null | undefined} [phone]
 * @property {UserRole} role
 * @property {UserStatus} status
 * @property {boolean | undefined} [emailVerified]
 * @property {number} noShowCount
 * @property {string} createdAt
 */

/**
 * @typedef {Object} AdminUsersQuery
 * @property {number} page
 * @property {number} limit
 * @property {string | undefined} [search]
 * @property {UserRole | undefined} [role]
 * @property {UserStatus | undefined} [status]
 */
