export const ADMIN_SPECIALTY_API_PATHS = {
  listRoot: '/specialties/admin',
  root: '/specialties',
  detail: (id) => `/specialties/${id}`,
};

export const ADMIN_SPECIALTY_QUERY_KEYS = {
  all: 'admin-specialties',
};

export const ADMIN_SPECIALTY_STATUS_LABELS = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Ngưng hoạt động',
};
