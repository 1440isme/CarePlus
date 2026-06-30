/**
 * @typedef {Object} Specialty
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {string | null | undefined} [description]
 * @property {string | null | undefined} [icon]
 * @property {number | undefined} [doctorCount]
 * @property {boolean | undefined} [active]
 * @property {string | undefined} [createdAt]
 * @property {string | undefined} [updatedAt]
 */

/**
 * @typedef {Object} SpecialtyListQuery
 * @property {number} page
 * @property {number} limit
 * @property {string | undefined} [search]
 */

/**
 * @typedef {Object} SpecialtyFormValues
 * @property {string} name
 * @property {string} description
 * @property {boolean} active
 */

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
