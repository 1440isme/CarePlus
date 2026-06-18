export const USER_API_PATHS = {
  me: '/users/me',
};

export const USER_QUERY_KEYS = {
  me: ['me'],
};

/**
 * @typedef {Object} CurrentUser
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string | null | undefined} [phone]
 * @property {'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN'} role
 * @property {'ACTIVE' | 'LOCKED'} status
 * @property {boolean} emailVerified
 * @property {number | undefined} [noShowCount]
 * @property {'MALE' | 'FEMALE' | 'OTHER' | null | undefined} [gender]
 * @property {string | null | undefined} [dateOfBirth]
 * @property {string | null | undefined} [address]
 * @property {string | undefined} [createdAt]
 * @property {string | undefined} [updatedAt]
 */

/**
 * @typedef {Object} UpdateMeRequest
 * @property {string} name
 * @property {string} phone
 * @property {'MALE' | 'FEMALE' | 'OTHER'} [gender]
 * @property {string} [dateOfBirth]
 * @property {string} [address]
 */

/**
 * @typedef {Object} UpdateMeResponse
 * @property {string} message
 * @property {CurrentUser} user
 */
