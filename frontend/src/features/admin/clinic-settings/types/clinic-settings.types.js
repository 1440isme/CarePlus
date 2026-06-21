/**
 * @typedef {Object} ClinicInfo
 * @property {string | undefined} [id]
 * @property {string} name
 * @property {string} address
 * @property {string | null | undefined} [hotline]
 * @property {string | null | undefined} [email]
 * @property {string | null | undefined} [workingHours]
 * @property {string | null | undefined} [description]
 * @property {string | undefined} [createdAt]
 * @property {string | undefined} [updatedAt]
 */

/**
 * @typedef {Object} ClinicInfoFormValues
 * @property {string} name
 * @property {string} address
 * @property {string} hotline
 * @property {string} email
 * @property {string} workingHours
 * @property {string} description
 */

export const CLINIC_SETTINGS_API_PATHS = {
  clinicInfo: '/clinic-settings/clinic-info',
};

export const CLINIC_SETTINGS_QUERY_KEYS = {
  clinicInfo: 'clinic-info',
};
